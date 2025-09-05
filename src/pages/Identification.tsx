import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { FileText, Upload, Scan, X, CreditCard, Fingerprint as FingerprintIcon, Vote } from 'lucide-react';
import { StepCard } from '@/components/StepCard';
import { NavigationButtons } from '@/components/NavigationButtons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useBiometric } from '@/contexts/BiometricContext';
import { toast } from '@/hooks/use-toast';

const idTypes = [
  { 
    id: 'passport' as const, 
    label: 'Passport', 
    icon: FileText, 
    description: 'Bio data page only',
    requiresBoth: false 
  },
  { 
    id: 'national-id' as const, 
    label: 'National ID', 
    icon: CreditCard, 
    description: 'Front and back required',
    requiresBoth: true 
  },
  { 
    id: 'voter-id' as const, 
    label: 'Voter ID', 
    icon: Vote, 
    description: 'Front side only',
    requiresBoth: false 
  },
  { 
    id: 'drivers-license' as const, 
    label: 'Driver\'s License', 
    icon: CreditCard, 
    description: 'Front and back required',
    requiresBoth: true 
  },
];

export function Identification() {
  const { state, dispatch } = useBiometric();
  const [captureMode, setCaptureMode] = useState<'scan' | 'upload'>('scan');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  const selectedIdType = idTypes.find(type => type.id === state.data.idType);

  const handleIdTypeSelect = (idType: typeof idTypes[0]['id']) => {
    dispatch({ type: 'SET_ID_TYPE', idType });
  };

  const handleScanFront = () => {
    setTimeout(() => {
      const simulatedId = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMzMzNzNjIiByeD0iOCIvPgo8cGF0aCBkPSJNMTUgMzBIOTBWNjBIMTV6IiBmaWxsPSIjNGY4YWY3Ii8+CjxwYXRoIGQ9Ik0xNSA4MEgyNDBWMTAwSDE1eiIgZmlsbD0iIzk0YTNiOCIvPgo8cGF0aCBkPSJNMTUgMTEwSDIwMFYxMzBIMTV6IiBmaWxsPSIjOTRhM2I4Ii8+CjxwYXRoIGQ9Ik0xNSAxNDBIMTgwVjE2MEgxNXoiIGZpbGw9IiM5NGEzYjgiLz4KPHN2Zz4=';
      dispatch({ type: 'SET_ID_FRONT', idFront: simulatedId });
    }, 1500);
  };

  const handleScanBack = () => {
    setTimeout(() => {
      const simulatedId = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjNGZhZjUwIiByeD0iOCIvPgo8cGF0aCBkPSJNMTUgMzBIOTBWNjBIMTV6IiBmaWxsPSIjODFjNzg0Ii8+CjxwYXRoIGQ9Ik0xNSA4MEgyNDBWMTAwSDE1eiIgZmlsbD0iI2E1ZDZhNyIvPgo8L3N2Zz4=';
      dispatch({ type: 'SET_ID_BACK', idBack: simulatedId });
    }, 1500);
  };

  const handleFrontUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        dispatch({ type: 'SET_ID_FRONT', idFront: e.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBackUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        dispatch({ type: 'SET_ID_BACK', idBack: e.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearFront = () => {
    dispatch({ type: 'SET_ID_FRONT', idFront: null });
  };

  const handleClearBack = () => {
    dispatch({ type: 'SET_ID_BACK', idBack: null });
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    
    setIsSubmitting(true);
    
    // Simulate API submission
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    dispatch({ type: 'SUBMIT_IDENTIFICATION' });
    toast({ title: "Identification submitted successfully!" });
    setIsSubmitting(false);
    
    // Move to next step
    dispatch({ type: 'SET_STEP', step: 3 });
  };

  const handleBack = () => {
    dispatch({ type: 'SET_STEP', step: 1 });
  };

  const canSubmit = state.data.idType && state.data.idFront && 
    (selectedIdType?.requiresBoth ? state.data.idBack : true);

  return (
    <StepCard>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-2xl font-bold mb-1">Identification Document</h2>
        <p className="text-muted-foreground mb-6">
          Select and scan your preferred ID document.
        </p>

        {/* ID Type Selection */}
        {!state.data.idType ? (
          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-semibold">Choose ID Type</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {idTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <motion.button
                    key={type.id}
                    onClick={() => handleIdTypeSelect(type.id)}
                    className="p-4 border-2 border-border rounded-xl hover:border-primary hover:bg-accent/50 transition-all text-left"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-6 h-6 text-primary" />
                      <div>
                        <h4 className="font-semibold">{type.label}</h4>
                        <p className="text-sm text-muted-foreground">{type.description}</p>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Selected ID Type */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <selectedIdType.icon className="w-6 h-6 text-primary" />
                <div>
                  <h3 className="text-lg font-semibold">{selectedIdType.label}</h3>
                  <p className="text-sm text-muted-foreground">{selectedIdType.description}</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => dispatch({ type: 'SET_ID_TYPE', idType: null })}
                className="rounded-full"
              >
                Change
              </Button>
            </div>

            {/* Capture Mode Selection */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Capture Method:</span>
              <div className="flex gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="captureMode"
                    value="scan"
                    checked={captureMode === 'scan'}
                    onChange={() => setCaptureMode('scan')}
                    className="radio"
                  />
                  <Scan className="w-4 h-4" />
                  <span className="text-sm">Scan</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="captureMode"
                    value="upload"
                    checked={captureMode === 'upload'}
                    onChange={() => setCaptureMode('upload')}
                    className="radio"
                  />
                  <Upload className="w-4 h-4" />
                  <span className="text-sm">Upload</span>
                </label>
              </div>
            </div>

            {/* Front ID Capture */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">
                  {selectedIdType?.requiresBoth ? 'Front Side' : selectedIdType?.label}
                </h4>
                {selectedIdType?.requiresBoth && <Badge variant="secondary">Required</Badge>}
              </div>
              
              <motion.div
                className="border-2 border-dashed border-border rounded-xl p-6 text-center bg-accent/30 relative"
              >
                {state.data.idFront ? (
                  <div className="space-y-3">
                    <button
                      onClick={handleClearFront}
                      className="absolute top-2 right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs hover:bg-destructive/80 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <div className="bg-white rounded-xl p-4 inline-block shadow-soft">
                      <img 
                        src={state.data.idFront} 
                        alt="ID front" 
                        className="max-w-xs max-h-32 object-contain rounded-lg"
                      />
                    </div>
                    <p className="text-sm text-green-600 font-semibold">✓ Captured successfully</p>
                  </div>
                ) : captureMode === 'scan' ? (
                  <div className="space-y-4">
                    <Scan className="w-12 h-12 text-primary mx-auto" />
                    <div>
                      <p className="font-medium">Ready to scan</p>
                      <p className="text-sm text-muted-foreground">Position document and scan</p>
                    </div>
                    <Button 
                      onClick={handleScanFront}
                      className="rounded-full gradient-primary"
                    >
                      <Scan className="w-4 h-4 mr-2" />
                      Start Scan
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <FileText className="w-12 h-12 text-primary mx-auto" />
                    <div>
                      <p className="font-medium">Upload document image</p>
                      <p className="text-sm text-muted-foreground">JPG, PNG • Max 10MB</p>
                    </div>
                    <Button 
                      onClick={() => frontInputRef.current?.click()}
                      className="rounded-full gradient-primary"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Choose File
                    </Button>
                    <input
                      ref={frontInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFrontUpload}
                      className="hidden"
                    />
                  </div>
                )}
              </motion.div>
            </div>

            {/* Back ID Capture (if required) */}
            {selectedIdType?.requiresBoth && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Back Side</h4>
                  <Badge variant="secondary">Required</Badge>
                </div>
                
                <motion.div
                  className="border-2 border-dashed border-border rounded-xl p-6 text-center bg-accent/30 relative"
                >
                  {state.data.idBack ? (
                    <div className="space-y-3">
                      <button
                        onClick={handleClearBack}
                        className="absolute top-2 right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs hover:bg-destructive/80 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <div className="bg-white rounded-xl p-4 inline-block shadow-soft">
                        <img 
                          src={state.data.idBack} 
                          alt="ID back" 
                          className="max-w-xs max-h-32 object-contain rounded-lg"
                        />
                      </div>
                      <p className="text-sm text-green-600 font-semibold">✓ Captured successfully</p>
                    </div>
                  ) : captureMode === 'scan' ? (
                    <div className="space-y-4">
                      <Scan className="w-12 h-12 text-primary mx-auto" />
                      <div>
                        <p className="font-medium">Ready to scan back</p>
                        <p className="text-sm text-muted-foreground">Flip document and scan</p>
                      </div>
                      <Button 
                        onClick={handleScanBack}
                        className="rounded-full gradient-primary"
                      >
                        <Scan className="w-4 h-4 mr-2" />
                        Start Scan
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <FileText className="w-12 h-12 text-primary mx-auto" />
                      <div>
                        <p className="font-medium">Upload back side image</p>
                        <p className="text-sm text-muted-foreground">JPG, PNG • Max 10MB</p>
                      </div>
                      <Button 
                        onClick={() => backInputRef.current?.click()}
                        className="rounded-full gradient-primary"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Choose File
                      </Button>
                      <input
                        ref={backInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleBackUpload}
                        className="hidden"
                      />
                    </div>
                  )}
                </motion.div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-center mt-6">
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit || isSubmitting}
                className="rounded-full px-8 py-3 gradient-primary shadow-button"
              >
                {isSubmitting ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                    />
                    Submitting...
                  </>
                ) : (
                  'Submit Identification'
                )}
              </Button>
            </div>
          </div>
        )}

        <NavigationButtons
          currentStep={2}
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