import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RotateCw, Crop, Save, X } from 'lucide-react';
import { Button } from './ui/button';

interface ImageEditorProps {
  imageUrl: string;
  onSave: (editedImageUrl: string) => void;
  onCancel: () => void;
  title?: string;
}

export function ImageEditor({ imageUrl, onSave, onCancel, title = "Edit Image" }: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState(0);
  const [cropMode, setCropMode] = useState(false);
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImage(img);
      drawImage(img, 0);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  const drawImage = (img: HTMLImageElement, angle: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size based on rotation
    const isRotated = Math.abs(angle) % 180 !== 0;
    canvas.width = isRotated ? img.height : img.width;
    canvas.height = isRotated ? img.width : img.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Save context, move to center, rotate, draw image
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((angle * Math.PI) / 180);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    ctx.restore();
  };

  const handleRotate = () => {
    const newRotation = (rotation + 90) % 360;
    setRotation(newRotation);
    if (image) {
      drawImage(image, newRotation);
    }
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (blob) {
        const reader = new FileReader();
        reader.onload = () => {
          onSave(reader.result as string);
        };
        reader.readAsDataURL(blob);
      }
    }, 'image/png');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-background rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-auto"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">{title}</h3>
          <button
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Tools */}
          <div className="flex gap-2 justify-center">
            <Button
              onClick={handleRotate}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <RotateCw className="w-4 h-4" />
              Rotate
            </Button>
            <Button
              onClick={() => setCropMode(!cropMode)}
              variant={cropMode ? "default" : "outline"}
              size="sm"
              className="gap-2"
            >
              <Crop className="w-4 h-4" />
              Crop
            </Button>
          </div>

          {/* Canvas */}
          <div className="flex justify-center bg-muted/50 rounded-lg p-4">
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-96 border border-border rounded"
              style={{ 
                cursor: cropMode ? 'crosshair' : 'default'
              }}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button onClick={onCancel} variant="outline">
              Cancel
            </Button>
            <Button onClick={handleSave} className="gap-2">
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}