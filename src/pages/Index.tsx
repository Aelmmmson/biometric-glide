import { motion, AnimatePresence } from 'framer-motion';
import { ProgressSidebar } from '@/components/ProgressSidebar';
import { PhotoSignature } from './PhotoSignature';
import { Identification } from './Identification';
import { Fingerprint } from './Fingerprint';
import { Review } from './Review';
import { useBiometric } from '@/contexts/BiometricContext';
import { useParams } from 'react-router-dom';
import { useEffect } from 'react';

const Index = () => {
  const { state } = useBiometric();
  const params = useParams();

  const relationId = params?.payload ? params.payload.split("-").at(1): undefined;
  
  const getCompletedSteps = () => {
    const completed = [];
    if (state.submissions.photoSignature) completed.push(1);
    if (state.submissions.identification) completed.push(2);
    if (state.submissions.thumbprints) completed.push(3);
    if (state.isCompleted) completed.push(4);
    return completed;
  };

  const renderCurrentStep = () => {
    switch (state.currentStep) {
      case 1:
        return <PhotoSignature key="step-1" />;
      case 2:
        return <Identification key="step-2" />;
      case 3:
        return <Fingerprint key="step-3" />;
      case 4:
        return <Review key="step-4" />;
      default:
        return <PhotoSignature key="step-1" />;
    }
  };

  useEffect(()=> {
    console.log(relationId)
  }, [relationId])

  return (
    <div className="min-h-screen bg-gradient-soft">
      <div className="container mx-auto px-4 py-8">
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

export default Index;


// STOP