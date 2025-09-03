import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Camera, FileText, Fingerprint as FingerprintIcon, Send } from 'lucide-react';
import { StepCard } from '@/components/StepCard';
import { NavigationButtons } from '@/components/NavigationButtons';
import { Button } from '@/components/ui/button';
import { useBiometric } from '@/contexts/BiometricContext';

export function Review() {
  const { state, dispatch } = useBiometric();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Simulate API submission
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    dispatch({ type: 'SUBMIT_SUCCESS' });
    setIsSubmitting(false);
  };

  const handleBack = () => {
    dispatch({ type: 'SET_STEP', step: 3 });
  };

  if (state.isSubmitted) {
    return (
      <StepCard>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-6"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <CheckCircle className="w-24 h-24 text-green-500 mx-auto" />
          </motion.div>
          
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-green-600">Verification Complete!</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Your biometric data has been successfully captured and securely stored. 
              The verification process is now complete.
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-6 max-w-md mx-auto">
            <h3 className="font-semibold text-green-800 mb-2">What happens next?</h3>
            <p className="text-sm text-green-600">
              Your information will be processed within 24-48 hours. You'll receive a confirmation email once verification is approved.
            </p>
          </div>

          <Button 
            onClick={() => window.location.reload()}
            className="rounded-full px-8 py-3 gradient-primary shadow-button"
          >
            Start New Verification
          </Button>
        </motion.div>
      </StepCard>
    );
  }

  return (
    <StepCard>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-3xl font-bold mb-2">Review & Submit</h2>
        <p className="text-muted-foreground mb-8">
          Please review all captured information before submitting for verification.
        </p>

        <div className="space-y-6 mb-8">
          {/* Photo Review */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-accent/30 rounded-xl p-6 border border-border/50"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Camera className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Photo</h3>
                <p className="text-sm text-muted-foreground">Profile picture captured</p>
              </div>
              <div className="flex-shrink-0">
                {state.data.photo && (
                  <img 
                    src={state.data.photo} 
                    alt="Profile" 
                    className="w-16 h-16 object-cover rounded-xl border-2 border-primary/20"
                  />
                )}
              </div>
            </div>
          </motion.div>

          {/* Signature Review */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-accent/30 rounded-xl p-6 border border-border/50"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Signature</h3>
                <p className="text-sm text-muted-foreground">Digital signature captured</p>
              </div>
              <div className="flex-shrink-0">
                {state.data.signature && (
                  <div className="w-16 h-12 bg-white rounded-lg border-2 border-primary/20 flex items-center justify-center">
                    <img 
                      src={state.data.signature} 
                      alt="Signature" 
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Passport Review */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-accent/30 rounded-xl p-6 border border-border/50"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Passport</h3>
                <p className="text-sm text-muted-foreground">Identity document verified</p>
              </div>
              <div className="flex-shrink-0">
                {state.data.passport && (
                  <div className="w-16 h-12 bg-white rounded-lg border-2 border-primary/20 overflow-hidden">
                    <img 
                      src={state.data.passport} 
                      alt="Passport" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Fingerprint Review */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-accent/30 rounded-xl p-6 border border-border/50"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <FingerprintIcon className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Fingerprint</h3>
                <p className="text-sm text-muted-foreground">Biometric template created</p>
              </div>
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Consent and Submit */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-6"
        >
          <div className="bg-muted/50 rounded-xl p-6">
            <h3 className="font-semibold mb-3">Privacy & Consent</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Your biometric data is encrypted using industry-standard protocols</p>
              <p>• Information will only be used for identity verification purposes</p>
              <p>• Data is stored securely and complies with privacy regulations</p>
              <p>• You have the right to request data deletion at any time</p>
            </div>
          </div>

          <div className="flex justify-center">
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="rounded-full px-12 py-4 text-lg gradient-primary shadow-button disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-3"
                  />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-3" />
                  Submit for Verification
                </>
              )}
            </Button>
          </div>
        </motion.div>

        <NavigationButtons
          currentStep={4}
          totalSteps={4}
          onBack={handleBack}
          onNext={() => {}}
          isNextDisabled={true}
          nextLabel="Submit"
        />
      </motion.div>
    </StepCard>
  );
}