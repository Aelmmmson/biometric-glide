import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { FileText, Upload, Scan, X, CreditCard, Users, Vote, Car } from 'lucide-react';
import { StepCard } from '@/components/StepCard';
import { NavigationButtons } from '@/components/NavigationButtons';
import { Button } from '@/components/ui/button';
import { useBiometric } from '@/contexts/BiometricContext';

const ID_TYPES = [
  { 
    id: 'passport' as const, 
    label: 'Passport', 
    icon: FileText, 
    description: 'Bio data page',
    requiresBoth: false 
  },
  { 
    id: 'national_id' as const, 
    label: 'National ID', 
    icon: CreditCard, 
    description: 'Ghana Card',
    requiresBoth: true 
  },
  { 
    id: 'voter_id' as const, 
    label: 'Voter ID', 
    icon: Vote, 
    description: 'One side only',
    requiresBoth: false 
  },
  { 
    id: 'driver_license' as const, 
    label: 'Driver\'s License', 
    icon: Car, 
    description: 'Front and back',
    requiresBoth: true 
  },
];

export function Identification() {
  const { state, dispatch } = useBiometric();
  const [captureMode, setCaptureMode] = useState<'scan' | 'upload'>('scan');
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  const selectedType = ID_TYPES.find(type => type.id === state.data.identification.type);
  const requiresBothSides = selectedType?.requiresBoth || false;

  const handleTypeSelection = (idType: typeof ID_TYPES[0]['id']) => {
    dispatch({ type: 'SET_IDENTIFICATION_TYPE', idType });
  };

  const handleScanDocument = (side: 'front' | 'back') => {
    // Simulate document scanning
    setTimeout(() => {
      const simulatedScan = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMzMzNzNjIiByeD0iOCIvPgo8cGF0aCBkPSJNMTUgMzBIOTBWNjBIMTV6IiBmaWxsPSIjNGY4YWY3Ii8+CjxwYXRoIGQ9Ik0xNSA4MEgyNDBWMTAwSDE1eiIgZmlsbD0iIzk0YTNiOCIvPgo8cGF0aCBkPSJNMTUgMTEwSDIwMFYxMzBIMTV6IiBmaWxsPSIjOTRhM2I4Ii8+CjxwYXRoIGQ9Ik0xNSAxNDBIMTgwVjE2MEgxNXoiIGZpbGw9IiM5NGEzYjgiLz4KPHN2Zz4=';
      
      if (side === 'front') {
        dispatch({ type: 'SET_IDENTIFICATION_FRONT', front: simulatedScan });
      } else {
        dispatch({ type: 'SET_IDENTIFICATION_BACK', back: simulatedScan });
      }
    }, 1500);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (side === 'front') {
          dispatch({ type: 'SET_IDENTIFICATION_FRONT', front: result });
        } else {
          dispatch({ type: 'SET_IDENTIFICATION_BACK', back: result });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const clearDocument = (side: 'front' | 'back') => {
    if (side === 'front') {
      dispatch({ type: 'SET_IDENTIFICATION_FRONT', front: null });
    } else {
      dispatch({ type: 'SET_IDENTIFICATION_BACK', back: null });
    }
  };

  const handleNext = () => {
    dispatch({ type: 'SET_STEP', step: 3 });
  };

  const handleBack = () => {
    dispatch({ type: 'SET_STEP', step: 1 });
  };

  const handleSubmit = () => {
    // TODO: Add API call here
    console.log('Submitting identification data:', state.data.identification);
    handleNext();
  };

  const isValid = () => {
    if (!state.data.identification.type || !state.data.identification.front) return false;
    if (requiresBothSides && !state.data.identification.back) return false;
    return true;
  };

  const renderDocumentCapture = (side: 'front' | 'back', label: string) => {
    const hasDocument = side === 'front' ? state.data.identification.front : state.data.identification.back;
    
    return (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">{label}</h3>
        
        <motion.div
          key={`${captureMode}-${side}`}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="border-2 border-dashed border-border rounded-2xl p-6 text-center bg-accent/30 relative"
        >
          {hasDocument ? (
            <div className="space-y-3">
              <button
                onClick={() => clearDocument(side)}
                className="absolute top-2 right-2 w-8 h-8 bg-destructive text-white rounded-full flex items-center justify-center hover:bg-destructive/80 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="bg-white rounded-xl p-4 inline-block shadow-soft">
                <img 
                  src={hasDocument} 
                  alt={`${selectedType?.label} ${side}`} 
                  className="max-w-xs max-h-32 object-contain rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    ✓
                  </motion.div>
                </div>
                <p className="font-semibold text-green-600">Document captured</p>
              </div>
            </div>
          ) : captureMode === 'scan' ? (
            <div className="space-y-3">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Scan className="w-12 h-12 text-primary mx-auto" />
              </motion.div>
              <div className="space-y-3">
                <p className="text-muted-foreground text-sm">
                  Place {label.toLowerCase()} on scanner
                </p>
                <Button 
                  onClick={() => handleScanDocument(side)}
                  className="rounded-full px-6 py-2 gradient-primary shadow-button"
                  size="sm"
                >
                  <Scan className="w-4 h-4 mr-2" />
                  Start Scan
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <FileText className="w-12 h-12 text-primary mx-auto" />
              <div className="space-y-3">
                <p className="text-muted-foreground text-sm">
                  Upload {label.toLowerCase()} image
                </p>
                <Button 
                  onClick={() => side === 'front' ? frontInputRef.current?.click() : backInputRef.current?.click()}
                  className="rounded-full px-6 py-2 gradient-primary shadow-button"
                  size="sm"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Choose File
                </Button>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG • Max 10MB
                </p>
              </div>
              <input
                ref={side === 'front' ? frontInputRef : backInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => handleFileUpload(e, side)}
                className="hidden"
              />
            </div>
          )}
        </motion.div>
      </div>
    );
  };

  return (
    <>
      <StepCard>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-2xl font-bold mb-1">Identification</h2>
          <p className="text-muted-foreground mb-6">
            Choose and upload your preferred ID document.
          </p>

          {!state.data.identification.type ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Select ID Type</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {ID_TYPES.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.id}
                      onClick={() => handleTypeSelection(type.id)}
                      className="p-4 border-2 border-border rounded-xl hover:border-primary transition-colors text-center space-y-2 hover:bg-accent/50"
                    >
                      <Icon className="w-8 h-8 text-primary mx-auto" />
                      <div>
                        <p className="font-medium">{type.label}</p>
                        <p className="text-xs text-muted-foreground">{type.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <selectedType.icon className="w-5 h-5 text-primary" />
                  <span className="font-semibold">{selectedType.label}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => dispatch({ type: 'CLEAR_IDENTIFICATION' })}
                  className="rounded-full"
                >
                  Change
                </Button>
              </div>

              <div className="flex gap-4 justify-center mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="captureMode"
                    checked={captureMode === 'scan'}
                    onChange={() => setCaptureMode('scan')}
                    className="w-4 h-4 text-primary"
                  />
                  <Scan className="w-4 h-4" />
                  <span>Scan</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="captureMode"
                    checked={captureMode === 'upload'}
                    onChange={() => setCaptureMode('upload')}
                    className="w-4 h-4 text-primary"
                  />
                  <Upload className="w-4 h-4" />
                  <span>Upload</span>
                </label>
              </div>

              <div className={requiresBothSides ? "grid md:grid-cols-2 gap-6" : "max-w-md mx-auto"}>
                {renderDocumentCapture('front', requiresBothSides ? 'Front Side' : selectedType.label)}
                {requiresBothSides && renderDocumentCapture('back', 'Back Side')}
              </div>

              {isValid() && (
                <div className="flex justify-center pt-4">
                  <Button
                    onClick={handleSubmit}
                    className="rounded-full px-8 py-3 gradient-primary shadow-button"
                  >
                    Submit Identification
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="bg-muted/50 rounded-xl p-4 mt-6">
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
              </div>
            </div>
          </div>

          <NavigationButtons
            currentStep={2}
            totalSteps={4}
            onBack={handleBack}
            onNext={handleNext}
            isNextDisabled={!isValid()}
            showNext={isValid()}
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
                Your identification documents are encrypted using industry-standard protocols 
                and used only for identity verification.
              </p>
              <p>
                We comply with all data protection regulations including GDPR and CCPA. 
                Your data is never sold to third parties.
              </p>
              <p>
                All document data is processed securely and transmitted through encrypted channels.
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