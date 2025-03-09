import { useState, useEffect, useCallback } from 'react';
import { peerService } from '../services/peerService';
import { FileTransfer, PeerConnection } from '../types';

export const usePeerConnection = () => {
  const [peerId, setPeerId] = useState<string>('');
  const [connections, setConnections] = useState<PeerConnection[]>([]);
  const [files, setFiles] = useState<FileTransfer[]>([]);
  const [pendingConnections, setPendingConnections] = useState<string[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'failed'>('idle');

  useEffect(() => {
    // Set peer ID
    setPeerId(peerService.getPeerId());
    
    // Set up event listeners
    const handleConnection = (data: { peerId: string }) => {
      setConnections(prev => {
        if (!prev.find(c => c.id === data.peerId)) {
          return [...prev, { id: data.peerId, connected: true }];
        }
        return prev;
      });
      setConnectionStatus('connected');
    };
    
    const handleDisconnection = (data: { peerId: string }) => {
      setConnections(prev => prev.filter(conn => conn.id !== data.peerId));
    };
    
    const handleConnectionRequest = (data: { peerId: string }) => {
      setPendingConnections(prev => [...prev, data.peerId]);
    };
    
    const handleFileTransferStart = (data: FileTransfer) => {
      setFiles(prev => [...prev, data]);
    };
    
    const handleFileTransferProgress = (data: Partial<FileTransfer>) => {
      setFiles(prev => prev.map(file => 
        file.id === data.id 
          ? { ...file, ...data } 
          : file
      ));
    };
    
    const handleFileTransferComplete = (data: Partial<FileTransfer>) => {
      setFiles(prev => prev.map(file => 
        file.id === data.id 
          ? { ...file, ...data } 
          : file
      ));
    };
    
    const handleFileTransferError = (data: Partial<FileTransfer>) => {
      setFiles(prev => prev.map(file => 
        file.id === data.id 
          ? { ...file, ...data } 
          : file
      ));
    };
    
    // Register event listeners
    peerService.on('connection', handleConnection);
    peerService.on('disconnection', handleDisconnection);
    peerService.on('connectionRequest', handleConnectionRequest);
    peerService.on('fileTransferStart', handleFileTransferStart);
    peerService.on('fileTransferProgress', handleFileTransferProgress);
    peerService.on('fileTransferComplete', handleFileTransferComplete);
    peerService.on('fileTransferError', handleFileTransferError);
    
    // Clean up event listeners
    return () => {
      peerService.off('connection', handleConnection);
      peerService.off('disconnection', handleDisconnection);
      peerService.off('connectionRequest', handleConnectionRequest);
      peerService.off('fileTransferStart', handleFileTransferStart);
      peerService.off('fileTransferProgress', handleFileTransferProgress);
      peerService.off('fileTransferComplete', handleFileTransferComplete);
      peerService.off('fileTransferError', handleFileTransferError);
    };
  }, []);

  const connectToPeer = useCallback(async (targetPeerId: string) => {
    setConnectionStatus('connecting');
    const success = await peerService.connectToPeer(targetPeerId);
    if (!success) {
      setConnectionStatus('failed');
    }
  }, []);

  const acceptConnection = useCallback((targetPeerId: string) => {
    peerService.acceptConnection(targetPeerId);
    setPendingConnections(prev => prev.filter(id => id !== targetPeerId));
  }, []);

  const rejectConnection = useCallback((targetPeerId: string) => {
    peerService.rejectConnection(targetPeerId);
    setPendingConnections(prev => prev.filter(id => id !== targetPeerId));
  }, []);

  const disconnectPeer = useCallback((targetPeerId: string) => {
    peerService.disconnectPeer(targetPeerId);
  }, []);

  const sendFile = useCallback(async (file: File, targetPeerId: string) => {
    await peerService.sendFile(file, targetPeerId);
  }, []);

  const retryConnection = useCallback((targetPeerId: string) => {
    connectToPeer(targetPeerId);
  }, [connectToPeer]);

  return {
    peerId,
    connections,
    files,
    pendingConnections,
    connectionStatus,
    connectToPeer,
    sendFile,
    disconnectPeer,
    acceptConnection,
    rejectConnection,
    retryConnection
  };
};