import { motion, AnimatePresence } from 'framer-motion';
import { ProgressSidebar } from '@/components/ProgressSidebar';
import { PhotoSignature } from './PhotoSignature';
import { Identification } from './Identification';
import { Fingerprint } from './Fingerprint';
import { Review } from './Review';
import { useBiometric } from '@/contexts/BiometricContext';
import { useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';

const Update = () => {
  const { state } = useBiometric();
  const [searchParams] = useSearchParams();
  
  const relationNo = searchParams.get('relationno');
  
  const getCompletedSteps = () => {
    const completed = [];
    if (state.submissions.photoSignature) completed.push(1);
    if (state.submissions.identification) completed.push(2);
    if (state.submissions.fingerprint) completed.push(3);
    if (state.isCompleted) completed.push(4);
    return completed;
  };

  const renderCurrentStep = () => {
    switch (state.currentStep) {
      case 1:
        return <PhotoSignature key="step-1" mode="update" />;
      case 2:
        return <Identification key="step-2" />;
      case 3:
        return <Fingerprint key="step-3" />;
      case 4:
        return <Review key="step-4" />;
      default:
        return <PhotoSignature key="step-1" mode="update" />;
    }
  };

  useEffect(() => {
    console.log('Update mode - Relation No:', relationNo);
  }, [relationNo]);

  return (
    <div className="min-h-screen bg-gradient-soft">
      <div className="container mx-auto px-4 py-8">
        {/* Update Phase Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold">Update Biometric Data</h1>
          <p className="text-muted-foreground">Relation No: {relationNo || 'N/A'}</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {/* Progress Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-1"
          >
            <ProgressSidebar 
              currentStep={state.currentStep}
              completedSteps={getCompletedSteps()}
            />
          </motion.div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              {renderCurrentStep()}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Update;
