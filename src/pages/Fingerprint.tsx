import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Fingerprint as FingerprintIcon, CheckCircle, X } from 'lucide-react';
import { StepCard } from '@/components/StepCard';
import { NavigationButtons } from '@/components/NavigationButtons';
import { Button } from '@/components/ui/button';
import { useBiometric } from '@/contexts/BiometricContext';

export function Fingerprint() {
  const { state, dispatch } = useBiometric();
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [showBiometricModal, setShowBiometricModal] = useState(false);

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

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!state.data.fingerprint) return;
    
    setIsSubmitting(true);
    
    // Simulate API submission
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    dispatch({ type: 'SUBMIT_FINGERPRINT' });
    setIsSubmitting(false);
    
    // Move to next step
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
              <div className="text-center space-y-2">
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
                className="text-center space-y-2"
              >
                 <div className="space-y-4">
                   <div className="bg-green-50 border border-green-200 rounded-xl p-4 max-w-md">
                     <h3 className="font-semibold text-green-800 mb-1">Fingerprint Captured</h3>
                     <p className="text-xs text-green-600">
                       Securely recorded and encrypted.
                     </p>
                   </div>
                   
                   <Button
                     onClick={handleSubmit}
                     disabled={isSubmitting}
                     className="rounded-full px-8 py-3 gradient-primary shadow-button"
                   >
                     {isSubmitting ? (
                       <>
                         <motion.div
                           animate={{ rotate: 360 }}
                           transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                           className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                         />
                         Submitting...
                       </>
                     ) : (
                       'Submit Fingerprint'
                     )}
                   </Button>
                 </div>
              </motion.div>
            )}

            <div className="bg-muted/50 rounded-xl p-1 max-w-md">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                </div>
                <div className="text-sm">
                  <p className="font-medium mb-1">
                    <button 
                      onClick={() => setShowBiometricModal(true)}
                      className="text-primary hover:underline cursor-pointer"
                    >
                      Biometric Security
                    </button>
                  </p>
                  {/* <p className="text-muted-foreground">
                    Your fingerprint is converted to an encrypted template and cannot be reverse-engineered. 
                    Only the mathematical pattern is stored, not the actual image.
                  </p> */}
                </div>
              </div>
            </div>
          </div>

          <NavigationButtons
            currentStep={3}
            totalSteps={4}
            onBack={handleBack}
            onNext={() => {}}
            isNextDisabled={true}
            hideNext={true}
          />
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