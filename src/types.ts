export interface FileTransfer {
  id: string;
  name: string;
  size: number;
  type: string;
  progress: number;
  encryptionProgress?: number;
  status: 'pending' | 'transferring' | 'completed' | 'error';
}

export interface PeerConnection {
  id: string;
  connected: boolean;
}