import React from 'react';
import { motion } from 'framer-motion';
import { UserPlus } from 'lucide-react';

interface ConnectionRequestProps {
  peerId: string;
  onAccept: () => void;
  onReject: () => void;
}

export const ConnectionRequest: React.FC<ConnectionRequestProps> = ({
  peerId,
  onAccept,
  onReject,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed top-4 right-4 z-50 w-full max-w-sm mx-auto px-4 sm:px-0"
    >
      <div className="bg-white rounded-lg shadow-xl p-4 border border-gray-100">
        <div className="flex items-start space-x-4">
          <div className="bg-blue-100 rounded-full p-2 flex-shrink-0">
            <UserPlus className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900">Connection Request</h3>
            <p className="text-sm text-gray-500 mt-1">
              A peer wants to connect with you:
            </p>
            <p className="text-sm font-mono bg-gray-50 p-2 rounded mt-2 select-all break-all">
              {peerId}
            </p>
            <div className="flex space-x-2 mt-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onAccept}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                Accept
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onReject}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Reject
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};