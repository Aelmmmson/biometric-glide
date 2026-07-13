import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Camera,
  Upload,
  Signature,
  Image as ImageIcon,
  X,
  Edit,
  Eye,
  Award,
} from 'lucide-react';
import Webcam from 'react-webcam';
import { StepCard } from '@/components/StepCard';
import { Button } from '@/components/ui/button';
import { useBiometric } from '@/hooks/useBiometric';
import { toast } from '@/hooks/use-toast';
import { handleSystemError } from '@/lib/errorHandler';
import {
  listener,
  startTablet,
  ClearTablet,
  LcdRefresh,
  stopTablet,
} from './SigWebTablet';
import {
  captureBrowse,
  saveData,
  updateData,
  getRelationNumber,
  searchImages,
  SearchImagesResponse,
  prefetchCapturedImages,
  type StandaloneRelation,
} from '@/services/api';
import { ImageEditor } from '@/components/ImageEditor';
import { enableSafeMode, disableSafeMode, safeStopTablet } from './safeTablet';

interface ExtendedWindow extends Window {
  sigWebInitialized?: boolean;
}

interface PhotoSignatureProps {
  mode?: 'capture' | 'update';
  onNext?: () => void;
}

export function PhotoSignature({
  mode = 'capture',
  onNext,
}: PhotoSignatureProps) {
  const { state, dispatch } = useBiometric();
  const [relationDetails, setRelationDetails] = useState<StandaloneRelation | null>(() => {
    const rNo = getRelationNumber();
    if (rNo) {
      const storedRels = localStorage.getItem('standalone_relations');
      if (storedRels) {
        const rels = JSON.parse(storedRels);
        if (rels[rNo]) {
          return rels[rNo];
        }
      }
    }
    return null;
  });

  const hasExistingLimit = (state.params.limit && state.params.limit !== '-' && state.params.limit !== '--') ||
                           (relationDetails?.amtlimit !== undefined && relationDetails?.amtlimit !== null && relationDetails?.amtlimit !== 0);

  const hasExistingMandate = (state.params.mandate && state.params.mandate !== '-' && state.params.mandate !== '--') ||
                             (relationDetails?.signatoryLevel && relationDetails?.signatoryLevel !== '-' && relationDetails?.signatoryLevel !== '--');

  const showAuthInputs = !hasExistingLimit || !hasExistingMandate;

  const [inputMandate, setInputMandate] = useState(() => {
    if (state.params.mandate && state.params.mandate !== '-' && state.params.mandate !== '--') return state.params.mandate;
    if (relationDetails?.signatoryLevel && relationDetails?.signatoryLevel !== '-' && relationDetails?.signatoryLevel !== '--') return relationDetails.signatoryLevel;
    return '';
  });

  const [inputLimit, setInputLimit] = useState(() => {
    if (state.params.limit && state.params.limit !== '-' && state.params.limit !== '--') return state.params.limit;
    if (relationDetails?.amtlimit !== undefined && relationDetails?.amtlimit !== null && relationDetails?.amtlimit !== 0) return relationDetails.amtlimit.toString();
    return '';
  });

  const [photoMode, setPhotoMode] = useState<'capture' | 'upload'>('capture');
  const [signatureMode, setSignatureMode] = useState<'draw' | 'upload'>('draw');
  const [sigCaptured, setSigCaptured] = useState<{ image: HTMLImageElement; sig: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState(false);
  const [editingSignature, setEditingSignature] = useState(false);
  const [isAsideOpen, setIsAsideOpen] = useState(false);
  const [images, setImages] = useState<SearchImagesResponse | null>(null);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);

  const openImageViewer = (imgSrc: string) => {
    setZoomLevel(1.0);
    setViewingImage(imgSrc);
  };

  useEffect(() => {
    const rNo = getRelationNumber();
    if (rNo) {
      const storedRels = localStorage.getItem('standalone_relations');
      if (storedRels) {
        const rels = JSON.parse(storedRels);
        if (rels[rNo]) {
          setRelationDetails(rels[rNo]);
        }
      }
    }
  }, [state.params]);

  useEffect(() => {
    if (relationDetails) {
      if (relationDetails.signatoryLevel && relationDetails.signatoryLevel !== '-' && relationDetails.signatoryLevel !== '--') {
        setInputMandate(relationDetails.signatoryLevel);
      }
      if (relationDetails.amtlimit !== undefined && relationDetails.amtlimit !== null && relationDetails.amtlimit !== 0) {
        setInputLimit(relationDetails.amtlimit.toString());
      }
    }
  }, [relationDetails]);

  const [isPhotoChanged, setIsPhotoChanged] = useState(false);
  const [isSignatureChanged, setIsSignatureChanged] = useState(false);
  const hasAutoClosed = useRef(false);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const webcamRef = useRef<Webcam>(null);
  const isTabletActiveRef = useRef(false);

  const videoConstraints = {
    width: { ideal: 640 },
    height: { ideal: 480 },
    facingMode: 'user',
  };

  // CLEANUP - enables safe mode to prevent errors during unmount
  useEffect(() => {
    return () => {
      // Enable safe mode to block any tablet requests during unmount
      enableSafeMode();
      
      // Try to stop tablet safely (won't cause errors because safe mode is active)
      try {
        safeStopTablet();
      } catch (error) {
        // Ignore
      }
      
      // Disable safe mode after a delay to allow any pending requests to complete
      setTimeout(() => {
        disableSafeMode();
      }, 100);
    };
  }, []);

  // Update mode: load existing images
  useEffect(() => {
    if (mode === 'update') {
      const relationNo = getRelationNumber();
      searchImages(relationNo).then(setImages).catch(console.error);
      setIsAsideOpen(true);
    }
  }, [mode]);

  const hasPrefetched = useRef(false);

  // Persistence logic for refresh
  useEffect(() => {
    const relationNo = getRelationNumber();
    if (relationNo && relationNo !== '000001' && !hasPrefetched.current) {
      hasPrefetched.current = true;
      prefetchCapturedImages(relationNo).then(prefetch => {
        if (prefetch.photo && !state.data.photo) {
          dispatch({ type: 'SET_PHOTO', photo: prefetch.photo });
        }
        if (prefetch.signature && !state.data.signature) {
          dispatch({ type: 'SET_SIGNATURE', signature: prefetch.signature });
        }
      }).catch(console.error);
    }
  }, [state.data.photo, state.data.signature, dispatch]);

  useEffect(() => {
    if (mode === 'update' && images && isAsideOpen && !hasAutoClosed.current) {
      hasAutoClosed.current = true;
      const timer = setTimeout(() => setIsAsideOpen(false), 300000);
      return () => clearTimeout(timer);
    }
  }, [mode, images, isAsideOpen]);

  const capturePhoto = async () => {
    const screenshot = webcamRef.current?.getScreenshot();
    if (!screenshot) return;

    dispatch({ type: 'SET_PHOTO', photo: screenshot });
    setIsPhotoChanged(true);

    const result = await captureBrowse(screenshot, 1);
    if (result.success) {
      toast({ title: "Photo captured and saved successfully!" });
    } else {
      toast({ title: "Photo captured but failed to save", description: result.message, variant: "destructive" });
    }
  };

  const getImageSrc = (image?: string) => {
    if (!image || image.trim() === '') return undefined;
    return image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`;
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64Data = e.target?.result as string;
      dispatch({ type: 'SET_PHOTO', photo: base64Data });
      setIsPhotoChanged(true);

      const result = await captureBrowse(base64Data, 1);
      if (result.success) {
        toast({ title: "Photo uploaded and saved successfully!" });
      } else {
        toast({ title: "Photo uploaded but failed to save", description: result.message, variant: "destructive" });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSignatureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64Data = e.target?.result as string;
      dispatch({ type: 'SET_SIGNATURE', signature: base64Data });
      setIsSignatureChanged(true);

      const result = await captureBrowse(base64Data, 2);
      if (result.success) {
        toast({ title: "Signature uploaded and saved successfully!" });
      } else {
        toast({ title: "Signature uploaded but failed to save", description: result.message, variant: "destructive" });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSigCapture = async (sig: string) => {
    const image = new Image();
    const base64Data = 'data:image/png;base64,' + sig;
    image.src = base64Data;
    setSigCaptured({ image, sig });
    dispatch({ type: 'SET_SIGNATURE', signature: base64Data });
    setIsSignatureChanged(true);
    
    try {
      stopTablet();
    } catch (error) {
      console.warn('Failed to stop tablet:', error);
    }
    isTabletActiveRef.current = false;

    const result = await captureBrowse(base64Data, 2);
    if (result.success) {
      toast({ title: "Signature captured and saved successfully!" });
    } else {
      toast({ title: "Signature captured but failed to save", description: result.message, variant: "destructive" });
    }
  };

  const clearSignature = () => {
    setSigCaptured(null);
    dispatch({ type: 'SET_SIGNATURE', signature: null });
    setIsSignatureChanged(true);
    try {
      ClearTablet();
      LcdRefresh(0, 0, 0, 240, 64);
      stopTablet();
    } catch (error) {
      console.warn('Failed to clear tablet:', error);
    }
    isTabletActiveRef.current = false;
  };

  const handleClearPhoto = () => {
    dispatch({ type: 'SET_PHOTO', photo: null });
    setIsPhotoChanged(true);
  };

  const handleDownload = () => {
    if (sigCaptured) {
      const link = document.createElement('a');
      link.href = sigCaptured.image.src;
      link.download = 'signature.png';
      link.click();
    }
  };

  const handleSubmit = async () => {
    const finalLimit = showAuthInputs ? inputLimit : state.params.limit;
    const finalMandate = showAuthInputs ? inputMandate : state.params.mandate;

    // If no changes, just go to next step
    if (!isPhotoChanged && !isSignatureChanged && state.data.photo && state.data.signature && (!showAuthInputs || (finalLimit === state.params.limit && finalMandate === state.params.mandate))) {
      if (isTabletActiveRef.current) {
        try {
          stopTablet();
        } catch (error) {
          // Ignore
        }
        isTabletActiveRef.current = false;
      }
      onNext?.();
      return;
    }

    if (!state.data.photo || !state.data.signature || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const submitFn = mode === 'update' ? updateData : saveData;
      const { params } = state;

      const result = await submitFn({
        photoData: state.data.photo!,
        signatureData: state.data.signature!,
        cus_no: params.relationNo || params.custNo,
        batchNumber: params.batch || 'TEMP',
        capturedBy: params.capturedBy,
        capturedDate: params.capturedDate,
        limit: finalLimit,
        mandate: finalMandate
      });

      if (result.success) {
        dispatch({
          type: 'SET_PARAMS',
          params: {
            ...state.params,
            limit: finalLimit,
            mandate: finalMandate
          }
        });

        // Sync standalone relations locally if matching
        const rNo = getRelationNumber();
        if (rNo) {
          const storedRels = localStorage.getItem('standalone_relations');
          if (storedRels) {
            const rels = JSON.parse(storedRels);
            if (rels[rNo]) {
              rels[rNo].amtlimit = parseFloat(finalLimit) || 0;
              rels[rNo].signatoryLevel = finalMandate;
              rels[rNo].photoCaptured = true;
              rels[rNo].signatureCaptured = true;
              localStorage.setItem('standalone_relations', JSON.stringify(rels));
            }
          }
        }

        dispatch({ type: 'SUBMIT_PHOTO_SIGNATURE' });
        toast({
          title: `Photo & Signature ${mode === 'update' ? 'updated' : 'submitted'} successfully!`,
        });

        if (isTabletActiveRef.current) {
          try {
            stopTablet();
          } catch (error) {
            // Ignore
          }
          isTabletActiveRef.current = false;
        }

        onNext?.();
      } else {
        toast({
          title: "Submission failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      const uiError = handleSystemError(error, 'PhotoSignature.handleSubmit');
      toast({
        title: uiError.alert,
        description: uiError.action,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAuthValid = !showAuthInputs || (!!inputMandate && !!inputLimit && parseFloat(inputLimit) >= 0);
  const canSubmit = !!state.data.photo && !!state.data.signature && isAuthValid;

  const initializeSigWeb = () => {
    const extendedWindow = window as unknown as ExtendedWindow;
    if (!extendedWindow.sigWebInitialized) {
      listener();
      extendedWindow.sigWebInitialized = true;
    }
  };

  const handleSignClick = async () => {
    try {
      initializeSigWeb();
      startTablet(handleSigCapture);
      isTabletActiveRef.current = true;
    } catch (error) {
      const uiError = handleSystemError(error, 'PhotoSignature.handleSignClick');
      toast({
        title: uiError.alert,
        description: `${uiError.action} Switching to upload mode.`,
        variant: "destructive",
      });
      setSignatureMode('upload');
    }
  };

  return (
    <StepCard>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className={`transition-all duration-300 ${isAsideOpen ? 'md:mr-48' : ''} mr-0`}>
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6">
            {/* Top-Left Relation Details Panel */}
            {(() => {
              const rNo = getRelationNumber();
              if (!rNo) return null;

              const categoryLetter = relationDetails?.signatoryLevel
                ? relationDetails.signatoryLevel.replace('Category ', '').trim()
                : (state.params.limit && state.params.limit.includes('Category') ? state.params.limit.replace('Category ', '').trim() : '');

              return (
                <div className="p-3 space-y-1 text-slate-700 min-w-[200px] text-xs shrink-0 animate-in fade-in duration-200 text-left">
                  <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider flex items-center justify-start gap-1.5 mb-1">
                    <span>Relation Details</span>
                    <span className="font-mono text-[10px] text-slate-500 font-normal normal-case">({rNo})</span>
                  </div>
                  {relationDetails ? (
                    <>
                      <div className="font-bold text-slate-900 text-[13px] leading-tight mt-1">
                        {`${relationDetails.firstName} ${relationDetails.otherName ? relationDetails.otherName + ' ' : ''}${relationDetails.surname}`.trim()}
                      </div>
                      {state.params.mandate && (
                        <div className="text-[11px] text-slate-500 mt-1">
                          Mandate: <span className="font-semibold text-slate-700">{state.params.mandate}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-start gap-2 text-[11px] text-slate-500 mt-1">
                        {categoryLetter && (
                          <span>
                            Category: <span className="font-semibold text-slate-700">{categoryLetter}</span>
                          </span>
                        )}
                        {categoryLetter && relationDetails.amtlimit !== undefined && (
                          <span className="text-slate-300">•</span>
                        )}
                        {relationDetails.amtlimit !== undefined && (
                          <span>
                            Limit: <span className="font-mono font-semibold text-slate-700">{new Intl.NumberFormat('en-US').format(relationDetails.amtlimit)}</span>
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      {state.params.mandate && (
                        <div className="text-[11px] text-slate-500 mt-1">
                          Mandate: <span className="font-semibold text-slate-700">{state.params.mandate}</span>
                        </div>
                      )}
                      {state.params.limit && (
                        <div className="text-[11px] text-slate-500">
                          Limit: <span className="font-mono font-semibold text-slate-700">{state.params.limit}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })()}

            {/* Top-Right Title Details Panel */}
            <div className="flex-1 min-w-0 text-right flex flex-col items-end">
              <h2 className="text-2xl font-bold">
                {mode === 'update' ? 'Update Photo & Signature' : 'Photo & Signature'}
              </h2>
              <p className="text-muted-foreground">
                {mode === 'update'
                  ? 'Update your photo and signature.'
                  : 'Capture or upload your photo and signature.'}
              </p>
              {mode === 'update' && !isAsideOpen && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAsideOpen(true)}
                  className="flex items-center gap-1 h-8 px-3 mt-2"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>Images</span>
                </Button>
              )}
            </div>
          </div>

          {mode === 'update' && isAsideOpen && images && (
            <motion.aside
              initial={{ x: 320 }}
              animate={{ x: 0 }}
              exit={{ x: 320 }}
              transition={{ duration: 0.3 }}
              className="fixed md:top-12 top-[4.5rem] md:right-8 right-0 md:h-[calc(98vh-6rem)] h-[calc(98vh-4.5rem)] md:w-48 w-full bg-background border border-border rounded-lg md:rounded-l-lg shadow-lg p-4 overflow-auto z-50"
            >
              <div className="flex justify-between items-center mb-14 sticky top-3 bg-background pb-2">
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
                <div className="space-y-14">
                  <div>
                    <h4 className="font-semibold mb-1 text-sm uppercase tracking-wide text-muted-foreground">Unapproved</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {images.data.unapproved?.photo && getImageSrc(images.data.unapproved.photo) && (
                        <div className="space-y-1 relative">
                          <span className="text-xs font-medium text-muted-foreground">Photo</span>
                          <div className="relative group">
                            <img
                              src={getImageSrc(images.data.unapproved.photo)!}
                              alt="Unapproved Photo"
                              className="w-full aspect-square object-cover rounded border cursor-pointer"
                              onClick={() => openImageViewer(getImageSrc(images.data.unapproved.photo)!)}
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openImageViewer(getImageSrc(images.data.unapproved.photo)!);
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
                      {images.data.unapproved?.accsign && getImageSrc(images.data.unapproved.accsign) && (
                        <div className="space-y-1 relative">
                          <span className="text-xs font-medium text-muted-foreground">Signature</span>
                          <div className="relative group">
                            <img
                              src={getImageSrc(images.data.unapproved.accsign)!}
                              alt="Unapproved Signature"
                              className="w-full aspect-square object-cover rounded border cursor-pointer"
                              onClick={() => openImageViewer(getImageSrc(images.data.unapproved.accsign)!)}
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openImageViewer(getImageSrc(images.data.unapproved.accsign)!);
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
                      {images.data.approved?.photo && getImageSrc(images.data.approved.photo) && (
                        <div className="space-y-1 relative">
                          <span className="text-xs font-medium text-muted-foreground">Photo</span>
                          <div className="relative group">
                            <img
                              src={getImageSrc(images.data.approved.photo)!}
                              alt="Approved Photo"
                              className="w-full aspect-square object-cover rounded border cursor-pointer"
                              onClick={() => openImageViewer(getImageSrc(images.data.approved.photo)!)}
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openImageViewer(getImageSrc(images.data.approved.photo)!);
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
                      {images.data.approved?.accsign && getImageSrc(images.data.approved.accsign) && (
                        <div className="space-y-1 relative">
                          <span className="text-xs font-medium text-muted-foreground">Signature</span>
                          <div className="relative group">
                            <img
                              src={getImageSrc(images.data.approved.accsign)!}
                              alt="Approved Signature"
                              className="w-full aspect-square object-cover rounded border cursor-pointer"
                              onClick={() => openImageViewer(getImageSrc(images.data.approved.accsign)!)}
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openImageViewer(getImageSrc(images.data.approved.accsign)!);
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
              className="fixed inset-0 bg-black/85 flex flex-col items-center justify-center z-50 p-4 overflow-hidden select-none"
              onClick={() => setViewingImage(null)}
            >
              {/* Zoom Control Panel */}
              <div
                className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white rounded-full px-5 py-2 flex items-center gap-4 border border-slate-700 shadow-xl z-55"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.25))}
                  className="w-8 h-8 rounded-full hover:bg-slate-800 active:bg-slate-700 flex items-center justify-center text-lg font-bold transition-colors text-slate-300 hover:text-white"
                  type="button"
                  title="Zoom Out"
                >
                  -
                </button>
                <span className="text-xs font-mono font-bold w-12 text-center text-slate-300">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  onClick={() => setZoomLevel(prev => Math.min(4.0, prev + 0.25))}
                  className="w-8 h-8 rounded-full hover:bg-slate-800 active:bg-slate-700 flex items-center justify-center text-lg font-bold transition-colors text-slate-300 hover:text-white"
                  type="button"
                  title="Zoom In"
                >
                  +
                </button>
                <div className="w-[1px] h-4 bg-slate-700" />
                <button
                  onClick={() => setZoomLevel(1.0)}
                  className="text-[10px] uppercase font-bold tracking-wider px-3 py-1 hover:bg-slate-800 active:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
                  type="button"
                >
                  Reset
                </button>
              </div>

              <button
                onClick={() => setViewingImage(null)}
                className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300 focus:outline-none z-55 font-bold"
                type="button"
              >
                &times;
              </button>

              <div className="w-full h-full flex items-center justify-center overflow-auto p-8">
                <img
                  src={viewingImage}
                  alt="Specimen view"
                  className="max-h-[80vh] max-w-[85vw] object-contain origin-center transition-transform duration-150 ease-out shadow-2xl rounded-lg"
                  style={{
                    transform: `scale(${zoomLevel})`
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Photo Section */}
            <div className="space-y-2">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Camera className="w-5 h-5 text-primary" />
                Photo
              </h3>

              <motion.div
                key={photoMode}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                className="relative border-2 border-dashed border-border rounded-xl p-8 text-center bg-accent/50 min-h-[300px] flex items-center justify-center"
              >
                <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-background rounded-full p-1 flex shadow-sm">
                  <button
                    onClick={() => setPhotoMode('capture')}
                    className={`px-3 py-1 rounded-full text-[0.65rem] font-medium transition-colors ${photoMode === 'capture' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}
                  >
                    Capture
                  </button>
                  <button
                    onClick={() => setPhotoMode('upload')}
                    className={`px-3 py-1 rounded-full text-[0.65rem] font-medium transition-colors ${photoMode === 'upload' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}
                  >
                    Upload
                  </button>
                </div>
                {state.data.photo ? (
                  <div className="space-y-4 w-full pt-12">
                    <div className="relative group cursor-pointer mx-auto w-32 h-32" onClick={() => openImageViewer(state.data.photo!)}>
                      <img
                        src={state.data.photo}
                        alt="Captured photo"
                        className="w-full h-full object-cover rounded-full border-4 border-primary"
                      />
                      <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Eye className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => openImageViewer(state.data.photo!)}
                        className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-blue-600 transition-colors"
                        type="button"
                        title="View full image"
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setEditingPhoto(true)}
                        className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs hover:bg-primary/80 transition-colors"
                        type="button"
                        title="Edit photo"
                      >
                        <Edit className="w-3 h-3" />
                      </button>
                      <button
                        onClick={handleClearPhoto}
                        className="w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs hover:bg-destructive/80 transition-colors"
                        type="button"
                        title="Clear photo"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-sm text-green-600 font-semibold">✓ Photo captured successfully</p>
                  </div>
                ) : photoMode === 'capture' ? (
                  <div className="space-y-4 pt-12">
                    <Webcam
                      audio={false}
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      videoConstraints={videoConstraints}
                      onUserMediaError={() => {
                        toast({
                          title: "Camera access failed",
                          description: "Please check your permissions and try again. Falling back to upload.",
                          variant: "destructive",
                        });
                        setPhotoMode('upload');
                      }}
                      className="w-full max-w-xs mx-auto rounded-lg border-2 border-border"
                    />
                    <Button
                      onClick={capturePhoto}
                      className="rounded-full gradient-primary"
                      type="button"
                    >
                      Take Photo
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4 pt-12">
                    <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto" />
                    <div>
                      <p className="font-medium">Upload your photo</p>
                      <p className="text-sm text-muted-foreground">JPG, PNG up to 10MB</p>
                      <Button
                        onClick={() => photoInputRef.current?.click()}
                        className="mt-4 rounded-full gradient-primary"
                        type="button"
                      >
                        Choose File
                      </Button>
                      <input
                        ref={photoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
            {/* Signature Section */}
            <div className="space-y-2">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Signature className="w-5 h-5 text-primary" />
                Signature
              </h3>

              <motion.div
                key={signatureMode}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                className="relative border-2 border-dashed border-border rounded-xl p-4 bg-accent/50 min-h-[300px] flex items-center justify-center"
              >
                <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-background rounded-full p-1 flex shadow-sm">
                  <button
                    onClick={() => setSignatureMode('draw')}
                    className={`px-3 py-1 rounded-full text-[0.65rem] font-medium transition-colors ${signatureMode === 'draw' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}
                  >
                    Draw
                  </button>
                  <button
                    onClick={() => setSignatureMode('upload')}
                    className={`px-3 py-1 rounded-full text-[0.65rem] font-medium transition-colors ${signatureMode === 'upload' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}
                  >
                    Upload
                  </button>
                </div>
                {state.data.signature ? (
                  <div className="space-y-4 text-center w-full pt-12">
                    <div className="relative group cursor-pointer mx-auto max-w-[200px]" onClick={() => openImageViewer(state.data.signature!)}>
                      <img
                        src={state.data.signature}
                        alt="Signature"
                        className="max-h-20 mx-auto border border-border rounded"
                      />
                      <div className="absolute inset-0 bg-black/20 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Eye className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => openImageViewer(state.data.signature!)}
                        className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-blue-600 transition-colors"
                        type="button"
                        title="View full image"
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                      {signatureMode === 'upload' && (
                        <button
                          onClick={() => setEditingSignature(true)}
                          className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs hover:bg-primary/80 transition-colors"
                          type="button"
                          title="Edit signature"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        onClick={clearSignature}
                        className="w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs hover:bg-destructive/80 transition-colors"
                        type="button"
                        title="Clear signature"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-sm text-green-600 font-semibold">
                      ✓ Signature {signatureMode === 'draw' ? 'captured' : 'uploaded'} successfully
                    </p>
                    {signatureMode === 'draw' && (
                      <Button
                        onClick={handleDownload}
                        className="rounded-full gradient-primary"
                        type="button"
                      >
                        Download
                      </Button>
                    )}
                  </div>
                ) : signatureMode === 'draw' ? (
                  <div className="space-y-4 w-full pt-12">
                    <form action="#" name="FORM1" onSubmit={(e) => e.preventDefault()}>
                      <canvas
                        ref={canvasRef}
                        id="cnv"
                        width={500}
                        height={210}
                        className="border border-border rounded-lg bg-white w-full"
                      />
                      <div className="flex gap-4 justify-center mt-2">
                        <Button
                          onClick={handleSignClick}
                          className="rounded-full gradient-primary px-8"
                          type="button"
                        >
                          Sign
                        </Button>
                      </div>
                      <div className="hidden">
                        <p>SigString:</p>
                        <textarea
                          name="sigString"
                          rows={4}
                        />
                      </div>
                      <div className="hidden">
                        <p>ImgData:</p>
                        <textarea
                          name="imgData"
                          rows={4}
                          value={state.data.signature || ''}
                          onChange={() => { }}
                        />
                      </div>
                    </form>
                  </div>
                ) : (
                  <div className="space-y-4 text-center w-full pt-12">
                    <Signature className="w-12 h-12 text-muted-foreground mx-auto" />
                    <div>
                      <p className="font-medium">Upload signature image</p>
                      <p className="text-sm text-muted-foreground">PNG, JPG with transparent background preferred</p>
                      <Button
                        onClick={() => signatureInputRef.current?.click()}
                        className="mt-4 rounded-full gradient-primary"
                        type="button"
                      >
                        Choose File
                      </Button>
                      <input
                        ref={signatureInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleSignatureUpload}
                        className="hidden"
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>
        {/* Image Editors */}
        {editingPhoto && state.data.photo && (
          <ImageEditor
            imageUrl={state.data.photo}
            title="Edit Photo"
            onSave={async (editedImageUrl) => {
              dispatch({ type: 'SET_PHOTO', photo: editedImageUrl });
              setIsPhotoChanged(true);

              const result = await captureBrowse(editedImageUrl, 1);
              if (result.success) {
                toast({ title: "Photo edited and saved successfully!" });
              } else {
                toast({ title: "Photo edited but failed to save", description: result.message, variant: "destructive" });
              }

              setEditingPhoto(false);
            }}
            onCancel={() => setEditingPhoto(false)}
          />
        )}
        {editingSignature && state.data.signature && (
          <ImageEditor
            imageUrl={state.data.signature}
            title="Edit Signature"
            onSave={async (editedImageUrl) => {
              dispatch({ type: 'SET_SIGNATURE', signature: editedImageUrl });
              setIsSignatureChanged(true);

              const result = await captureBrowse(editedImageUrl, 2);
              if (result.success) {
                toast({ title: "Signature edited and saved successfully!" });
              } else {
                toast({ title: "Signature edited but failed to save", description: result.message, variant: "destructive" });
              }

              setEditingSignature(false);
            }}
            onCancel={() => setEditingSignature(false)}
          />
        )}

        {/* Signatory Level and Limit Inputs (displayed only if missing from integrated system URL) */}
        {showAuthInputs && (
          <div className="mt-8 p-6 bg-slate-50 border border-slate-100 rounded-2xl space-y-4 text-left animate-in fade-in duration-300">
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
              <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
                <Award className="w-3.5 h-3.5" />
              </div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Signatory Authorization Settings</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Signatory Level (Category) <span className="text-rose-500">*</span></label>
                <select
                  value={inputMandate}
                  onChange={(e) => setInputMandate(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select Category</option>
                  <option value="Category A">Category A</option>
                  <option value="Category B">Category B</option>
                  <option value="Category C">Category C</option>
                  <option value="Category D">Category D</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Authorized Limit <span className="text-rose-500">*</span></label>
                <input
                  type="number"
                  placeholder="Enter authorized limit amount"
                  value={inputLimit}
                  onChange={(e) => setInputLimit(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Navigation and Submit Button */}
        <div className="flex items-center justify-between mt-8">
          <Button
            variant="outline"
            className="rounded-full px-6 py-2"
            disabled={true}
          >
            Back
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className="rounded-full px-8 py-3 -mt-4 gradient-primary shadow-button"
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
            ) : (isPhotoChanged || isSignatureChanged) ? (
              mode === 'update' ? 'Update Photo & Signature' : 'Submit Photo & Signature'
            ) : (
              'Next'
            )}
          </Button>

          <div className="text-sm text-muted-foreground">
            Step 1 of {state.activityConfig ?
              [1, state.activityConfig.identification.status && 2, state.activityConfig.fingerprint.status && 3, 4].filter(Boolean).length
              : 4}
          </div>
        </div>
      </motion.div>
    </StepCard>
  );
}