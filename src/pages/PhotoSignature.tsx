import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Camera, Upload, Signature, Image as ImageIcon, X } from 'lucide-react';
import { StepCard } from '@/components/StepCard';
import { NavigationButtons } from '@/components/NavigationButtons';
import { Button } from '@/components/ui/button';
import { useBiometric } from '@/contexts/BiometricContext';
import { toast } from '@/hooks/use-toast';

export function PhotoSignature() {
  const { state, dispatch } = useBiometric();
  const [photoMode, setPhotoMode] = useState<'capture' | 'upload'>('capture');
  const [signatureMode, setSignatureMode] = useState<'draw' | 'upload'>('draw');
  const [isDrawing, setIsDrawing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const photoInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handlePhotoCapture = () => {
    // Simulate photo capture - in real app, would use camera API
    const simulatedPhoto = '/lovable-uploads/b8491224-09cc-420e-b88c-5fe8e79e6acd.png';
    dispatch({ type: 'SET_PHOTO', photo: simulatedPhoto });
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        dispatch({ type: 'SET_PHOTO', photo: e.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignatureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        dispatch({ type: 'SET_SIGNATURE', signature: e.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const dataURL = canvas.toDataURL();
      dispatch({ type: 'SET_SIGNATURE', signature: dataURL });
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        dispatch({ type: 'SET_SIGNATURE', signature: null });
      }
    }
  };

  const handleClearPhoto = () => {
    dispatch({ type: 'SET_PHOTO', photo: null });
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    
    setIsSubmitting(true);
    
    // Simulate API submission
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    dispatch({ type: 'SUBMIT_PHOTO_SIGNATURE' });
    toast({ title: "Photo & Signature submitted successfully!" });
    setIsSubmitting(false);
    
    // Move to next step
    dispatch({ type: 'SET_STEP', step: 2 });
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
        <h2 className="text-2xl font-bold mb-1">Photo & Signature</h2>
        <p className="text-muted-foreground mb-6">
          Capture or upload your photo and signature.
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
              className="border-2 border-dashed border-border rounded-xl p-8 text-center bg-accent/50 relative"
            >
              {state.data.photo ? (
                <div className="space-y-4">
                  <button
                    onClick={handleClearPhoto}
                    className="absolute top-2 right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs hover:bg-destructive/80 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
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
              className="border-2 border-dashed border-border rounded-xl p-4 bg-accent/50"
            >
              {signatureMode === 'draw' ? (
                <div className="space-y-4">
                  <canvas
                    ref={canvasRef}
                    width={300}
                    height={150}
                    className="border border-border rounded-lg bg-white cursor-crosshair w-full"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                  />
                  <div className="flex gap-2 justify-center">
                    <Button
                      variant="outline"
                      onClick={clearSignature}
                      className="rounded-full text-xs"
                    >
                      Clear
                    </Button>
                  </div>
                  {state.data.signature && (
                    <p className="text-sm text-green-600 font-semibold text-center">
                      ✓ Signature captured successfully
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4 text-center py-8">
                  <Signature className="w-12 h-12 text-muted-foreground mx-auto" />
                  <div>
                    <p className="font-medium">Upload signature image</p>
                    <p className="text-sm text-muted-foreground">PNG, JPG with transparent background preferred</p>
                    <Button 
                      onClick={() => signatureInputRef.current?.click()}
                      className="mt-4 rounded-full gradient-primary"
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
                  {state.data.signature && (
                    <div className="mt-4 relative">
                      <button
                        onClick={() => dispatch({ type: 'SET_SIGNATURE', signature: null })}
                        className="absolute top-0 right-0 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs hover:bg-destructive/80 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <img 
                        src={state.data.signature} 
                        alt="Uploaded signature" 
                        className="max-h-20 mx-auto border border-border rounded"
                      />
                      <p className="text-sm text-green-600 font-semibold mt-2">
                        ✓ Signature uploaded successfully
                      </p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center mt-8">
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
              'Submit Photo & Signature'
            )}
          </Button>
        </div>

        <NavigationButtons
          currentStep={1}
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