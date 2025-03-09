import React from 'react';
import { motion } from 'framer-motion';
import { Users, X, Loader2, RefreshCw } from 'lucide-react';

interface ConnectionDialogProps {
  targetPeerId: string;
  setTargetPeerId: (id: string) => void;
  onConnect: () => void;
  onCancel: () => void;
  connectionStatus: 'idle' | 'connecting' | 'connected' | 'failed';
  onRetry: () => void;
}

export const ConnectionDialog: React.FC<ConnectionDialogProps> = ({
  targetPeerId,
  setTargetPeerId,
  onConnect,
  onCancel,
  connectionStatus,
  onRetry,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConnect();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="bg-white rounded-xl shadow-xl max-w-md w-full mx-auto overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-white">
            <Users className="w-6 h-6" />
            <h3 className="text-xl font-semibold">Connect to Peer</h3>
          </div>
          <button
            onClick={onCancel}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {connectionStatus === 'idle' && (
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="peerId" className="block text-sm font-medium text-gray-700 mb-1">
                  Enter Peer ID
                </label>
                <input
                  type="text"
                  id="peerId"
                  value={targetPeerId}
                  onChange={(e) => setTargetPeerId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Paste peer ID here"
                  autoFocus
                />
              </div>
              <div className="flex space-x-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                  disabled={!targetPeerId.trim()}
                >
                  Connect
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={onCancel}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </motion.button>
              </div>
            </form>
          )}

          {connectionStatus === 'connecting' && (
            <div className="py-6 flex flex-col items-center">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Connecting...</h3>
              <p className="text-gray-500 text-center mb-4">
                Establishing secure connection to peer
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onCancel}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </motion.button>
            </div>
          )}

          {connectionStatus === 'failed' && (
            <div className="py-6 flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <X className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Connection Failed</h3>
              <p className="text-gray-500 text-center mb-4">
                Unable to connect to the peer. Please check the ID and try again.
              </p>
              <div className="flex space-x-3 w-full">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onRetry}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium flex items-center justify-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Retry</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onCancel}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </motion.button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};