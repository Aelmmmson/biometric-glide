import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Camera, FileText, Fingerprint, Upload } from 'lucide-react';
import { StepCard } from '@/components/StepCard';
import { NavigationButtons } from '@/components/NavigationButtons';
import { Button } from '@/components/ui/button';
import { useBiometric } from '@/contexts/BiometricContext';

export function Review() {
  const { state, dispatch } = useBiometric();
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleSubmit = () => {
    // Simulate completion
    setShowSuccessModal(true);
  };

  const handleNewCapture = () => {
    dispatch({ type: 'RESET' });
    setShowSuccessModal(false);
  };

  const handleBack = () => {
    dispatch({ type: 'SET_STEP', step: 3 });
  };

  return (
    <>
      <StepCard>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-3xl font-bold mb-2">Confirmation</h2>
          <p className="text-muted-foreground mb-8">
            Review your submitted data. All information has been successfully captured.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Photo & Signature */}
            <div className="bg-white rounded-2xl p-6 shadow-soft border border-border">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Camera className="w-5 h-5 text-primary" />
                Photo & Signature
              </h3>
              <div className="space-y-4">
                {state.data.photo ? (
                  <div className="flex items-center gap-4">
                    <img 
                      src={state.data.photo} 
                      alt="Submitted photo" 
                      className="w-16 h-16 object-cover rounded-full border-2 border-primary"
                    />
                    <div>
                      <p className="font-medium text-green-600">✓ Photo captured</p>
                      <p className="text-xs text-muted-foreground">Ready for verification</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-destructive">No photo captured</p>
                )}
                
                {state.data.signature ? (
                  <div className="flex items-center gap-4">
                    <img 
                      src={state.data.signature} 
                      alt="Submitted signature" 
                      className="max-h-12 border border-border rounded"
                    />
                    <div>
                      <p className="font-medium text-green-600">✓ Signature captured</p>
                      <p className="text-xs text-muted-foreground">Ready for verification</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-destructive">No signature captured</p>
                )}
              </div>
            </div>

            {/* Identification */}
            <div className="bg-white rounded-2xl p-6 shadow-soft border border-border">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Identification
              </h3>
              {state.data.identification.type ? (
                <div className="space-y-3">
                  <p className="font-medium capitalize">{state.data.identification.type.replace('_', ' ')}</p>
                  {state.data.identification.front && (
                    <div className="flex items-center gap-3">
                      <img 
                        src={state.data.identification.front} 
                        alt="ID document front" 
                        className="max-h-16 max-w-24 object-contain border border-border rounded"
                      />
                      <div>
                        <p className="text-sm font-medium text-green-600">✓ Front captured</p>
                      </div>
                    </div>
                  )}
                  {state.data.identification.back && (
                    <div className="flex items-center gap-3">
                      <img 
                        src={state.data.identification.back} 
                        alt="ID document back" 
                        className="max-h-16 max-w-24 object-contain border border-border rounded"
                      />
                      <div>
                        <p className="text-sm font-medium text-green-600">✓ Back captured</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-destructive">No identification captured</p>
              )}
            </div>

            {/* Fingerprint */}
            <div className="bg-white rounded-2xl p-6 shadow-soft border border-border md:col-span-2">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Fingerprint className="w-5 h-5 text-primary" />
                Fingerprint
              </h3>
              {state.data.fingerprint ? (
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-accent to-muted rounded-full flex items-center justify-center">
                    <Fingerprint className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-green-600">✓ Fingerprint captured successfully</p>
                    <p className="text-sm text-muted-foreground">Biometric data secured and encrypted</p>
                  </div>
                </div>
              ) : (
                <p className="text-destructive">No fingerprint captured</p>
              )}
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-8 text-center space-y-4">
            <Button
              onClick={handleSubmit}
              className="rounded-full px-12 py-4 text-lg gradient-primary shadow-button"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Complete Process
            </Button>
            
            <p className="text-sm text-muted-foreground">
              All data has been successfully submitted for verification
            </p>
          </div>

          <NavigationButtons
            currentStep={4}
            totalSteps={4}
            onBack={handleBack}
            onNext={() => {}}
            isNextDisabled={true}
            showNext={false}
          />
        </motion.div>
      </StepCard>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-8 max-w-md w-full text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mb-6"
            >
              <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
            </motion.div>
            
            <div className="space-y-4 mb-6">
              <h3 className="text-2xl font-bold text-green-600">Process Complete!</h3>
              <p className="text-lg text-green-700 mb-6">
                Your biometric verification process is complete. All data has been successfully captured and submitted.
              </p>
            </div>

            <Button 
              onClick={handleNewCapture}
              className="rounded-full px-8 py-3 gradient-primary shadow-button"
            >
              Start New Process
            </Button>
          </motion.div>
        </div>
      )}
    </>
  );
}