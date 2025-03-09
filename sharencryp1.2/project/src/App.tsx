import React, { useCallback, useState } from 'react';
import { Share2, Upload, Users, X, QrCode, Scan } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { usePeerConnection } from './hooks/usePeerConnection';
import { FileList } from './components/FileList';
import { QRScanner } from './components/QRScanner';
import { ConnectionRequest } from './components/ConnectionRequest';
import { ConnectionDialog } from './components/ConnectionDialog';

function App() {
  const { 
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
  } = usePeerConnection();
  const [showQR, setShowQR] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [targetPeerId, setTargetPeerId] = useState('');

  const handleConnect = useCallback(() => {
    setShowConnectDialog(true);
  }, []);

  const handleConnectSubmit = useCallback(() => {
    if (targetPeerId.trim()) {
      connectToPeer(targetPeerId.trim());
    }
    setShowConnectDialog(false);
  }, [targetPeerId, connectToPeer]);

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file && connections.length > 0) {
        sendFile(file, connections[0].id);
      }
    },
    [connections, sendFile]
  );

  const handleScan = useCallback((scannedPeerId: string) => {
    connectToPeer(scannedPeerId);
    setShowScanner(false);
  }, [connectToPeer]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50"
    >
      <Toaster position="top-right" />
      
      <AnimatePresence>
        {pendingConnections.map((pendingPeerId) => (
          <ConnectionRequest
            key={pendingPeerId}
            peerId={pendingPeerId}
            onAccept={() => acceptConnection(pendingPeerId)}
            onReject={() => rejectConnection(pendingPeerId)}
          />
        ))}
      </AnimatePresence>

      <AnimatePresence>
        {showConnectDialog && (
          <ConnectionDialog
            targetPeerId={targetPeerId}
            setTargetPeerId={setTargetPeerId}
            onConnect={handleConnectSubmit}
            onCancel={() => setShowConnectDialog(false)}
            connectionStatus={connectionStatus}
            onRetry={() => retryConnection(targetPeerId)}
          />
        )}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto p-3 sm:p-6">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-4 sm:p-6 mb-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <motion.div 
              className="flex items-center space-x-3"
              whileHover={{ scale: 1.05 }}
            >
              <Share2 className="w-7 h-7 text-blue-500" />
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-transparent bg-clip-text">
                Sharencrypt
              </h1>
            </motion.div>
            <div className="flex flex-wrap items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleConnect}
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all shadow-md hover:shadow-lg w-full sm:w-auto"
              >
                <Users className="w-5 h-5" />
                <span>Connect</span>
              </motion.button>
              <motion.label
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center justify-center space-x-2 px-4 py-2 ${
                  connections.length > 0 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 cursor-pointer shadow-md hover:shadow-lg' 
                    : 'bg-gray-400 cursor-not-allowed'
                } text-white rounded-lg transition-all w-full sm:w-auto`}
              >
                <Upload className="w-5 h-5" />
                <span>Send File</span>
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileSelect}
                  disabled={connections.length === 0}
                />
              </motion.label>
            </div>
          </div>

          <motion.div 
            className="bg-white/50 backdrop-blur-sm rounded-lg p-4 mb-6"
            whileHover={{ scale: 1.01 }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-gray-500">Your Peer ID:</p>
                <p className="font-mono text-sm text-gray-900 select-all cursor-pointer break-all">{peerId}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowScanner(true)}
                  className="flex items-center space-x-2 px-3 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                >
                  <Scan className="w-5 h-5" />
                  <span>Scan QR</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowQR(!showQR)}
                  className="flex items-center space-x-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <QrCode className="w-5 h-5" />
                  <span>{showQR ? 'Hide QR' : 'Show QR'}</span>
                </motion.button>
              </div>
            </div>
            <AnimatePresence>
              {showQR && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 flex justify-center overflow-hidden"
                >
                  <QRCodeSVG value={peerId} size={200} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <div className="space-y-6">
            <motion.div layout>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Connected Peers ({connections.length})
              </h2>
              <div className="space-y-2">
                <AnimatePresence>
                  {connections.map((connection) => (
                    <motion.div
                      key={connection.id}
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="bg-white/50 backdrop-blur-sm rounded-lg p-3 flex items-center justify-between"
                    >
                      <span className="font-mono text-xs sm:text-sm select-all cursor-pointer break-all max-w-[60%] truncate">
                        {connection.id}
                      </span>
                      <div className="flex items-center space-x-3">
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          Connected
                        </span>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => disconnectPeer(connection.id)}
                          className="text-red-500 hover:text-red-600 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {connections.length === 0 && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-gray-500 text-center py-6 sm:py-8 bg-white/50 backdrop-blur-sm rounded-lg"
                  >
                    <Users className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 text-gray-400" />
                    <p>No peers connected</p>
                    <p className="text-sm">Click "Connect" or scan a QR code to start sharing files</p>
                  </motion.div>
                )}
              </div>
            </motion.div>

            <motion.div layout>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Files
              </h2>
              <FileList files={files} />
              {files.length === 0 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-gray-500 text-center py-6 sm:py-8 bg-white/50 backdrop-blur-sm rounded-lg"
                >
                  <Share2 className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 text-gray-400" />
                  <p>No files transferred yet</p>
                  <p className="text-sm">Connect to a peer and start sharing!</p>
                </motion.div>
              )}
            </motion.div>
          </div>
        </motion.div>
      </div>
      
      <AnimatePresence>
        {showScanner && (
          <QRScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default App;