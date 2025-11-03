import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Fingerprint as FingerprintIcon, CheckCircle, X, Image as ImageIcon, Eye } from 'lucide-react';
import { StepCard } from '@/components/StepCard';
import { Button } from '@/components/ui/button';
import { useBiometric } from '@/contexts/BiometricContext';
import { initFingerprint, captureThumbprint, searchImages, SearchImagesResponse, getRelationNumber } from '@/services/api';
import { toast } from '@/hooks/use-toast';

interface FingerprintProps {
  mode?: 'capture' | 'update';
}

export function Fingerprint({ mode = 'capture' }: FingerprintProps) {
  const { state, dispatch } = useBiometric();
  const [isScanningThumb1, setIsScanningThumb1] = useState(false);
  const [scanProgressThumb1, setScanProgressThumb1] = useState(0);
  const [isScanningThumb2, setIsScanningThumb2] = useState(false);
  const [scanProgressThumb2, setScanProgressThumb2] = useState(0);
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAsideOpen, setIsAsideOpen] = useState(false);
  const [images, setImages] = useState<SearchImagesResponse | null>(null);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
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
      const timer = setTimeout(() => {
        setIsAsideOpen(false);
      }, 10000);
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
      // Step 1: Initialize fingerprint device (only once, but call for safety)
      if (!isScanningThumb2) {
        toast({ title: "Initializing fingerprint device..." });
        const initResult = await initFingerprint();
        
        if (!initResult.success) {
          throw new Error(initResult.message || 'Failed to initialize device');
        }
      }

      setScanProgressThumb1(25);
      toast({ title: "Device initialized. Please place primary finger on scanner." });

      // Step 2: Capture fingerprint for thumb 1
      await new Promise(resolve => setTimeout(resolve, 1000)); // Brief pause for user
      setScanProgressThumb1(50);
      
      const captureResult = await captureThumbprint('1');
      if (captureResult.response_code === 1) {
        // Success - set progress to 100%
        setScanProgressThumb1(100);
        
        // Convert base64 to data URL
        const fingerprintData = `data:image/jpeg;base64,${captureResult.image}`;
        dispatch({ type: 'SET_THUMBPRINT1', thumbprint1: fingerprintData });
        
        toast({ title: "Right thumb captured and saved to database successfully!" });
        setIsScanningThumb1(false);
      } else {
        throw new Error(captureResult.response_msg || 'Failed to capture right thumb');
      }
    } catch (error) {
      console.error('Primary finger capture error:', error);
      setIsScanningThumb1(false);
      setScanProgressThumb1(0);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({ 
        title: "Primary Finger capture failed", 
        description: errorMessage,
        variant: "destructive" 
      });
    }
  };

  const handleStartScanThumb2 = async () => {
    setIsScanningThumb2(true);
    setScanProgressThumb2(0);

    try {
      // Step 1: Initialize fingerprint device (if not already)
      if (!isScanningThumb1) {
        toast({ title: "Initializing fingerprint device..." });
        const initResult = await initFingerprint();
        
        if (!initResult.success) {
          throw new Error(initResult.message || 'Failed to initialize device');
        }
      }

      setScanProgressThumb2(25);
      toast({ title: "Device initialized. Please place secondary fingerprint on scanner." });

      // Step 2: Capture fingerprint for thumb 2
      await new Promise(resolve => setTimeout(resolve, 1000)); // Brief pause for user
      setScanProgressThumb2(50);
      
      const captureResult = await captureThumbprint('2');
      if (captureResult.response_code === 1) {
        // Success - set progress to 100%
        setScanProgressThumb2(100);
        
        // Convert base64 to data URL
        const fingerprintData = `data:image/jpeg;base64,${captureResult.image}`;
        dispatch({ type: 'SET_THUMBPRINT2', thumbprint2: fingerprintData });
        
        toast({ title: "Secondary fingerprint captured and saved to database successfully!" });
        setIsScanningThumb2(false);
      } else {
        throw new Error(captureResult.response_msg || 'Failed to capture secondary fingerprint');
      }
    } catch (error) {
      console.error('Secondary fingerprint capture error:', error);
      setIsScanningThumb2(false);
      setScanProgressThumb2(0);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({ 
        title: "Secondary fingerprint capture failed", 
        description: errorMessage,
        variant: "destructive" 
      });
    }
  };

  const handleClearThumbprint1 = () => {
    dispatch({ type: 'SET_THUMBPRINT1', thumbprint1: null });
  };

  const handleClearThumbprint2 = () => {
    dispatch({ type: 'SET_THUMBPRINT2', thumbprint2: null });
  };

  const handleNext = () => {
    dispatch({ type: 'SUBMIT_THUMBPRINTS' }); // Fixed: Use 'SUBMIT_THUMBPRINTS' to match BiometricAction
    dispatch({ type: 'SET_STEP', step: 4 });
  };

  const handleBack = () => {
    dispatch({ type: 'SET_STEP', step: 2 });
  };

  const canContinue = state.data.thumbprint1 && state.data.thumbprint2;

  return (
    <>
      <StepCard>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
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

          {mode === 'update' && isAsideOpen && images && (
            <motion.aside
              initial={{ x: 320 }}
              animate={{ x: 0 }}
              exit={{ x: 320 }}
              transition={{ duration: 0.3 }}
              className="fixed md:top-12 top-[4.5rem] md:right-14 right-0 md:h-[calc(98vh-6rem)] h-[calc(98vh-4.5rem)] md:w-48 w-full bg-background border border-border rounded-lg md:rounded-l-lg shadow-lg p-4 overflow-auto z-50"
            >
              <div className="flex justify-between items-center mb-4 sticky top-3 bg-background pb-2">
                <h3 className="text-base font-semibold">Customer Images</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAsideOpen(false)}
                  className="h-6 w-6 p-0"
                >
                  <X className="w-4 h-4 bg-blue-50 rounded-full p-1" />
                </Button>
              </div>
              {images.status !== 'success' || !images.data ? (
                <p className="text-muted-foreground text-sm">No images available</p>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-1 text-sm uppercase tracking-wide text-muted-foreground">Unapproved</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {images.data.unapproved?.thumbprint1 && getImageSrc(images.data.unapproved.thumbprint1) && (
                        <div className="space-y-1 relative">
                          <span className="text-xs font-medium text-muted-foreground">Fingerprint 1</span>
                          <div className="relative group">
                            <img
                              src={getImageSrc(images.data.unapproved.thumbprint1)!}
                              alt="Unapproved Fingerprint 1"
                              className="w-full aspect-square object-cover rounded border cursor-pointer"
                              onClick={() => setViewingImage(getImageSrc(images.data.unapproved.thumbprint1))}
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewingImage(getImageSrc(images.data.unapproved.thumbprint1));
                              }}
                              className="absolute top-1 right-1 bg-white/80 hover:bg-white rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                              type="button"
                              title="View full image"
                            >
                              <Eye className="w-3 h-3 text-gray-600" />
                            </button>
                          </div>
                        </div>
                      )}
                      {images.data.unapproved?.thumbprint2 && getImageSrc(images.data.unapproved.thumbprint2) && (
                        <div className="space-y-1 relative">
                          <span className="text-xs font-medium text-muted-foreground">Fingerprint 2</span>
                          <div className="relative group">
                            <img
                              src={getImageSrc(images.data.unapproved.thumbprint2)!}
                              alt="Unapproved Fingerprint 2"
                              className="w-full aspect-square object-cover rounded border cursor-pointer"
                              onClick={() => setViewingImage(getImageSrc(images.data.unapproved.thumbprint2))}
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewingImage(getImageSrc(images.data.unapproved.thumbprint2));
                              }}
                              className="absolute top-1 right-1 bg-white/80 hover:bg-white rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                              type="button"
                              title="View full image"
                            >
                              <Eye className="w-3 h-3 text-gray-600" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1 text-sm uppercase tracking-wide text-muted-foreground">Approved</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {images.data.approved?.thumbprint1 && getImageSrc(images.data.approved.thumbprint1) && (
                        <div className="space-y-1 relative">
                          <span className="text-xs font-medium text-muted-foreground">Fingerprint 1</span>
                          <div className="relative group">
                            <img
                              src={getImageSrc(images.data.approved.thumbprint1)!}
                              alt="Approved Fingerprint 1"
                              className="w-full aspect-square object-cover rounded border cursor-pointer"
                              onClick={() => setViewingImage(getImageSrc(images.data.approved.thumbprint1))}
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewingImage(getImageSrc(images.data.approved.thumbprint1));
                              }}
                              className="absolute top-1 right-1 bg-white/80 hover:bg-white rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                              type="button"
                              title="View full image"
                            >
                              <Eye className="w-3 h-3 text-gray-600" />
                            </button>
                          </div>
                        </div>
                      )}
                      {images.data.approved?.thumbprint2 && getImageSrc(images.data.approved.thumbprint2) && (
                        <div className="space-y-1 relative">
                          <span className="text-xs font-medium text-muted-foreground">Fingerprint 2</span>
                          <div className="relative group">
                            <img
                              src={getImageSrc(images.data.approved.thumbprint2)!}
                              alt="Approved Fingerprint 2"
                              className="w-full aspect-square object-cover rounded border cursor-pointer"
                              onClick={() => setViewingImage(getImageSrc(images.data.approved.thumbprint2))}
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewingImage(getImageSrc(images.data.approved.thumbprint2));
                              }}
                              className="absolute top-1 right-1 bg-white/80 hover:bg-white rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                              type="button"
                              title="View full image"
                            >
                              <Eye className="w-3 h-3 text-gray-600" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.aside>
          )}

          {viewingImage && (
            <div 
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" 
              onClick={() => setViewingImage(null)}
            >
              <button 
                onClick={() => setViewingImage(null)} 
                className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300"
              >
                &times;
              </button>
              <img 
                src={viewingImage} 
                alt="Full image" 
                className="max-w-full max-h-full object-contain" 
              />
            </div>
          )}

          <div className={`transition-all duration-300 ${isAsideOpen ? 'md:mr-48' : ''} mr-0`}>
            <div className="grid md:grid-cols-2 gap-8">
              {/* Thumb 1 Section */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <FingerprintIcon className="w-5 h-5 text-primary" />
                  Primary Fingerprint
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
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.5 }}
                          className="text-center"
                        >
                          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                          <p className="font-semibold text-green-600 text-sm">Captured</p>
                        </motion.div>
                      ) : isScanningThumb1 ? (
                        <div className="text-center">
                          <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          >
                            <FingerprintIcon className="w-12 h-12 text-primary mb-2" />
                          </motion.div>
                          <p className="font-semibold text-primary text-sm">Scanning...</p>
                          <p className="text-xs text-muted-foreground">{scanProgressThumb1}%</p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <FingerprintIcon className="w-12 h-12 text-muted-foreground mb-2 mx-auto" />
                          {/* <p className="font-semibold text-sm">Place thumb here</p> */}
                        </div>
                      )}

                      {/* Scanning animation overlay */}
                      {isScanningThumb1 && (
                        <motion.div
                          className="absolute inset-0 bg-primary/10"
                          initial={{ clipPath: 'circle(0% at 50% 50%)' }}
                          animate={{ clipPath: `circle(${scanProgressThumb1 / 2}% at 50% 50%)` }}
                          transition={{ duration: 0.1 }}
                        />
                      )}
                    </div>

                    {/* Pulsing rings when scanning */}
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
                    <Button
                      onClick={handleStartScanThumb1}
                      disabled={isScanningThumb1}
                      className="rounded-full px-6 py-2 gradient-primary"
                    >
                      <FingerprintIcon className="w-4 h-4 mr-2 mx-auto" />
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

              {/* Thumb 2 Section */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <FingerprintIcon className="w-5 h-5 text-primary" />
                  Secondary Fingerprint
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
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.5 }}
                          className="text-center"
                        >
                          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                          <p className="font-semibold text-green-600 text-sm">Captured</p>
                        </motion.div>
                      ) : isScanningThumb2 ? (
                        <div className="text-center">
                          <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          >
                            <FingerprintIcon className="w-12 h-12 text-primary mb-2 mx-auto" />
                          </motion.div>
                          <p className="font-semibold text-primary text-sm">Scanning...</p>
                          <p className="text-xs text-muted-foreground">{scanProgressThumb2}%</p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <FingerprintIcon className="w-12 h-20 text-muted-foreground mb-2 mx-auto" />
                          {/* <p className="font-semibold text-sm">Place thumb here</p> */}
                        </div>
                      )}

                      {/* Scanning animation overlay */}
                      {isScanningThumb2 && (
                        <motion.div
                          className="absolute inset-0 bg-primary/10"
                          initial={{ clipPath: 'circle(0% at 50% 50%)' }}
                          animate={{ clipPath: `circle(${scanProgressThumb2 / 2}% at 50% 50%)` }}
                          transition={{ duration: 0.1 }}
                        />
                      )}
                    </div>

                    {/* Pulsing rings when scanning */}
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
                    <Button
                      onClick={handleStartScanThumb2}
                      disabled={isScanningThumb2}
                      className="rounded-full px-6 py-2 gradient-primary"
                    >
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
            </div>

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

            {/* Navigation and Submit Button */}
            <div className="flex items-center justify-between mt-8">
              {/* Back Button */}
              <Button
                onClick={handleBack}
                variant="outline"
                className="rounded-full px-6 py-2"
              >
                Back
              </Button>

              {/* Continue Button (Centered) */}
              {canContinue && (
                <Button
                  onClick={handleNext}
                  className="rounded-full px-8 py-3 gradient-primary shadow-button"
                >
                  Continue to Review
                </Button>
              )}

              {/* Step Indicator */}
              <div className="text-sm text-muted-foreground">
                Step 3 of 4
              </div>
            </div>
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
              <button
                onClick={() => setShowBiometricModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <p>
                Your fingerprint data is converted into a secure mathematical template using
                industry-standard encryption algorithms. The original fingerprint image is never stored.
              </p>
              <p>
                Our biometric system uses advanced pattern recognition that cannot be reverse-engineered
                to recreate your actual fingerprint.
              </p>
              <p>
                All biometric templates are encrypted both at rest and in transit, and we comply with
                international biometric data protection standards including ISO/IEC 19794-2.
              </p>
              <p>
                Your biometric data is only used for verification purposes and is never shared with
                third parties without your explicit consent.
              </p>
            </div>
            <div className="mt-6 flex justify-end">
              <Button
                onClick={() => setShowBiometricModal(false)}
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