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
import { useBiometric } from '@/contexts/BiometricContext';

export function Review() {
  const { state, dispatch } = useBiometric();

  const config = state.activityConfig;

  const hasPhotoSignature = state.submissions.photoSignature;
  const hasIdentification =
    config?.identification.status && state.submissions.identification;
  const hasFingerprint =
    config?.fingerprint.status && state.submissions.thumbprints;

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
        {/* Success Header */}
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
            Biometric Capture Complete!
          </h5>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            All required information has been successfully captured and saved.
          </p>
        </div>

        {/* Submitted Items Grid */}
        <div
          className={`grid gap-8 mb-12 ${
            isOnlyPhotoSignature
              ? 'grid-cols-1 max-w-2xl mx-auto'
              : submittedCount === 2
              ? 'grid-cols-1 md:grid-cols-2'
              : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
          }`}
        >
          {/* Photo & Signature */}
          {hasPhotoSignature && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border-2 border-green-200 shadow-lg"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <Camera className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-green-800">
                  Photo & Signature
                </h3>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {state.data.photo && (
                    <img
                      src={state.data.photo}
                      alt="Captured photo"
                      className="w-28 h-28 object-cover rounded-xl border-4 border-green-200 shadow-md"
                    />
                  )}
                  {state.data.signature && (
                    <div className="bg-white p-4 rounded-xl border-4 border-green-200 shadow-md flex items-center justify-center">
                      <img
                        src={state.data.signature}
                        alt="Signature"
                        className="max-h-20"
                      />
                    </div>
                  )}
                </div>
                <p className="text-green-700 font-medium">✓ Successfully Captured</p>
              </div>
            </motion.div>
          )}

          {/* Identification */}
          {hasIdentification && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border-2 border-blue-200 shadow-lg"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <FileText className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-blue-800">
                  Identification Document
                </h3>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {state.data.idFront && (
                    <img
                      src={state.data.idFront}
                      alt="ID Front"
                      className="w-32 h-20 object-cover rounded-lg border-4 border-blue-200 shadow-md"
                    />
                  )}
                  {state.data.idBack && (
                    <img
                      src={state.data.idBack}
                      alt="ID Back"
                      className="w-32 h-20 object-cover rounded-lg border-4 border-blue-200 shadow-md"
                    />
                  )}
                </div>
                <p className="text-blue-700 font-medium">✓ Successfully Submitted</p>
              </div>
            </motion.div>
          )}

          {/* Fingerprint */}
          {hasFingerprint && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border-2 border-purple-200 shadow-lg"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                  <FingerprintIcon className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-purple-800">
                  Fingerprint
                </h3>
                <div className="bg-white p-6 rounded-2xl shadow-inner mt-4">
                  <CheckCircle className="w-20 h-20 text-purple-600" />
                </div>
                <p className="text-purple-700 font-medium">✓ Successfully Captured</p>
              </div>
            </motion.div>
          )}
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