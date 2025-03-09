import { nanoid } from 'nanoid';
import toast from 'react-hot-toast';
import { FileTransfer } from '../types';

// Configuration
const CHUNK_SIZE = 16384; // 16KB chunks
const CONNECTION_TIMEOUT = 15000; // 15 seconds
const RECONNECT_ATTEMPTS = 3;

// Get the WebSocket URL based on the current environment
const getWebSocketUrl = () => {
  const isProduction = import.meta.env.PROD;
  if (isProduction) {
    // In production, use a secure WebSocket connection
    return `wss://${window.location.hostname}/ws`;
  }
  // In development, use local WebSocket server
  return `ws://${window.location.hostname}:8080`;
};

const RELAY_SERVER_URL = getWebSocketUrl();

// Connection types
type ConnectionMode = 'direct' | 'relay' | 'disconnected';
type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'failed';

// Event types
type MessageType = 
  | 'connection-request' 
  | 'connection-accept'
  | 'connection-reject'
  | 'file-start'
  | 'file-chunk'
  | 'file-complete'
  | 'ping'
  | 'pong'
  | 'disconnect';

interface Message {
  type: MessageType;
  senderId: string;
  targetId?: string;
  payload?: any;
  timestamp: number;
}

interface PeerConnection {
  id: string;
  connected: boolean;
  mode: ConnectionMode;
  lastActivity: number;
}

interface FileTransferState {
  chunks: ArrayBuffer[];
  metadata: {
    id: string;
    name: string;
    size: number;
    type: string;
  };
  totalChunks: number;
  receivedChunks: number;
}

export class PeerService {
  private peerId: string;
  private connections: Map<string, PeerConnection>;
  private websocket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private pingInterval: number | null = null;
  private activeTransfers: Map<string, FileTransferState>;
  private messageQueue: Map<string, Message[]>;
  private listeners: Map<string, Set<(data: any) => void>>;
  private connectionStatus: ConnectionStatus = 'idle';
  private pendingConnections: Set<string>;
  private encryptionKey: CryptoKey | null = null;

  constructor() {
    this.peerId = nanoid();
    this.connections = new Map();
    this.activeTransfers = new Map();
    this.messageQueue = new Map();
    this.listeners = new Map();
    this.pendingConnections = new Set();
    
    // Initialize encryption key and connect to relay server
    this.initialize();
  }

  private async initialize() {
    await this.initializeEncryption();
    this.connectToRelayServer();
  }

  // Public methods
  public getPeerId(): string {
    return this.peerId;
  }

  public getConnections(): PeerConnection[] {
    return Array.from(this.connections.values());
  }

  public getPendingConnections(): string[] {
    return Array.from(this.pendingConnections);
  }

  public getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  public async connectToPeer(targetPeerId: string): Promise<boolean> {
    if (targetPeerId === this.peerId) {
      toast.error("Cannot connect to yourself");
      return false;
    }

    if (this.connections.has(targetPeerId)) {
      toast.info("Already connected to this peer");
      return true;
    }

    this.connectionStatus = 'connecting';
    toast.loading('Connecting to peer...', { id: 'connect' });

    // Send connection request through relay server
    const success = await this.sendMessage({
      type: 'connection-request',
      senderId: this.peerId,
      targetId: targetPeerId,
      timestamp: Date.now()
    });

    if (!success) {
      this.connectionStatus = 'failed';
      toast.error('Failed to send connection request', { id: 'connect' });
      return false;
    }

    // Set connection timeout
    const timeout = setTimeout(() => {
      if (this.connectionStatus === 'connecting') {
        this.connectionStatus = 'failed';
        toast.error('Connection timed out', { id: 'connect' });
      }
    }, CONNECTION_TIMEOUT);

    // Wait for connection to be established
    return new Promise((resolve) => {
      const checkConnection = setInterval(() => {
        if (this.connectionStatus === 'connected') {
          clearTimeout(timeout);
          clearInterval(checkConnection);
          resolve(true);
        } else if (this.connectionStatus === 'failed') {
          clearTimeout(timeout);
          clearInterval(checkConnection);
          resolve(false);
        }
      }, 500);
    });
  }

  public acceptConnection(peerId: string): void {
    if (!this.pendingConnections.has(peerId)) {
      return;
    }

    this.pendingConnections.delete(peerId);
    
    // Send acceptance message
    this.sendMessage({
      type: 'connection-accept',
      senderId: this.peerId,
      targetId: peerId,
      timestamp: Date.now()
    });

    // Add to connections
    this.connections.set(peerId, {
      id: peerId,
      connected: true,
      mode: 'relay',
      lastActivity: Date.now()
    });

    toast.success('Connection accepted');
    this.emit('connection', { peerId });
  }

  public rejectConnection(peerId: string): void {
    if (!this.pendingConnections.has(peerId)) {
      return;
    }

    this.pendingConnections.delete(peerId);
    
    // Send rejection message
    this.sendMessage({
      type: 'connection-reject',
      senderId: this.peerId,
      targetId: peerId,
      timestamp: Date.now()
    });

    toast.success('Connection rejected');
  }

  public disconnectPeer(peerId: string): void {
    if (!this.connections.has(peerId)) {
      return;
    }

    // Send disconnect message
    this.sendMessage({
      type: 'disconnect',
      senderId: this.peerId,
      targetId: peerId,
      timestamp: Date.now()
    });

    this.connections.delete(peerId);
    toast.success('Disconnected from peer');
    this.emit('disconnection', { peerId });
  }

  public async sendFile(file: File, targetPeerId: string): Promise<boolean> {
    if (!this.connections.has(targetPeerId)) {
      toast.error('Not connected to peer');
      return false;
    }

    const transferId = nanoid();
    try {
      toast.loading(`Preparing ${file.name} for transfer...`, { id: transferId });

      // Create file metadata
      const fileMetadata = {
        id: transferId,
        name: file.name,
        size: file.size,
        type: file.type
      };

      // Notify about transfer start
      this.emit('fileTransferStart', {
        ...fileMetadata,
        progress: 0,
        status: 'transferring'
      });

      // Send file start message
      const startSuccess = await this.sendMessage({
        type: 'file-start',
        senderId: this.peerId,
        targetId: targetPeerId,
        payload: fileMetadata,
        timestamp: Date.now()
      });

      if (!startSuccess) {
        throw new Error('Failed to initiate file transfer');
      }

      // Read and send file in chunks
      const reader = new FileReader();
      const chunkSize = CHUNK_SIZE;
      const totalChunks = Math.ceil(file.size / chunkSize);
      let currentChunk = 0;

      const readNextChunk = () => {
        const start = currentChunk * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const blob = file.slice(start, end);
        reader.readAsArrayBuffer(blob);
      };

      reader.onload = async (e) => {
        if (!e.target?.result) return;

        const chunk = e.target.result;
        const chunkSuccess = await this.sendMessage({
          type: 'file-chunk',
          senderId: this.peerId,
          targetId: targetPeerId,
          payload: {
            transferId,
            chunkIndex: currentChunk,
            totalChunks,
            chunk: Array.from(new Uint8Array(chunk as ArrayBuffer))
          },
          timestamp: Date.now()
        });

        if (!chunkSuccess) {
          throw new Error(`Failed to send chunk ${currentChunk}`);
        }

        const progress = ((currentChunk + 1) / totalChunks) * 100;
        this.emit('fileTransferProgress', {
          id: transferId,
          progress,
          status: 'transferring'
        });

        currentChunk++;
        if (currentChunk < totalChunks) {
          setTimeout(readNextChunk, 10); // Add small delay between chunks
        } else {
          // Send file complete message
          await this.sendMessage({
            type: 'file-complete',
            senderId: this.peerId,
            targetId: targetPeerId,
            payload: { transferId },
            timestamp: Date.now()
          });

          this.emit('fileTransferComplete', {
            id: transferId,
            status: 'completed'
          });
          
          toast.success(`${file.name} sent successfully!`, { id: transferId });
        }
      };

      reader.onerror = (error) => {
        throw error;
      };

      readNextChunk();
      return true;
    } catch (error) {
      console.error('File transfer failed:', error);
      toast.error('Failed to send file', { id: transferId });
      
      this.emit('fileTransferError', {
        id: transferId,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return false;
    }
  }

  public on(event: string, callback: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);
  }

  public off(event: string, callback: (data: any) => void): void {
    this.listeners.get(event)?.delete(callback);
  }

  // Private methods
  private emit(event: string, data: any): void {
    this.listeners.get(event)?.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in ${event} listener:`, error);
      }
    });
  }

  private async initializeEncryption(): Promise<void> {
    try {
      const key = await window.crypto.subtle.generateKey(
        {
          name: 'AES-GCM',
          length: 256,
        },
        true,
        ['encrypt', 'decrypt']
      );
      this.encryptionKey = key;
    } catch (error) {
      console.error('Failed to initialize encryption:', error);
    }
  }

  private connectToRelayServer(): void {
    try {
      if (this.websocket) {
        this.websocket.close();
      }

      console.log('Connecting to relay server:', RELAY_SERVER_URL);
      this.websocket = new WebSocket(RELAY_SERVER_URL);
      
      this.websocket.onopen = () => {
        console.log('Connected to relay server');
        this.reconnectAttempts = 0;
        
        // Register with the relay server
        this.websocket?.send(JSON.stringify({
          type: 'register',
          peerId: this.peerId
        }));
        
        // Start ping interval to keep connection alive
        this.startPingInterval();
        
        // Process any queued messages
        this.processMessageQueue();
      };
      
      this.websocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleIncomingMessage(message);
        } catch (error) {
          console.error('Failed to parse message:', error);
        }
      };
      
      this.websocket.onclose = () => {
        console.log('Disconnected from relay server');
        this.stopPingInterval();
        
        // Attempt to reconnect
        if (this.reconnectAttempts < RECONNECT_ATTEMPTS) {
          this.reconnectAttempts++;
          setTimeout(() => this.connectToRelayServer(), 1000 * this.reconnectAttempts);
        }
      };
      
      this.websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to connect to relay server:', error);
    }
  }

  private startPingInterval(): void {
    this.pingInterval = window.setInterval(() => {
      if (this.websocket?.readyState === WebSocket.OPEN) {
        this.websocket.send(JSON.stringify({
          type: 'ping',
          peerId: this.peerId,
          timestamp: Date.now()
        }));
      }
    }, 30000) as unknown as number;
  }

  private stopPingInterval(): void {
    if (this.pingInterval !== null) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private async sendMessage(message: Message): Promise<boolean> {
    // If not connected to relay server, queue the message
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      this.queueMessage(message);
      return false;
    }

    try {
      this.websocket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Failed to send message:', error);
      this.queueMessage(message);
      return false;
    }
  }

  private queueMessage(message: Message): void {
    const targetId = message.targetId;
    if (!targetId) return;
    
    if (!this.messageQueue.has(targetId)) {
      this.messageQueue.set(targetId, []);
    }
    
    this.messageQueue.get(targetId)?.push(message);
  }

  private processMessageQueue(): void {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      return;
    }
    
    this.messageQueue.forEach((messages, targetId) => {
      messages.forEach(message => {
        try {
          this.websocket?.send(JSON.stringify(message));
        } catch (error) {
          console.error('Failed to send queued message:', error);
        }
      });
      
      this.messageQueue.delete(targetId);
    });
  }

  private handleIncomingMessage(message: Message): void {
    if (!message.type) return;

    console.log('Received message:', message.type, message); // Add logging
    
    // Update last activity for the connection
    if (message.senderId && this.connections.has(message.senderId)) {
      const connection = this.connections.get(message.senderId)!;
      connection.lastActivity = Date.now();
      this.connections.set(message.senderId, connection);
    }
    
    switch (message.type) {
      case 'connection-request':
        if (message.senderId) {
          console.log('Received connection request from:', message.senderId);
          // Add to pending connections if not already connected
          if (!this.connections.has(message.senderId)) {
            this.pendingConnections.add(message.senderId);
            // Notify user
            this.emit('connectionRequest', { peerId: message.senderId });
            toast.success('New connection request received!');
          }
        }
        break;
      case 'connection-accept':
        this.handleConnectionAccept(message);
        break;
      case 'connection-reject':
        this.handleConnectionReject(message);
        break;
      case 'file-start':
        this.handleFileStart(message);
        break;
      case 'file-chunk':
        this.handleFileChunk(message);
        break;
      case 'file-complete':
        this.handleFileComplete(message);
        break;
      case 'disconnect':
        this.handleDisconnect(message);
        break;
      case 'ping':
        // Respond with pong
        if (message.senderId) {
          this.sendMessage({
            type: 'pong',
            senderId: this.peerId,
            targetId: message.senderId,
            timestamp: Date.now()
          });
        }
        break;
      case 'pong':
        // Just update last activity, already done above
        break;
    }
  }

  private handleConnectionAccept(message: Message): void {
    if (!message.senderId) return;
    
    console.log('Connection accepted by:', message.senderId);
    
    // Add to connections
    this.connections.set(message.senderId, {
      id: message.senderId,
      connected: true,
      mode: 'relay',
      lastActivity: Date.now()
    });
    
    this.connectionStatus = 'connected';
    toast.success('Connected successfully!', { id: 'connect' });
    
    // Notify listeners
    this.emit('connection', { peerId: message.senderId });
  }

  private handleConnectionReject(message: Message): void {
    if (!message.senderId) return;
    
    console.log('Connection rejected by:', message.senderId);
    this.connectionStatus = 'failed';
    toast.error('Connection rejected by peer', { id: 'connect' });
  }

  private handleFileStart(message: Message): void {
    if (!message.senderId || !message.payload) return;
    
    const { id, name, size, type } = message.payload;
    
    // Create new file transfer
    this.activeTransfers.set(id, {
      chunks: [],
      metadata: { id, name, size, type },
      totalChunks: Math.ceil(size / CHUNK_SIZE),
      receivedChunks: 0
    });
    
    // Notify listeners
    this.emit('fileTransferStart', {
      id,
      name,
      size,
      type,
      progress: 0,
      status: 'pending',
      senderId: message.senderId
    });
    
    toast.loading(`Receiving ${name}...`, { id });
  }

  private async handleFileChunk(message: Message): void {
    if (!message.senderId || !message.payload) return;
    
    const { transferId, chunkIndex, totalChunks, chunk } = message.payload;
    
    // Get file transfer
    const transfer = this.activeTransfers.get(transferId);
    if (!transfer) return;
    
    // Convert chunk back to ArrayBuffer
    const arrayBuffer = new Uint8Array(chunk).buffer;
    
    // Store chunk
    transfer.chunks[chunkIndex] = arrayBuffer;
    transfer.receivedChunks++;
    
    // Update progress
    const progress = (transfer.receivedChunks / totalChunks) * 100;
    
    // Notify listeners
    this.emit('fileTransferProgress', {
      id: transferId,
      progress,
      status: 'transferring'
    });
  }

  private async handleFileComplete(message: Message): void {
    if (!message.senderId || !message.payload) return;
    
    const { transferId } = message.payload;
    
    // Get file transfer
    const transfer = this.activeTransfers.get(transferId);
    if (!transfer) return;
    
    try {
      // Combine chunks
      const completeFile = new Blob(transfer.chunks, { type: transfer.metadata.type });
      const url = URL.createObjectURL(completeFile);
      
      // Notify listeners
      this.emit('fileTransferComplete', {
        id: transferId,
        status: 'completed',
        url
      });
      
      toast.success(`${transfer.metadata.name} received successfully!`, { id: transferId });
      
      // Download file
      const a = document.createElement('a');
      a.href = url;
      a.download = transfer.metadata.name;
      a.click();
      URL.revokeObjectURL(url);
      
      // Clean up
      this.activeTransfers.delete(transferId);
    } catch (error) {
      console.error('Failed to process file:', error);
      
      this.emit('fileTransferError', {
        id: transferId,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      toast.error(`Failed to process ${transfer.metadata.name}`, { id: transferId });
      
      // Clean up
      this.activeTransfers.delete(transferId);
    }
  }

  private handleDisconnect(message: Message): void {
    if (!message.senderId) return;
    
    console.log('Peer disconnected:', message.senderId);
    
    // Remove from connections
    this.connections.delete(message.senderId);
    
    // Notify listeners
    this.emit('disconnection', { peerId: message.senderId });
    
    toast.info('Peer disconnected');
  }
}

// Create singleton instance
export const peerService = new PeerService();