import { motion, AnimatePresence } from 'framer-motion';
import { ProgressSidebar } from '@/components/ProgressSidebar';
import { PhotoSignature } from './PhotoSignature';
import { Identification } from './Identification';
import { Fingerprint } from './Fingerprint';
import { Review } from './Review';
import { useBiometric } from '@/contexts/BiometricContext';
import { fetchActivityConfig } from '@/services/api';
import { useEffect, useMemo } from 'react';

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

  const CurrentStep = () => {
    if (state.currentStep === 1) return <PhotoSignature onNext={goToNextStep} />;
    if (state.currentStep === 2 && state.activityConfig?.identification.status)
      return <Identification onNext={goToNextStep} />;
    if (state.currentStep === 3 && state.activityConfig?.fingerprint.status)
      return <Fingerprint onNext={goToNextStep} />;
    if (state.currentStep === 4) return <Review />;

    return <div className="text-center py-10">Loading step...</div>;
  };

  const completedSteps = useMemo(() => {
    const c: number[] = [];
    if (state.submissions.photoSignature) c.push(1);
    if (state.submissions.identification && state.activityConfig?.identification.status) c.push(2);
    if (state.submissions.thumbprints && state.activityConfig?.fingerprint.status) c.push(3);
    if (state.isCompleted) c.push(4);
    return c;
  }, [state.submissions, state.activityConfig, state.isCompleted]);

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
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <ProgressSidebar
              currentStep={state.currentStep}
              completedSteps={completedSteps}
              visibleSteps={visibleSteps}
            />
          </motion.div>

          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              <CurrentStep key={state.currentStep} />
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;