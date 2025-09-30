import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, Upload, Signature, Image as ImageIcon, X, Edit } from 'lucide-react';
import { StepCard } from '@/components/StepCard';
import { Button } from '@/components/ui/button';
import { useBiometric } from '@/contexts/BiometricContext';
import { toast } from '@/hooks/use-toast';
import { listener, startTablet, ClearTablet, LcdRefresh, stopTablet } from './SigWebTablet';
import { captureBrowse, saveData, updateData, getRelationNumber, getUpdateRelationNumber } from '@/services/api';
import { ImageEditor } from '@/components/ImageEditor';

interface ExtendedWindow extends Window {
  sigWebInitialized?: boolean;
}

interface PhotoSignatureProps {
  mode?: 'capture' | 'update';
}

export function PhotoSignature({ mode = 'capture' }: PhotoSignatureProps) {
  const { state, dispatch } = useBiometric();
  const [photoMode, setPhotoMode] = useState<'capture' | 'upload'>('capture');
  const [signatureMode, setSignatureMode] = useState<'draw' | 'upload'>('draw');
  const [sigCaptured, setSigCaptured] = useState<{ image: HTMLImageElement; sig: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState(false);
  const [editingSignature, setEditingSignature] = useState(false);
  
  const photoInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const extendedWindow = window as unknown as ExtendedWindow;
    if (!extendedWindow.sigWebInitialized) {
      listener();
      extendedWindow.sigWebInitialized = true;
    }

    return () => {
      stopTablet();
    };
  }, []);

  const handlePhotoCapture = async () => {
    // Simulate photo capture - in real app, would use camera API
    const simulatedPhoto = '/lovable-uploads/b8491224-09cc-420e-b88c-5fe8e79e6acd.png';
    
    // Convert to base64 for immediate save
    try {
      const response = await fetch(simulatedPhoto);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        dispatch({ type: 'SET_PHOTO', photo: base64Data });
        
        // Immediately save to backend
        const result = await captureBrowse(base64Data, 1);
        if (result.success) {
          toast({ title: "Photo captured and saved successfully!" });
        } else {
          toast({ title: "Photo captured but failed to save", description: result.message, variant: "destructive" });
        }
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error('Error capturing photo:', error);
      toast({ title: "Failed to capture photo", variant: "destructive" });
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target?.result as string;
        dispatch({ type: 'SET_PHOTO', photo: base64Data });
        
        // Immediately save to backend
        const result = await captureBrowse(base64Data, 1);
        if (result.success) {
          toast({ title: "Photo uploaded and saved successfully!" });
        } else {
          toast({ title: "Photo uploaded but failed to save", description: result.message, variant: "destructive" });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignatureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target?.result as string;
        dispatch({ type: 'SET_SIGNATURE', signature: base64Data });
        
        // Immediately save to backend
        const result = await captureBrowse(base64Data, 2);
        if (result.success) {
          toast({ title: "Signature uploaded and saved successfully!" });
        } else {
          toast({ title: "Signature uploaded but failed to save", description: result.message, variant: "destructive" });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSigCapture = async (sig: string) => {
    const image = new Image();
    const base64Data = 'data:image/png;base64,' + sig;
    image.src = base64Data;
    setSigCaptured({ image, sig });
    dispatch({ type: 'SET_SIGNATURE', signature: base64Data });
    stopTablet(); // Stop polling after capture to reduce load
    
    // Immediately save to backend
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
    stopTablet(); // Ensure polling is stopped on clear
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
    if (!canSubmit) return;
    
    setIsSubmitting(true);
    
    try {
      // Use updateData for update mode, saveData for capture mode
      const submitFn = mode === 'update' ? updateData : saveData;
      const result = await submitFn({
        photoData: state.data.photo!,
        signatureData: state.data.signature!,
        batchNumber: ''
      });
      
      if (result.success) {
        dispatch({ type: 'SUBMIT_PHOTO_SIGNATURE' });
        toast({ title: `Photo & Signature ${mode === 'update' ? 'updated' : 'submitted'} successfully!` });
        
        // Move to next step
        dispatch({ type: 'SET_STEP', step: 2 });
      } else {
        toast({ 
          title: "Submission failed", 
          description: result.message, 
          variant: "destructive" 
        });
      }
    } catch (error) {
      console.error('Error submitting photo & signature:', error);
      toast({ 
        title: "Submission failed", 
        description: "An unexpected error occurred", 
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    // Disabled for step 1
  };

  const canSubmit = state.data.photo && state.data.signature;

  return (
    <StepCard>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-2xl font-bold mb-1">{mode === 'update' ? 'Update Photo & Signature' : 'Photo & Signature'}</h2>
        <p className="text-muted-foreground mb-6">
          {mode === 'update' ? 'Update your photo and signature.' : 'Capture or upload your photo and signature.'}
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Photo Section */}
          <div className="space-y-2">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary" />
              Photo
            </h3>
            
            <div className="flex items-center gap-4 mb-4">
              <span className="text-sm font-medium">Method:</span>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="photoMode"
                    value="capture"
                    checked={photoMode === 'capture'}
                    onChange={() => setPhotoMode('capture')}
                    className="radio"
                  />
                  <Camera className="w-4 h-4" />
                  <span className="text-sm">Capture</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="photoMode"
                    value="upload"
                    checked={photoMode === 'upload'}
                    onChange={() => setPhotoMode('upload')}
                    className="radio"
                  />
                  <Upload className="w-4 h-4" />
                  <span className="text-sm">Upload</span>
                </label>
              </div>
            </div>

            <motion.div
              key={photoMode}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="border-2 border-dashed border-border rounded-xl p-8 text-center bg-accent/50 relative min-h-[300px] flex items-center justify-center"
            >
              {state.data.photo ? (
                <div className="space-y-4 w-full">
                  <div className="absolute top-2 right-2 flex gap-1">
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
                  <img 
                    src={state.data.photo} 
                    alt="Captured photo" 
                    className="w-32 h-32 object-cover rounded-full mx-auto border-4 border-primary"
                  />
                  <p className="text-sm text-green-600 font-semibold">✓ Photo captured successfully</p>
                </div>
              ) : photoMode === 'capture' ? (
                <div className="space-y-4">
                  <Camera className="w-12 h-12 text-muted-foreground mx-auto" />
                  <div>
                    <p className="font-medium">Ready to capture</p>
                    <p className="text-sm text-muted-foreground">Click to take a photo</p>
                    <Button 
                      onClick={handlePhotoCapture}
                      className="mt-4 rounded-full gradient-primary"
                      type="button"
                    >
                      Take Photo
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
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
            
            <div className="flex items-center gap-4 mb-4">
              <span className="text-sm font-medium">Method:</span>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="signatureMode"
                    value="draw"
                    checked={signatureMode === 'draw'}
                    onChange={() => setSignatureMode('draw')}
                    className="radio"
                  />
                  <Signature className="w-4 h-4" />
                  <span className="text-sm">Draw</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="signatureMode"
                    value="upload"
                    checked={signatureMode === 'upload'}
                    onChange={() => setSignatureMode('upload')}
                    className="radio"
                  />
                  <Upload className="w-4 h-4" />
                  <span className="text-sm">Upload</span>
                </label>
              </div>
            </div>

            <motion.div
              key={signatureMode}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="border-2 border-dashed border-border rounded-xl p-4 bg-accent/50 relative min-h-[300px] flex items-center justify-center"
            >
              {state.data.signature ? (
                <div className="space-y-4 text-center w-full">
                  <div className="absolute top-2 right-2 flex gap-1">
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
                  <img 
                    src={state.data.signature} 
                    alt="Signature" 
                    className="max-h-20 mx-auto border border-border rounded"
                  />
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
                <div className="space-y-4 w-full">
                  <form action="#" name="FORM1" onSubmit={(e) => e.preventDefault()}>
                    <canvas
                      ref={canvasRef}
                      id="cnv"
                      width={500}
                      height={150}
                      className="border border-border rounded-lg bg-white w-full"
                    />
                    <div className="flex gap-4 justify-center mt-2">
                      <Button
                        onClick={() => startTablet(handleSigCapture)}
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
                <div className="space-y-4 text-center w-full">
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

        {/* Navigation and Submit Button */}
        <div className="flex items-center justify-between mt-8">
          {/* Back Button */}
          <Button
            onClick={handleBack}
            variant="outline"
            className="rounded-full px-6 py-2"
            disabled={true}
            type="button"
          >
            Back
          </Button>
          
          {/* Submit Button (Centered) */}
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className="rounded-full px-8 py-3 gradient-primary shadow-button"
            type="button"
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
          
          {/* Step Indicator */}
          <div className="text-sm text-muted-foreground">
            Step 1 of 4
          </div>
        </div>
      </motion.div>
    </StepCard>
  );
}