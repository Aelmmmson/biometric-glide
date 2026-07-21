import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Fingerprint as FingerprintIcon,
  CheckCircle,
  X,
  Image as ImageIcon,
  Eye,
  Plus,
} from 'lucide-react';
import { StepCard } from '@/components/StepCard';
import { Button } from '@/components/ui/button';
import { useBiometric } from '@/hooks/useBiometric';
import {
  initFingerprint,
  captureThumbprint,
  searchImages,
  SearchImagesResponse,
  getRelationNumber,
} from '@/services/api';
import { toast } from '@/hooks/use-toast';
import { handleSystemError } from '@/lib/errorHandler';
import { ExistingImagesCard } from '@/components/ExistingImagesCard';

interface FingerprintProps {
  mode?: 'capture' | 'update';
  onNext?: () => void; // ← NEW: Controlled navigation from parent
}

export function Fingerprint({ mode = 'capture', onNext }: FingerprintProps) {
  const { state, dispatch } = useBiometric();
  const [isScanningThumb1, setIsScanningThumb1] = useState(false);
  const [scanProgressThumb1, setScanProgressThumb1] = useState(0);
  const [isScanningThumb2, setIsScanningThumb2] = useState(false);
  const [scanProgressThumb2, setScanProgressThumb2] = useState(0);
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [isAsideOpen, setIsAsideOpen] = useState(false);
  const [images, setImages] = useState<SearchImagesResponse | null>(null);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [showSecondary, setShowSecondary] = useState(false);
  const hasAutoClosed = useRef(false);

  useEffect(() => {
    if (mode === 'update') {
      const relationNo = getRelationNumber();
      searchImages(relationNo).then(setImages).catch(console.error);
      setIsAsideOpen(true);
    }
  }, [mode]);

  useEffect(() => {
    if (mode === 'update' && images && isAsideOpen && !hasAutoClosed.current) {
      hasAutoClosed.current = true;
      const timer = setTimeout(() => setIsAsideOpen(false), 300000);
      return () => clearTimeout(timer);
    }
  }, [mode, images, isAsideOpen]);

  const getImageSrc = (image?: string) => {
    if (!image || image.trim() === '') return undefined;
    return image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`;
  };

  const handleStartScanThumb1 = async () => {
    setIsScanningThumb1(true);
    setScanProgressThumb1(0);

    try {
      if (!isScanningThumb2) {
        toast({ title: 'Initializing fingerprint device...' });
        const initResult = await initFingerprint();
        if (!initResult.success) {
          throw new Error(initResult.message || 'Failed to initialize device');
        }
      }

      setScanProgressThumb1(25);
      toast({ title: 'Device initialized. Please place primary finger on scanner.' });

      await new Promise((resolve) => setTimeout(resolve, 1000));
      setScanProgressThumb1(50);

      const captureResult = await captureThumbprint('1');
      if (captureResult.response_code === 1) {
        setScanProgressThumb1(100);
        const fingerprintData = `data:image/jpeg;base64,${captureResult.image}`;
        dispatch({ type: 'SET_THUMBPRINT1', thumbprint1: fingerprintData });
        toast({ title: 'Primary fingerprint captured successfully!' });
        setIsScanningThumb1(false);
      } else {
        throw new Error(captureResult.response_msg || 'Scan timed out or no finger detected');
      }
    } catch (error: any) {
      setIsScanningThumb1(false);
      setScanProgressThumb1(0);
      const errMsg = (error?.message || '').toLowerCase();
      if (errMsg.includes('timeout') || errMsg.includes('time out') || errMsg.includes('delay') || errMsg.includes('no finger') || errMsg.includes('failed to capture') || errMsg.includes('scan timed out')) {
        toast({
          title: "Scan Timed Out",
          description: "No finger detected on the scanner in time. Please click 'Scan Primary Finger' and place your finger firmly on the device.",
        });
      } else {
        const uiError = handleSystemError(error, 'Fingerprint.handleStartScanThumb1');
        toast({
          title: uiError.alert,
          description: uiError.action,
          variant: 'destructive',
        });
      }
    }
  };

  const handleStartScanThumb2 = async () => {
    setIsScanningThumb2(true);
    setScanProgressThumb2(0);

    try {
      if (!isScanningThumb1) {
        toast({ title: 'Initializing fingerprint device...' });
        const initResult = await initFingerprint();
        if (!initResult.success) {
          throw new Error(initResult.message || 'Failed to initialize device');
        }
      }

      setScanProgressThumb2(25);
      toast({ title: 'Device initialized. Please place secondary finger on scanner.' });

      await new Promise((resolve) => setTimeout(resolve, 1000));
      setScanProgressThumb2(50);

      const captureResult = await captureThumbprint('2');
      if (captureResult.response_code === 1) {
        setScanProgressThumb2(100);
        const fingerprintData = `data:image/jpeg;base64,${captureResult.image}`;
        dispatch({ type: 'SET_THUMBPRINT2', thumbprint2: fingerprintData });
        toast({ title: 'Secondary fingerprint captured successfully!' });
        setIsScanningThumb2(false);
      } else {
        throw new Error(captureResult.response_msg || 'Scan timed out or no finger detected');
      }
    } catch (error: any) {
      setIsScanningThumb2(false);
      setScanProgressThumb2(0);
      const errMsg = (error?.message || '').toLowerCase();
      if (errMsg.includes('timeout') || errMsg.includes('time out') || errMsg.includes('delay') || errMsg.includes('no finger') || errMsg.includes('failed to capture') || errMsg.includes('scan timed out')) {
        toast({
          title: "Scan Timed Out",
          description: "No finger detected on the scanner in time. Please click 'Scan Secondary Finger' and place your finger firmly on the device.",
        });
      } else {
        const uiError = handleSystemError(error, 'Fingerprint.handleStartScanThumb2');
        toast({
          title: uiError.alert,
          description: uiError.action,
          variant: 'destructive',
        });
      }
    }
  };

  const handleClearThumbprint1 = () => {
    dispatch({ type: 'SET_THUMBPRINT1', thumbprint1: null });
  };

  const handleClearThumbprint2 = () => {
    dispatch({ type: 'SET_THUMBPRINT2', thumbprint2: null });
  };

  const handleContinue = () => {
    dispatch({ type: 'SUBMIT_THUMBPRINTS' });
    toast({ title: 'Fingerprint(s) submitted successfully!' });

    // ← Let parent decide next step (Review)
    onNext?.();
  };

  const handleBack = () => {
    // Go back to previous enabled step (could be ID or Photo)
    dispatch({ type: 'SET_STEP', step: state.currentStep - 1 });
  };

  const canContinue = mode === 'update' ? true : !!state.data.thumbprint1;

  return (
    <>
      <StepCard>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          <div className="flex justify-between items-center mb-1">
            <h2 className="text-2xl font-bold">
              {mode === 'update' ? 'Update Fingerprints' : 'Fingerprint Capture'}
            </h2>
            {mode === 'update' && !isAsideOpen && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAsideOpen(true)}
                className="flex items-center gap-1 h-8 px-3"
              >
                <ImageIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Images</span>
              </Button>
            )}
          </div>
          <p className="text-muted-foreground mb-6">
            {mode === 'update' ? 'Update your fingerprints.' : 'Place your finger on the scanner.'}
          </p>



          {/* Full Image Viewer */}
          {viewingImage && (
            <div
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
              onClick={() => setViewingImage(null)}
            >
              <button
                onClick={() => setViewingImage(null)}
                className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300"
              >
                ×
              </button>
              <img src={viewingImage} alt="Full image" className="max-w-full max-h-full object-contain" />
            </div>
          )}

          <div className={`grid grid-cols-1 ${mode === 'update' && isAsideOpen && images ? 'lg:grid-cols-12' : ''} gap-5 items-start`}>
            <div className={`space-y-6 ${mode === 'update' && isAsideOpen && images ? 'lg:col-span-10' : ''}`}>
            <div className={`grid ${showSecondary ? 'md:grid-cols-2' : 'grid-cols-1'} gap-8`}>
              {/* Primary Fingerprint */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <FingerprintIcon className="w-5 h-5 text-primary" />
                  Primary Fingerprint (Required)
                </h3>
                <div className="flex flex-col items-center space-y-4">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="relative"
                  >
                    <div className="w-40 h-40 bg-gradient-to-br from-accent to-muted rounded-full flex items-center justify-center border-4 border-primary/20 relative overflow-hidden">
                      {state.data.thumbprint1 ? (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.5 }} className="text-center">
                          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                          <p className="font-semibold text-green-600 text-sm">Captured</p>
                        </motion.div>
                      ) : isScanningThumb1 ? (
                        <div className="text-center">
                          <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                            <FingerprintIcon className="w-12 h-12 text-primary mb-2" />
                          </motion.div>
                          <p className="font-semibold text-primary text-sm">Scanning...</p>
                          <p className="text-xs text-muted-foreground">{scanProgressThumb1}%</p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <FingerprintIcon className="w-12 h-12 text-muted-foreground mb-2 mx-auto" />
                        </div>
                      )}

                      {isScanningThumb1 && (
                        <motion.div
                          className="absolute inset-0 bg-primary/10"
                          initial={{ clipPath: 'circle(0% at 50% 50%)' }}
                          animate={{ clipPath: `circle(${scanProgressThumb1 / 2}% at 50% 50%)` }}
                          transition={{ duration: 0.1 }}
                        />
                      )}
                    </div>

                    {isScanningThumb1 && (
                      <>
                        <motion.div
                          className="absolute inset-0 rounded-full border-2 border-primary/30"
                          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                        <motion.div
                          className="absolute inset-0 rounded-full border-2 border-primary/20"
                          animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
                          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                        />
                      </>
                    )}
                  </motion.div>

                  {!state.data.thumbprint1 && (
                    <Button onClick={handleStartScanThumb1} disabled={isScanningThumb1} className="rounded-full px-6 py-2 gradient-primary">
                      <FingerprintIcon className="w-4 h-4 mr-2" />
                      {isScanningThumb1 ? 'Scanning...' : 'Scan Primary Finger'}
                    </Button>
                  )}

                  {state.data.thumbprint1 && (
                    <button
                      onClick={handleClearThumbprint1}
                      className="w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs hover:bg-destructive/80 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Secondary Fingerprint */}
              {showSecondary && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <FingerprintIcon className="w-5 h-5 text-primary" />
                    Secondary Fingerprint (Optional)
                  </h3>
                  <div className="flex flex-col items-center space-y-4">
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.5 }}
                      className="relative"
                    >
                      <div className="w-40 h-40 bg-gradient-to-br from-accent to-muted rounded-full flex items-center justify-center border-4 border-primary/20 relative overflow-hidden">
                        {state.data.thumbprint2 ? (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.5 }} className="text-center">
                            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                            <p className="font-semibold text-green-600 text-sm">Captured</p>
                          </motion.div>
                        ) : isScanningThumb2 ? (
                          <div className="text-center">
                            <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                              <FingerprintIcon className="w-12 h-12 text-primary mb-2" />
                            </motion.div>
                            <p className="font-semibold text-primary text-sm">Scanning...</p>
                            <p className="text-xs text-muted-foreground">{scanProgressThumb2}%</p>
                          </div>
                        ) : (
                          <div className="text-center">
                            <FingerprintIcon className="w-12 h-12 text-muted-foreground mb-2 mx-auto" />
                          </div>
                        )}

                        {isScanningThumb2 && (
                          <motion.div
                            className="absolute inset-0 bg-primary/10"
                            initial={{ clipPath: 'circle(0% at 50% 50%)' }}
                            animate={{ clipPath: `circle(${scanProgressThumb2 / 2}% at 50% 50%)` }}
                            transition={{ duration: 0.1 }}
                          />
                        )}
                      </div>

                      {isScanningThumb2 && (
                        <>
                          <motion.div
                            className="absolute inset-0 rounded-full border-2 border-primary/30"
                            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                          <motion.div
                            className="absolute inset-0 rounded-full border-2 border-primary/20"
                            animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
                            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                          />
                        </>
                      )}
                    </motion.div>

                    {!state.data.thumbprint2 && (
                      <Button onClick={handleStartScanThumb2} disabled={isScanningThumb2} variant="outline" className="rounded-full px-6 py-2">
                        <FingerprintIcon className="w-4 h-4 mr-2" />
                        {isScanningThumb2 ? 'Scanning...' : 'Scan Secondary Finger'}
                      </Button>
                    )}

                    {state.data.thumbprint2 && (
                      <button
                        onClick={handleClearThumbprint2}
                        className="w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs hover:bg-destructive/80 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Add Secondary Button */}
            {!showSecondary && state.data.thumbprint1 && (
              <div className="mt-6 text-center">
                <Button onClick={() => setShowSecondary(true)} variant="outline" className="rounded-full px-8 py-2">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Secondary Fingerprint (Optional)
                </Button>
              </div>
            )}

            {/* Biometric Security Link */}
            <div className="mt-8 text-center">
              <button
                onClick={() => setShowBiometricModal(true)}
                className="flex items-center gap-2 text-primary hover:underline cursor-pointer justify-center"
              >
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                </div>
                <span className="font-medium">Biometric Security</span>
              </button>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8">
              {mode === 'update' ? (
                <Button onClick={handleBack} variant="outline" className="rounded-full px-6 py-2">
                  Back
                </Button>
              ) : (
                <div />
              )}

              {canContinue && (
                <Button onClick={handleContinue} className="rounded-full px-8 py-3 gradient-primary shadow-button">
                  Next
                </Button>
              )}

              <div className="text-sm text-muted-foreground">Step 3 of 4</div>
            </div>
          </div>

          {mode === 'update' && isAsideOpen && images && (
            <ExistingImagesCard
              images={images}
              onClose={() => setIsAsideOpen(false)}
              onViewImage={(src) => setViewingImage(src)}
              className="lg:col-span-2"
            />
          )}
        </div>
        </motion.div>
      </StepCard>

      {/* Biometric Security Modal */}
      {showBiometricModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Biometric Security</h3>
              <button onClick={() => setShowBiometricModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <p>Your fingerprint data is converted into a secure mathematical template using industry-standard encryption algorithms. The original fingerprint image is never stored.</p>
              <p>Our biometric system uses advanced pattern recognition that cannot be reverse-engineered to recreate your actual fingerprint.</p>
              <p>All biometric templates are encrypted both at rest and in transit, and we comply with international biometric data protection standards including ISO/IEC 19794-2.</p>
              <p>Your biometric data is only used for verification purposes and is never shared with third parties without your explicit consent.</p>
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={() => setShowBiometricModal(false)} className="rounded-full">
                I Understand
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}