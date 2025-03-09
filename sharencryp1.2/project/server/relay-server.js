import { WebSocket, WebSocketServer } from 'ws';
import { nanoid } from 'nanoid';

// Configuration
const PORT = process.env.PORT || 8080;
const MAX_MESSAGE_SIZE = 1024 * 1024; // 1MB max message size
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const CONNECTION_TIMEOUT = 60000; // 60 seconds

// Create WebSocket server with proper CORS configuration
const wss = new WebSocketServer({ 
  port: PORT,
  maxPayload: MAX_MESSAGE_SIZE,
  verifyClient: (info, cb) => {
    // Allow all origins in development
    cb(true);
  }
});

// Store connected peers
const peers = new Map();

console.log(`Relay server started on port ${PORT}`);

// Handle new connections
wss.on('connection', (ws, req) => {
  const connectionId = nanoid();
  let peerId = null;
  
  console.log(`New connection: ${connectionId}`);
  
  // Set up connection timeout
  let connectionTimeout = setTimeout(() => {
    if (!peerId) {
      console.log(`Connection ${connectionId} timed out without registering`);
      ws.terminate();
    }
  }, 10000);
  
  // Set up heartbeat
  let heartbeatInterval = null;
  let lastPing = Date.now();
  
  const startHeartbeat = () => {
    heartbeatInterval = setInterval(() => {
      // Check if connection is still alive
      if (Date.now() - lastPing > CONNECTION_TIMEOUT) {
        console.log(`Connection ${connectionId} (${peerId}) timed out`);
        ws.terminate();
        return;
      }
      
      // Send ping
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    }, HEARTBEAT_INTERVAL);
  };
  
  // Handle messages
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      
      // Update last ping time
      lastPing = Date.now();
      
      // Handle registration
      if (message.type === 'register') {
        clearTimeout(connectionTimeout);
        peerId = message.peerId;
        
        // Check if peer ID is already registered
        if (peers.has(peerId)) {
          const existingConnection = peers.get(peerId);
          
          // Close existing connection
          if (existingConnection.ws.readyState === WebSocket.OPEN) {
            existingConnection.ws.send(JSON.stringify({
              type: 'error',
              error: 'duplicate_connection',
              message: 'Another client connected with the same peer ID'
            }));
            
            existingConnection.ws.close();
          }
        }
        
        // Register peer
        peers.set(peerId, { 
          ws, 
          connectionId,
          connectedAt: Date.now()
        });
        
        console.log(`Peer registered: ${peerId}`);
        
        // Start heartbeat
        startHeartbeat();
        
        // Send confirmation
        ws.send(JSON.stringify({
          type: 'registered',
          peerId,
          timestamp: Date.now()
        }));
        
        return;
      }
      
      // All other messages require registration
      if (!peerId) {
        ws.send(JSON.stringify({
          type: 'error',
          error: 'not_registered',
          message: 'You must register before sending messages'
        }));
        return;
      }
      
      // Handle ping
      if (message.type === 'ping') {
        ws.send(JSON.stringify({
          type: 'pong',
          timestamp: Date.now()
        }));
        return;
      }
      
      // Handle relay messages
      if (message.targetId) {
        const targetPeer = peers.get(message.targetId);
        
        if (targetPeer && targetPeer.ws.readyState === WebSocket.OPEN) {
          // Log the message being forwarded
          console.log(`Forwarding message type ${message.type} from ${peerId} to ${message.targetId}`);
          
          // Forward message to target peer with original sender ID
          const forwardMessage = {
            ...message,
            senderId: peerId // Ensure sender ID is set correctly
          };
          
          targetPeer.ws.send(JSON.stringify(forwardMessage));
          
          // For connection requests, send immediate confirmation back to sender
          if (message.type === 'connection-request') {
            ws.send(JSON.stringify({
              type: 'request-sent',
              targetId: message.targetId,
              timestamp: Date.now()
            }));
          }
        } else {
          // Target peer not found or not connected
          ws.send(JSON.stringify({
            type: 'error',
            error: 'peer_not_found',
            message: `Peer ${message.targetId} not found or not connected`,
            originalMessage: message
          }));
        }
      }
    } catch (error) {
      console.error('Error processing message:', error);
      
      // Send error response
      ws.send(JSON.stringify({
        type: 'error',
        error: 'invalid_message',
        message: 'Failed to process message'
      }));
    }
  });
  
  // Handle pong responses
  ws.on('pong', () => {
    lastPing = Date.now();
  });
  
  // Handle connection close
  ws.on('close', () => {
    console.log(`Connection closed: ${connectionId} (${peerId})`);
    
    // Clean up
    clearInterval(heartbeatInterval);
    
    if (peerId) {
      peers.delete(peerId);
      
      // Notify all connected peers about the disconnection
      peers.forEach((peer) => {
        if (peer.ws.readyState === WebSocket.OPEN) {
          peer.ws.send(JSON.stringify({
            type: 'peer-disconnected',
            peerId: peerId,
            timestamp: Date.now()
          }));
        }
      });
    }
  });
  
  // Handle errors
  ws.on('error', (error) => {
    console.error(`Connection error (${connectionId}):`, error);
  });
});

// Log statistics periodically
setInterval(() => {
  console.log(`Connected peers: ${peers.size}`);
}, 60000);