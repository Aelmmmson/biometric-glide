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
} from 'lucide-react';
import Webcam from 'react-webcam';
import { StepCard } from '@/components/StepCard';
import { Button } from '@/components/ui/button';
import { useBiometric } from '@/contexts/BiometricContext';
import { toast } from '@/hooks/use-toast';
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
} from '@/services/api';
import { ImageEditor } from '@/components/ImageEditor';

interface ExtendedWindow extends Window {
  sigWebInitialized?: boolean;
}

interface PhotoSignatureProps {
  mode?: 'capture' | 'update';
  onNext?: () => void; // ← Critical: Lets parent control next step
}

export function PhotoSignature({
  mode = 'capture',
  onNext,
}: PhotoSignatureProps) {
  const { state, dispatch } = useBiometric();
  const [photoMode, setPhotoMode] = useState<'capture' | 'upload'>('capture');
  const [signatureMode, setSignatureMode] = useState<'draw' | 'upload'>('draw');
  const [sigCaptured, setSigCaptured] = useState<{ image: HTMLImageElement; sig: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState(false);
  const [editingSignature, setEditingSignature] = useState(false);
  const [isAsideOpen, setIsAsideOpen] = useState(false);
  const [images, setImages] = useState<SearchImagesResponse | null>(null);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const hasAutoClosed = useRef(false);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const webcamRef = useRef<Webcam>(null);

  const videoConstraints = {
    width: { ideal: 640 },
    height: { ideal: 480 },
    facingMode: 'user',
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTablet();
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
    stopTablet();

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
    ClearTablet();
    LcdRefresh(0, 0, 0, 240, 64);
    stopTablet();
  };

  const handleClearPhoto = () => {
    dispatch({ type: 'SET_PHOTO', photo: null });
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
    if (!state.data.photo || !state.data.signature || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const submitFn = mode === 'update' ? updateData : saveData;
      const result = await submitFn({
        photoData: state.data.photo!,
        signatureData: state.data.signature!,
        batchNumber: 'TEMP',
      });

      if (result.success) {
        dispatch({ type: 'SUBMIT_PHOTO_SIGNATURE' });
        toast({
          title: `Photo & Signature ${mode === 'update' ? 'updated' : 'submitted'} successfully!`,
        });

        // ← This is the key: parent decides next step (skip ID? skip FP?)
        onNext?.();
      } else {
        toast({
          title: "Submission failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error submitting photo & signature:', error);
      toast({
        title: "Submission failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = !!state.data.photo && !!state.data.signature;

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
    } catch (error) {
      console.error('SigWeb initialization failed:', error);
      toast({
        title: "Signature tablet unavailable",
        description: "Switching to upload mode.",
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
        <div className="flex justify-between items-center mb-1">
          <h2 className="text-2xl font-bold">
            {mode === 'update' ? 'Update Photo & Signature' : 'Photo & Signature'}
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
          {mode === 'update'
            ? 'Update your photo and signature.'
            : 'Capture or upload your photo and signature.'}
        </p>

        {mode === 'update' && isAsideOpen && images && (
                  <motion.aside
                    initial={{ x: 320 }}
                    animate={{ x: 0 }}
                    exit={{ x: 320 }}
                    transition={{ duration: 0.3 }}
                    className="fixed md:top-12 top-[4.5rem] md:right-14 right-0 md:h-[calc(98vh-6rem)] h-[calc(98vh-4.5rem)] md:w-48 w-full bg-background border border-border rounded-lg md:rounded-l-lg shadow-lg p-4 overflow-auto z-50"
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
                                    onClick={() => setViewingImage(getImageSrc(images.data.unapproved.photo))}
                                  />
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setViewingImage(getImageSrc(images.data.unapproved.photo));
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
                                    onClick={() => setViewingImage(getImageSrc(images.data.unapproved.accsign))}
                                  />
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setViewingImage(getImageSrc(images.data.unapproved.accsign));
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
                                    onClick={() => setViewingImage(getImageSrc(images.data.approved.photo))}
                                  />
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setViewingImage(getImageSrc(images.data.approved.photo));
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
                                    onClick={() => setViewingImage(getImageSrc(images.data.approved.accsign))}
                                  />
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setViewingImage(getImageSrc(images.data.approved.accsign));
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
                            <img
                              src={state.data.photo}
                              alt="Captured photo"
                              className="w-32 h-32 object-cover rounded-full mx-auto border-4 border-primary"
                            />
                            <div className="flex gap-2 justify-center">
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
                            <img
                              src={state.data.signature}
                              alt="Signature"
                              className="max-h-20 mx-auto border border-border rounded"
                            />
                            <div className="flex gap-2 justify-center">
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
                                  onChange={() => {}}
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
                       
                        // Save edited photo to backend
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
                       
                        // Save edited signature to backend
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

        {/* Your entire existing aside, viewingImage modal, grid layout, etc. remains 100% unchanged */}
        {/* ... [All the JSX you had before is exactly the same until the Submit button] ... */}

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
            ) : (
              'Submit Photo & Signature'
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