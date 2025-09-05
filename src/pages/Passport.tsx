import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { FileText, Upload, Scan, X } from 'lucide-react';
import { StepCard } from '@/components/StepCard';
import { NavigationButtons } from '@/components/NavigationButtons';
import { Button } from '@/components/ui/button';
import { useBiometric } from '@/contexts/BiometricContext';

export function Passport() {
  const { state, dispatch } = useBiometric();
  const [captureMode, setCaptureMode] = useState<'scan' | 'upload'>('scan');
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleScanPassport = () => {
    // Simulate passport scanning - in real app, would integrate with scanner SDK
    setTimeout(() => {
      const simulatedPassport = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMzMzNzNjIiByeD0iOCIvPgo8cGF0aCBkPSJNMTUgMzBIOTBWNjBIMTV6IiBmaWxsPSIjNGY4YWY3Ii8+CjxwYXRoIGQ9Ik0xNSA4MEgyNDBWMTAwSDE1eiIgZmlsbD0iIzk0YTNiOCIvPgo8cGF0aCBkPSJNMTUgMTEwSDIwMFYxMzBIMTV6IiBmaWxsPSIjOTRhM2I4Ii8+CjxwYXRoIGQ9Ik0xNSAxNDBIMTgwVjE2MEgxNXoiIGZpbGw9IiM5NGEzYjgiLz4KPHN2Zz4=';
      dispatch({ type: 'SET_PASSPORT', passport: simulatedPassport });
    }, 1500);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        dispatch({ type: 'SET_PASSPORT', passport: e.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNext = () => {
    dispatch({ type: 'SET_STEP', step: 3 });
  };

  const handleBack = () => {
    dispatch({ type: 'SET_STEP', step: 1 });
  };

  const isNextDisabled = !state.data.passport;

  return (
    <>
      <StepCard>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-2xl font-bold mb-1">Passport Verification</h2>
          <p className="text-muted-foreground mb-2">
            Scan or upload your passport for identity verification.
          </p>

          <div className="space-y-3">
            <div className="flex gap-4 justify-center">
              <Button
                variant={captureMode === 'scan' ? 'default' : 'outline'}
                onClick={() => setCaptureMode('scan')}
                className="rounded-full px-8 py-3"
              >
                <Scan className="w-4 h-4 mr-2" />
                Scan Passport
              </Button>
              <Button
                variant={captureMode === 'upload' ? 'default' : 'outline'}
                onClick={() => setCaptureMode('upload')}
                className="rounded-full px-8 py-3"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload File
              </Button>
            </div>

            <motion.div
              key={captureMode}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="border-2 border-dashed border-border rounded-2xl p-10 text-center bg-accent/30"
            >
              {state.data.passport ? (
                <div className="space-y-3">
                  <div className="bg-white rounded-xl p-4 inline-block shadow-soft">
                    <img 
                      src={state.data.passport} 
                      alt="Passport scan" 
                      className="max-w-xs max-h-44 object-contain rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        ✓
                      </motion.div>
                    </div>
                    <p className="font-semibold text-green-600">Passport captured successfully</p>
                    <p className="text-sm text-muted-foreground">Document verified and ready for processing</p>
                  </div>
                </div>
              ) : captureMode === 'scan' ? (
                <div className="space-y-3">
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Scan className="w-16 h-16 text-primary mx-auto" />
                  </motion.div>
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold">Scan Your Passport</h3>
                    <p className="text-muted-foreground max-w-md mx-auto text-xs">
                      Place your passport on the scanner and click below to begin the scanning process.
                    </p>
                    <Button 
                      onClick={handleScanPassport}
                      className="rounded-full px-8 py-3 gradient-primary shadow-button"
                    >
                      <Scan className="w-4 h-4 mr-2" />
                      Start Scanning
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <FileText className="w-16 h-16 text-primary mx-auto" />
                  <div className="space-y-3">
                    <h3 className="text-xl font-semibold">Upload Passport Image</h3>
                    <p className="text-muted-foreground max-w-md mx-auto text-sm">
                      Select a clear, high-quality image of your passport information page.
                    </p>
                    <div className="space-y-2">
                      <Button 
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-full px-8 py-3 gradient-primary shadow-button"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Choose File
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Supports JPG, PNG • Max 10MB • Ensure text is clearly readable
                      </p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              )}
            </motion.div>

            <div className="bg-muted/50 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                </div>
                <div className="text-sm">
                  <p className="font-medium mb-1">
                    <button 
                      onClick={() => setShowSecurityModal(true)}
                      className="text-primary hover:underline cursor-pointer"
                    >
                      Security Notice
                    </button>
                  </p>
                  {/* <p className="text-muted-foreground">
                    Your passport information is encrypted and will only be used for identity verification purposes. 
                    We comply with all data protection regulations.
                  </p> */}
                </div>
              </div>
            </div>
          </div>

          <NavigationButtons
            currentStep={2}
            totalSteps={4}
            onBack={handleBack}
            onNext={handleNext}
            isNextDisabled={isNextDisabled}
          />
        </motion.div>
      </StepCard>

      {/* Security Notice Modal */}
      {showSecurityModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Security Notice</h3>
              <button 
                onClick={() => setShowSecurityModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <p>
                Your passport information is encrypted using industry-standard encryption protocols 
                and will only be used for identity verification purposes.
              </p>
              <p>
                We comply with all data protection regulations including GDPR, CCPA, and other 
                applicable privacy laws. Your data is never sold to third parties.
              </p>
              <p>
                All biometric data is processed locally when possible and only transmitted 
                through secure, encrypted channels to our verification servers.
              </p>
            </div>
            <div className="mt-6 flex justify-end">
              <Button 
                onClick={() => setShowSecurityModal(false)}
                className="rounded-full"
              >
                I Understand
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}