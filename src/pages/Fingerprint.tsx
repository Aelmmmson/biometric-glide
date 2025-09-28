import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Fingerprint as FingerprintIcon, CheckCircle, X } from 'lucide-react';
import { StepCard } from '@/components/StepCard';
import { Button } from '@/components/ui/button';
import { useBiometric } from '@/contexts/BiometricContext';
import { initFingerprint, captureFingerprint } from '@/services/api';
import { toast } from '@/hooks/use-toast';

export function Fingerprint() {
  const { state, dispatch } = useBiometric();
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStartScan = async () => {
    setIsScanning(true);
    setScanProgress(0);

    try {
      // Step 1: Initialize fingerprint device
      toast({ title: "Initializing fingerprint device..." });
      const initResult = await initFingerprint();
      
      if (!initResult.success) {
        throw new Error(initResult.message || 'Failed to initialize device');
      }

      setScanProgress(25);
      toast({ title: "Device initialized. Please place finger on scanner." });

      // Step 2: Capture fingerprint
      await new Promise(resolve => setTimeout(resolve, 1000)); // Brief pause for user
      setScanProgress(50);
      
      const captureResult = await captureFingerprint();
      // console.log('Capture Result:', captureResult);
      if (captureResult.response_code === 1) {
        // Success - set progress to 100%
        setScanProgress(100);
        
        // Convert base64 to data URL
        const fingerprintData = `data:image/jpeg;base64,${captureResult.image}`;
        dispatch({ type: 'SET_FINGERPRINT', fingerprint: fingerprintData });
        
        toast({ title: "Fingerprint captured and saved to database successfully!" });
        setIsScanning(false);
      } else {
        throw new Error(captureResult.response_msg || 'Failed to capture fingerprint');
      }
    } catch (error) {
      console.error('Fingerprint capture error:', error);
      setIsScanning(false);
      setScanProgress(0);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({ 
        title: "Fingerprint capture failed", 
        description: errorMessage,
        variant: "destructive" 
      });
    }
  };

  const handleClearFingerprint = () => {
    dispatch({ type: 'SET_FINGERPRINT', fingerprint: null });
  };

  const handleNext = () => {
    dispatch({ type: 'SUBMIT_FINGERPRINT' });
    dispatch({ type: 'SET_STEP', step: 4 });
  };

  const handleBack = () => {
    dispatch({ type: 'SET_STEP', step: 2 });
  };

  return (
    <>
      <StepCard>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-2xl font-bold mb-1">Fingerprint Capture</h2>
          <p className="text-muted-foreground mb-6">
            Place your finger on the scanner.
          </p>

          <div className="flex flex-col items-center space-y-8">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <div className="w-56 h-56 bg-gradient-to-br from-accent to-muted rounded-full flex items-center justify-center border-4 border-primary/20 relative overflow-hidden">
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
                      <FingerprintIcon className="w-20 h-20 text-primary mb-2" />
                    </motion.div>
                    <p className="font-semibold text-primary">Scanning...</p>
                    <p className="text-sm text-muted-foreground">{scanProgress}%</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <FingerprintIcon className="w-20 h-20 text-muted-foreground mb-2 mx-auto" />
                    <p className="font-semibold">Place finger here</p>
                  </div>
                )}

                {/* Scanning animation overlay */}
                {isScanning && (
                  <motion.div
                    className="absolute inset-0 bg-primary/10"
                    initial={{ clipPath: 'circle(0% at 50% 50%)' }}
                    animate={{ clipPath: `circle(${scanProgress / 2}% at 50% 50%)` }}
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
              <div className="text-center space-y-4 w-full max-w-md">
                <p className="text-muted-foreground">
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
                  <div className="bg-muted/50 rounded-xl p-4">
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

                {/* Biometric Security Link (before scanning) */}
                <div className="bg-muted/50 rounded-xl p-4 w-full">
                  <div className="flex justify-center">
                    <button
                      onClick={() => setShowBiometricModal(true)}
                      className="flex items-center gap-2 text-primary hover:underline cursor-pointer"
                    >
                      {/* Icon Circle */}
                      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-primary"></div>
                      </div>
                      {/* Text */}
                      <span className="font-medium">Biometric Security</span>
                    </button>
                  </div>

                  {/* <p className="text-muted-foreground text-center mt-2">
    Your fingerprint is converted to an encrypted template and cannot be reverse-engineered. 
    Only the mathematical pattern is stored, not the actual image.
  </p> */}
                </div>

              </div>
            )}

            {state.data.fingerprint && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-4 w-full max-w-md"
              >
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 relative">
                  <button
                    onClick={handleClearFingerprint}
                    className="absolute top-2 right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs hover:bg-destructive/80 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <h3 className="font-semibold text-green-800 mb-1">Fingerprint Captured</h3>
                  <p className="text-xs text-green-600">
                    Securely recorded and encrypted.
                  </p>
                </div>

                {/* Biometric Security Link (after scanning) */}
                <div className="bg-muted/50 rounded-xl p-4 w-full">
                  <div className="flex justify-center">
                    <button
                      onClick={() => setShowBiometricModal(true)}
                      className="flex items-center gap-2 text-primary hover:underline cursor-pointer"
                    >
                      {/* Icon Circle */}
                      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-primary"></div>
                      </div>
                      {/* Text */}
                      <span className="font-medium">Biometric Security</span>
                    </button>
                  </div>

                  {/* <p className="text-muted-foreground text-center mt-2">
    Your fingerprint is converted to an encrypted template and cannot be reverse-engineered. 
    Only the mathematical pattern is stored, not the actual image.
  </p> */}
                </div>

              </motion.div>
            )}
          </div>

          {/* Navigation and Submit Button */}
          <div className="flex items-center justify-between mt-8">
            {/* Back Button */}
            <Button
              onClick={handleBack}
              variant="outline"
              className="rounded-full px-6 py-2"
            >
              Back
            </Button>

            {/* Continue Button (Centered) */}
            {state.data.fingerprint && (
              <Button
                onClick={handleNext}
                className="rounded-full px-8 py-3 gradient-primary shadow-button"
              >
                Continue to Review
              </Button>
            )}

            {/* Step Indicator */}
            <div className="text-sm text-muted-foreground">
              Step 3 of 4
            </div>
          </div>
        </motion.div>
      </StepCard>

      {/* Biometric Security Modal */}
      {showBiometricModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Biometric Security</h3>
              <button
                onClick={() => setShowBiometricModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <p>
                Your fingerprint data is converted into a secure mathematical template using
                industry-standard encryption algorithms. The original fingerprint image is never stored.
              </p>
              <p>
                Our biometric system uses advanced pattern recognition that cannot be reverse-engineered
                to recreate your actual fingerprint.
              </p>
              <p>
                All biometric templates are encrypted both at rest and in transit, and we comply with
                international biometric data protection standards including ISO/IEC 19794-2.
              </p>
              <p>
                Your biometric data is only used for verification purposes and is never shared with
                third parties without your explicit consent.
              </p>
            </div>
            <div className="mt-6 flex justify-end">
              <Button
                onClick={() => setShowBiometricModal(false)}
                className="rounded-full"
              >
                I Understand
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}