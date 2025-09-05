import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Camera, FileText, Fingerprint as FingerprintIcon, Send } from 'lucide-react';
import { StepCard } from '@/components/StepCard';
import { NavigationButtons } from '@/components/NavigationButtons';
import { Button } from '@/components/ui/button';
import { PrivacyModal } from '@/components/PrivacyModal';
import { useBiometric } from '@/contexts/BiometricContext';

export function Review() {
  const { state, dispatch } = useBiometric();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Simulate API submission
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    dispatch({ type: 'COMPLETE_PROCESS' });
    setIsSubmitting(false);
  };

  const handleBack = () => {
    dispatch({ type: 'SET_STEP', step: 3 });
  };

  if (state.isCompleted) {
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
              Your biometric data has been captured and securely stored.
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-6 max-w-md mx-auto">
            <h3 className="font-semibold text-green-800 mb-2">What's next?</h3>
            <p className="text-sm text-green-600">
              Processing takes 24-48 hours. You'll receive confirmation via email.
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
        <h2 className="text-2xl font-bold mb-1">Confirmation</h2>
        <p className="text-muted-foreground mb-6">
          Review your submitted information.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Photo Review */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-accent/30 rounded-xl p-4 border border-border/50"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Camera className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Photo</h3>
                <p className="text-sm text-green-600">✓ Submitted</p>
              </div>
              <div className="flex-shrink-0">
                {state.data.photo && (
                  <img 
                    src={state.data.photo} 
                    alt="Profile" 
                    className="w-12 h-12 object-cover rounded-lg border-2 border-primary/20"
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
            className="bg-accent/30 rounded-xl p-4 border border-border/50"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Signature</h3>
                <p className="text-sm text-green-600">✓ Submitted</p>
              </div>
              <div className="flex-shrink-0">
                {state.data.signature && (
                  <div className="w-12 h-8 bg-white rounded border-2 border-primary/20 flex items-center justify-center">
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

          {/* ID Review */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-accent/30 rounded-xl p-4 border border-border/50"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Identification</h3>
                <p className="text-sm text-green-600">✓ Submitted</p>
              </div>
              <div className="flex-shrink-0">
                {state.data.idFront && (
                  <div className="w-12 h-8 bg-white rounded border-2 border-primary/20 overflow-hidden">
                    <img 
                      src={state.data.idFront} 
                      alt="ID" 
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
            className="bg-accent/30 rounded-xl p-4 border border-border/50"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <FingerprintIcon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Fingerprint</h3>
                <p className="text-sm text-green-600">✓ Submitted</p>
              </div>
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
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
          <div className="flex justify-center">
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="rounded-full px-8 py-3 gradient-primary shadow-button disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                  />
                  Processing...
                </>
              ) : (
                'Complete Process'
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
          hideNext={true}
        />
      </motion.div>
    </StepCard>
  );
}