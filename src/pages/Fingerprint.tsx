import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Fingerprint as FingerprintIcon, CheckCircle } from 'lucide-react';
import { StepCard } from '@/components/StepCard';
import { NavigationButtons } from '@/components/NavigationButtons';
import { Button } from '@/components/ui/button';
import { useBiometric } from '@/contexts/BiometricContext';

export function Fingerprint() {
  const { state, dispatch } = useBiometric();
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  const handleStartScan = () => {
    setIsScanning(true);
    setScanProgress(0);
    
    // Simulate fingerprint scanning progress
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          // Simulate fingerprint data
          const simulatedFingerprint = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxjaXJjbGUgY3g9Ijc1IiBjeT0iNzUiIHI9IjcwIiBmaWxsPSIjZjNmNGY2IiBzdHJva2U9IiM0Zjg0ZjciIHN0cm9rZS13aWR0aD0iMiIvPgo8cGF0aCBkPSJNNDAgNzVDNDAgNTUgNTUgNDAgNzUgNDBDOTUgNDAgMTEwIDU1IDExMCA3NSIgc3Ryb2tlPSIjMzc0MTUxIiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9Im5vbmUiLz4KPHA+';
          dispatch({ type: 'SET_FINGERPRINT', fingerprint: simulatedFingerprint });
          return 100;
        }
        return prev + 2;
      });
    }, 50);
  };

  const handleNext = () => {
    dispatch({ type: 'SET_STEP', step: 4 });
  };

  const handleBack = () => {
    dispatch({ type: 'SET_STEP', step: 2 });
  };

  const isNextDisabled = !state.data.fingerprint;

  return (
    <StepCard>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-3xl font-bold mb-2">Fingerprint Capture</h2>
        <p className="text-muted-foreground mb-8">
          Place your finger on the scanner to capture your unique fingerprint pattern.
        </p>

        <div className="flex flex-col items-center space-y-8">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <div className="w-64 h-64 bg-gradient-to-br from-accent to-muted rounded-full flex items-center justify-center border-4 border-primary/20 relative overflow-hidden">
              {state.data.fingerprint ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="text-center"
                >
                  <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
                  <p className="font-semibold text-green-600">Fingerprint Captured</p>
                </motion.div>
              ) : isScanning ? (
                <div className="text-center">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <FingerprintIcon className="w-20 h-20 text-primary mb-4" />
                  </motion.div>
                  <p className="font-semibold text-primary">Scanning...</p>
                  <p className="text-sm text-muted-foreground">{scanProgress}%</p>
                </div>
              ) : (
                <div className="text-center">
                  <FingerprintIcon className="w-20 h-20 text-muted-foreground mb-4" />
                  <p className="font-semibold">Place finger here</p>
                </div>
              )}
              
              {/* Scanning animation overlay */}
              {isScanning && (
                <motion.div
                  className="absolute inset-0 bg-primary/10"
                  initial={{ clipPath: 'circle(0% at 50% 50%)' }}
                  animate={{ clipPath: `circle(${scanProgress/2}% at 50% 50%)` }}
                  transition={{ duration: 0.1 }}
                />
              )}
            </div>

            {/* Pulsing rings when scanning */}
            {isScanning && (
              <>
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-primary/30"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-primary/20"
                  animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                />
              </>
            )}
          </motion.div>

          {!state.data.fingerprint && (
            <div className="text-center space-y-4">
              <p className="text-muted-foreground max-w-md">
                {isScanning 
                  ? "Keep your finger steady on the scanner until the process is complete."
                  : "Click the button below to start the fingerprint scanning process."
                }
              </p>
              
              {!isScanning && (
                <Button 
                  onClick={handleStartScan}
                  className="rounded-full px-8 py-3 gradient-primary shadow-button"
                >
                  <FingerprintIcon className="w-4 h-4 mr-2" />
                  Start Scanning
                </Button>
              )}

              {isScanning && (
                <div className="bg-muted/50 rounded-xl p-4 max-w-md">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                    <p className="text-sm">
                      Scanning in progress... {scanProgress}% complete
                    </p>
                  </div>
                  <div className="w-full bg-border rounded-full h-2 mt-2">
                    <motion.div 
                      className="bg-primary h-2 rounded-full"
                      initial={{ width: '0%' }}
                      animate={{ width: `${scanProgress}%` }}
                      transition={{ duration: 0.1 }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {state.data.fingerprint && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-4"
            >
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 max-w-md">
                <h3 className="font-semibold text-green-800 mb-2">Fingerprint Successfully Captured</h3>
                <p className="text-sm text-green-600">
                  Your unique fingerprint pattern has been securely recorded and encrypted for verification.
                </p>
              </div>
            </motion.div>
          )}

          <div className="bg-muted/50 rounded-xl p-4 max-w-md">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
              </div>
              <div className="text-sm">
                <p className="font-medium mb-1">Biometric Security</p>
                <p className="text-muted-foreground">
                  Your fingerprint is converted to an encrypted template and cannot be reverse-engineered. 
                  Only the mathematical pattern is stored, not the actual image.
                </p>
              </div>
            </div>
          </div>
        </div>

        <NavigationButtons
          currentStep={3}
          totalSteps={4}
          onBack={handleBack}
          onNext={handleNext}
          isNextDisabled={isNextDisabled}
        />
      </motion.div>
    </StepCard>
  );
}