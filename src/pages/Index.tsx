import { motion, AnimatePresence } from 'framer-motion';
import { ProgressSidebar } from '@/components/ProgressSidebar';
import { PhotoSignature } from './PhotoSignature';
import { Identification } from './Identification';
import { Fingerprint } from './Fingerprint';
import { Review } from './Review';
import { useBiometric } from '@/hooks/useBiometric';
import { fetchActivityConfig } from '@/services/api';
import { useEffect, useMemo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const Index = () => {
  const { state, dispatch, setActivityConfig, setActivityConfigLoaded } = useBiometric();

  // Load config once on mount
  useEffect(() => {
    if (!state.isActivityConfigLoaded) {
      fetchActivityConfig()
        .then((res) => {
          if (res.success && res.data) {
            setActivityConfig(res.data);
          }
          setActivityConfigLoaded();
        })
        .catch(() => setActivityConfigLoaded());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ← Intentional: run once

  const visibleSteps = useMemo(() => {
    if (!state.activityConfig) return [1, 2, 3, 4];
    const steps = [1];
    if (state.activityConfig.identification.status) steps.push(2);
    if (state.activityConfig.fingerprint.status) steps.push(3);
    steps.push(4);
    return steps;
  }, [state.activityConfig]);

  const goToNextStep = () => {
    if (!state.activityConfig) {
      dispatch({ type: 'SET_STEP', step: state.currentStep + 1 });
      return;
    }

    const { identification, fingerprint } = state.activityConfig;
    let next = state.currentStep;

    if (state.currentStep === 1)
      next = identification.status ? 2 : fingerprint.status ? 3 : 4;
    else if (state.currentStep === 2)
      next = fingerprint.status ? 3 : 4;
    else if (state.currentStep === 3)
      next = 4;

    dispatch({ type: 'SET_STEP', step: next });
  };


  const completedSteps = useMemo(() => {
    const c: number[] = [];
    const hasPhotoSignature = !!(state.data.photo || state.data.signature);
    const hasIdentification = !!(state.data.idFront || state.data.idBack);
    const hasFingerprint = !!(state.data.thumbprint1 || state.data.thumbprint2);

    if (hasPhotoSignature) c.push(1);
    if (hasIdentification && state.activityConfig?.identification?.status) c.push(2);
    if (hasFingerprint && state.activityConfig?.fingerprint?.status) c.push(3);
    if (state.isCompleted) c.push(4);
    return c;
  }, [state.data, state.activityConfig, state.isCompleted]);

  if (!state.isActivityConfigLoaded) {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg">Loading workflow configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-soft">
      <div className="w-full px-3 md:px-6 py-6">
        <div className="grid xl:grid-cols-5 gap-6 max-w-[1700px] mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="xl:col-span-1"
          >
            <ProgressSidebar
              currentStep={state.currentStep}
              completedSteps={completedSteps}
              visibleSteps={visibleSteps}
            />
          </motion.div>

          <div className="xl:col-span-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={state.currentStep}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <ErrorBoundary>
                  {state.currentStep === 1 && (
                    <PhotoSignature onNext={goToNextStep} />
                  )}
                  {state.currentStep === 2 && state.activityConfig?.identification?.status && (
                    <Identification onNext={goToNextStep} />
                  )}
                  {state.currentStep === 3 && state.activityConfig?.fingerprint?.status && (
                    <Fingerprint onNext={goToNextStep} />
                  )}
                  {state.currentStep === 4 && (
                    <Review />
                  )}
                  {state.currentStep > 4 || (state.currentStep > 1 && !state.activityConfig) ? (
                    <div className="text-center py-10">Loading step...</div>
                  ) : null}
                </ErrorBoundary>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;