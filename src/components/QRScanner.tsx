import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import QrScanner from 'qr-scanner';

interface QRScannerProps {
  onScan: (peerId: string) => void;
  onClose: () => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose }) => {
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [hasFlash, setHasFlash] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);

  useEffect(() => {
    const initializeScanner = async () => {
      try {
        setIsLoading(true);
        setError('');

        // Check camera permissions
        const hasPermissions = await QrScanner.hasCamera();
        if (!hasPermissions) {
          setPermissionDenied(true);
          setError('No camera found or permission denied');
          setIsLoading(false);
          return;
        }

        if (!videoRef.current) return;

        // Create scanner instance
        scannerRef.current = new QrScanner(
          videoRef.current,
          (result) => {
            if (result.data) {
              onScan(result.data);
            }
          },
          {
            returnDetailedScanResult: true,
            highlightScanRegion: true,
            highlightCodeOutline: true,
            preferredCamera: 'environment',
          }
        );

        // Check if flash is available
        const hasFlashAvailable = await scannerRef.current.hasFlash();
        setHasFlash(hasFlashAvailable);

        // Start scanning
        await scannerRef.current.start();
        setIsLoading(false);
      } catch (err) {
        console.error('Scanner initialization error:', err);
        setError('Failed to initialize camera. Please try again.');
        setIsLoading(false);
        setPermissionDenied(true);
      }
    };

    initializeScanner();

    return () => {
      if (scannerRef.current) {
        scannerRef.current.destroy();
      }
    };
  }, [onScan]);

  const handleRetry = async () => {
    setPermissionDenied(false);
    setIsLoading(true);
    setError('');

    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      if (scannerRef.current) {
        await scannerRef.current.start();
      }
      setIsLoading(false);
    } catch (err) {
      setPermissionDenied(true);
      setError('Camera access is still denied. Please check your browser settings.');
      setIsLoading(false);
    }
  };

  const toggleFlash = async () => {
    if (!scannerRef.current || !hasFlash) return;

    try {
      if (flashOn) {
        await scannerRef.current.turnFlashOff();
      } else {
        await scannerRef.current.turnFlashOn();
      }
      setFlashOn(!flashOn);
    } catch (err) {
      console.error('Failed to toggle flash:', err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-auto overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-white">
            <Camera className="w-6 h-6" />
            <h3 className="text-xl font-semibold">Scan QR Code</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {permissionDenied ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="bg-red-100 rounded-full p-4 mb-4">
                <AlertCircle className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2 text-center">
                Camera Access Required
              </h3>
              <p className="text-gray-600 text-center mb-6">
                Please allow camera access to scan QR codes. Check your browser settings to enable the camera.
              </p>
              <div className="flex space-x-3 w-full">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleRetry}
                  className="flex-1 py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium flex items-center justify-center space-x-2"
                >
                  <RefreshCw className="w-5 h-5" />
                  <span>Try Again</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  className="flex-1 py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </motion.button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative aspect-square w-full bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                )}
                <div className="absolute inset-0 border-[3px] border-white/30 rounded-lg pointer-events-none">
                  <div className="absolute inset-12 border-2 border-white/50 rounded-lg"></div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                {hasFlash ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={toggleFlash}
                    className={`py-2 px-4 rounded-lg font-medium flex items-center space-x-2 ${
                      flashOn
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    <span>{flashOn ? 'Turn Flash Off' : 'Turn Flash On'}</span>
                  </motion.button>
                ) : (
                  <div /> // Empty div for spacing
                )}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  className="py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </motion.button>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm"
                >
                  {error}
                </motion.div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};