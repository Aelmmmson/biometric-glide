import { motion } from 'framer-motion';
import {
  CheckCircle,
  Camera,
  FileText,
  Fingerprint as FingerprintIcon,
  RefreshCw,
} from 'lucide-react';
import { StepCard } from '@/components/StepCard';
import { Button } from '@/components/ui/button';
import { useBiometric } from '@/hooks/useBiometric';

export function Review() {
  const { state, dispatch } = useBiometric();

  const config = state?.activityConfig;

  const hasPhotoSignature = !!(state?.data?.photo || state?.data?.signature);
  const hasIdentification =
    !!(config?.identification?.status && (state?.data?.idFront || state?.data?.idBack));
  const hasFingerprint =
    !!(config?.fingerprint?.status && (state?.data?.thumbprint1 || state?.data?.thumbprint2));

  const submittedCount =
    Number(hasPhotoSignature) +
    Number(hasIdentification) +
    Number(hasFingerprint);

  const isOnlyPhotoSignature = submittedCount === 1 && hasPhotoSignature;

  const startNewCapture = () => {
    if (window.confirm('Start a new biometric capture session?')) {
      dispatch({ type: 'RESET' });
      window.location.reload();
    }
  };

  const closeTab = () => {
    window.close();
  };

  return (
    <StepCard>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`max-w-5xl mx-auto ${
          isOnlyPhotoSignature ? 'max-w-2xl' : ''
        }`}
      >
        {/* Dynamic Header */}
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="inline-block"
          >
            <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-1" />
          </motion.div>
          <h5 className="text-xl font-bold text-foreground mb-1">
            {window.location.pathname.includes('update')
              ? 'Biometric Update Complete!'
              : 'Biometric Capture Complete!'}
          </h5>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {window.location.pathname.includes('update')
              ? 'All biometrics have been successfully updated and saved.'
              : 'All required information has been successfully captured and saved.'}
          </p>
        </div>

        {/* Final Actions */}
        <div className="text-center space-y-8">
          <div className="bg-gray-50 rounded-2xl p-8 max-w-2xl mx-auto border border-gray-200">
            <p className="text-lg font-medium text-foreground mb-4">
              Your session is complete.
            </p>
            <p className="text-muted-foreground">
              You may now safely close this tab or window.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {/* <Button
              onClick={startNewCapture}
              size="lg"
              className="rounded-full px-10 py-6 gradient-primary shadow-button text-lg font-semibold flex items-center gap-3"
            >
              <RefreshCw className="w-5 h-5" />
              Start New Capture
            </Button> */}

            <Button
              onClick={closeTab}
              variant="outline"
              size="lg"
              className="rounded-full px-10 py-6 text-lg"
            >
              Close This Tab
            </Button>
          </div>

          <p className="text-sm text-blue-400 mt-8 animate-pulse italic">
            {/* Need help? Contact support at support@bank.com */}
            Powered by x100
          </p>
        </div>
      </motion.div>
    </StepCard>
  );
}