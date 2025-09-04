import { ProgressSidebar } from '@/components/ProgressSidebar';
import { PhotoSignature } from './PhotoSignature';
import { Identification } from './Identification';
import { Fingerprint } from './Fingerprint';
import { Review } from './Review';
import { useBiometric } from '@/contexts/BiometricContext';

const Index = () => {
  const { state } = useBiometric();

  const renderCurrentStep = () => {
    switch (state.currentStep) {
      case 1:
        return <PhotoSignature />;
      case 2:
        return <Identification />;
      case 3:
        return <Fingerprint />;
      case 4:
        return <Review />;
      default:
        return <PhotoSignature />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <ProgressSidebar />
      <main className="md:ml-80">
        {renderCurrentStep()}
      </main>
    </div>
  );
};

export default Index;