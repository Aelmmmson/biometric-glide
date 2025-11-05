import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { RotateCw, Crop, Save, X, Check, X as XIcon } from 'lucide-react';
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
  const [cropBox, setCropBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<'new' | 'handle' | 'move' | null>(null);
  const [dragHandle, setDragHandle] = useState<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [currentCursor, setCurrentCursor] = useState<'crosshair' | 'pointer' | 'grabbing' | 'grab' | 'default'>('default');

  const drawCanvas = useCallback((img: HTMLImageElement, angle: number, box?: { x: number; y: number; width: number; height: number } | null) => {
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
    // Draw crop box if provided
    if (box) {
      ctx.strokeStyle = '#3b82f6'; // Blue
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(box.x, box.y, box.width, box.height);
      ctx.setLineDash([]); // Reset dash
      // Draw handles
      const handleSize = 8;
      ctx.fillStyle = '#3b82f6';
      const handles = [
        { x: box.x, y: box.y },
        { x: box.x + box.width, y: box.y },
        { x: box.x, y: box.y + box.height },
        { x: box.x + box.width, y: box.y + box.height },
      ];
      handles.forEach(h => {
        ctx.beginPath();
        ctx.arc(h.x, h.y, handleSize / 2, 0, 2 * Math.PI);
        ctx.fill();
      });
    }
  }, [canvasRef]);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImage(img);
      setCropBox(null); // Reset crop on new image
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Auto-redraw when relevant state changes
  useEffect(() => {
    if (!image) return;
    const box = cropMode && cropBox ? cropBox : null;
    drawCanvas(image, rotation, box);
  }, [image, rotation, cropMode, cropBox, drawCanvas]);

  const getHandlePosition = (handle: typeof dragHandle, box: typeof cropBox) => {
    if (!box || !handle) return { x: 0, y: 0 };
    switch (handle) {
      case 'top-left': return { x: box.x, y: box.y };
      case 'top-right': return { x: box.x + box.width, y: box.y };
      case 'bottom-left': return { x: box.x, y: box.y + box.height };
      case 'bottom-right': return { x: box.x + box.width, y: box.y + box.height };
      default: return { x: 0, y: 0 };
    }
  };

  const isOverHandle = (x: number, y: number, box: typeof cropBox, handleSize = 8) => {
    if (!box) return null;
    const handles = [
      { name: 'top-left' as const, hx: box.x, hy: box.y },
      { name: 'top-right' as const, hx: box.x + box.width, hy: box.y },
      { name: 'bottom-left' as const, hx: box.x, hy: box.y + box.height },
      { name: 'bottom-right' as const, hx: box.x + box.width, hy: box.y + box.height },
    ];
    for (const h of handles) {
      if (x >= h.hx - handleSize / 2 && x <= h.hx + handleSize / 2 &&
          y >= h.hy - handleSize / 2 && y <= h.hy + handleSize / 2) {
        return h.name;
      }
    }
    return null;
  };

  const isInsideBox = (x: number, y: number, box: typeof cropBox) => {
    if (!box) return false;
    return x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height;
  };

  const applyCrop = (cropRect: { x: number; y: number; width: number; height: number }) => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // Create temporary canvas for the cropped area
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = cropRect.width;
    tempCanvas.height = cropRect.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;
    // Draw the cropped portion from the current canvas (which includes rotation)
    tempCtx.drawImage(canvas, cropRect.x, cropRect.y, cropRect.width, cropRect.height, 0, 0, cropRect.width, cropRect.height);
    // Convert to data URL and load as new image
    const dataUrl = tempCanvas.toDataURL('image/png');
    const newImg = new Image();
    newImg.crossOrigin = 'anonymous';
    newImg.onload = () => {
      setImage(newImg);
      setRotation(0); // Reset rotation as crop bakes in the current view
      setCropBox(null);
    };
    newImg.src = dataUrl;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!cropMode) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const handle = isOverHandle(x, y, cropBox);
    if (handle) {
      // Start dragging handle
      setDragType('handle');
      setDragHandle(handle);
      const pos = getHandlePosition(handle, cropBox);
      setDragOffset({ x: x - pos.x, y: y - pos.y });
      setIsDragging(true);
    } else if (cropBox && isInsideBox(x, y, cropBox)) {
      // Start moving the box
      setDragType('move');
      setDragOffset({ x: x - cropBox.x, y: y - cropBox.y });
      setIsDragging(true);
    } else {
      // Start new crop
      setCropBox(null);
      setDragType('new');
      setDragStart({ x, y });
      setIsDragging(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!cropMode || !image) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    // Update cursor based on position
    if (cropBox) {
      const handle = isOverHandle(x, y, cropBox);
      if (handle) {
        setCurrentCursor('pointer');
      } else if (isInsideBox(x, y, cropBox)) {
        setCurrentCursor('grab');
      } else {
        setCurrentCursor('crosshair');
      }
    } else {
      setCurrentCursor('crosshair');
    }
    if (isDragging) {
      setCurrentCursor('grabbing');
      if (dragType === 'new') {
        // Creating new box
        const start = dragStart;
        const newBox = {
          x: Math.min(start.x, x),
          y: Math.min(start.y, y),
          width: Math.abs(x - start.x),
          height: Math.abs(y - start.y),
        };
        setCropBox(newBox);
        drawCanvas(image, rotation, newBox);
      } else if (dragType === 'move' && cropBox) {
        // Moving the box
        const newBox = {
          x: Math.max(0, x - dragOffset.x),
          y: Math.max(0, y - dragOffset.y),
          width: cropBox.width,
          height: cropBox.height,
        };
        // Clamp to canvas bounds
        newBox.x = Math.min(newBox.x, canvasRef.current!.width - newBox.width);
        newBox.y = Math.min(newBox.y, canvasRef.current!.height - newBox.height);
        setCropBox(newBox);
        drawCanvas(image, rotation, newBox);
      } else if (dragType === 'handle' && dragHandle && cropBox) {
        // Resizing with handle
        const newBox = { ...cropBox };
        const minSize = 10;
        switch (dragHandle) {
          case 'top-left':
            newBox.x = Math.max(0, x - dragOffset.x);
            newBox.y = Math.max(0, y - dragOffset.y);
            newBox.width = Math.max(minSize, cropBox.x + cropBox.width - newBox.x);
            newBox.height = Math.max(minSize, cropBox.y + cropBox.height - newBox.y);
            break;
          case 'top-right':
            newBox.y = Math.max(0, y - dragOffset.y);
            newBox.width = Math.max(minSize, x - dragOffset.x - newBox.x);
            newBox.height = Math.max(minSize, cropBox.y + cropBox.height - newBox.y);
            break;
          case 'bottom-left':
            newBox.x = Math.max(0, x - dragOffset.x);
            newBox.width = Math.max(minSize, cropBox.x + cropBox.width - newBox.x);
            newBox.height = Math.max(minSize, y - dragOffset.y - newBox.y);
            break;
          case 'bottom-right':
            newBox.width = Math.max(minSize, x - dragOffset.x - newBox.x);
            newBox.height = Math.max(minSize, y - dragOffset.y - newBox.y);
            break;
        }
        // Ensure box doesn't go negative or exceed canvas
        const canvasWidth = canvasRef.current!.width;
        const canvasHeight = canvasRef.current!.height;
        newBox.x = Math.max(0, Math.min(newBox.x, canvasWidth - minSize));
        newBox.y = Math.max(0, Math.min(newBox.y, canvasHeight - minSize));
        newBox.width = Math.min(newBox.width, canvasWidth - newBox.x);
        newBox.height = Math.min(newBox.height, canvasHeight - newBox.y);
        setCropBox(newBox);
        drawCanvas(image, rotation, newBox);
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    setDragType(null);
    setDragHandle(null);
    // Reset cursor after drag
    // Cursor will be updated on next move
  };

  const handleRotate = () => {
    // Exit crop mode to avoid coordinate issues
    if (cropMode) {
      setCropMode(false);
      setCropBox(null);
    }
    const newRotation = (rotation + 90) % 360;
    setRotation(newRotation);
    // Draw immediately with new rotation (useEffect will also trigger)
    if (image) {
      drawCanvas(image, newRotation, null);
    }
  };

  const handleToggleCrop = () => {
    if (cropMode) {
      // Exit without applying
      setCropMode(false);
      setCropBox(null);
      drawCanvas(image || new Image(), rotation, null); // Fallback if no image
    } else {
      setCropMode(true);
      setCropBox(null); // Start fresh
      setCurrentCursor('crosshair');
    }
  };

  const handleApplyCrop = () => {
    if (!cropBox || cropBox.width < 10 || cropBox.height < 10) {
      setCropMode(false);
      setCropBox(null);
      return;
    }
    applyCrop(cropBox);
    setCropMode(false);
  };

  const handleCancelCrop = () => {
    setCropMode(false);
    setCropBox(null);
    if (image) {
      drawCanvas(image, rotation, null);
    }
    setCurrentCursor('default');
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
              onClick={handleToggleCrop}
              variant={cropMode ? "default" : "outline"}
              size="sm"
              className="gap-2"
            >
              <Crop className="w-4 h-4" />
              Crop
            </Button>
          </div>
          {/* Crop Controls - only show in crop mode */}
          {cropMode && (
            <div className="flex gap-2 justify-center">
              <Button
                onClick={handleCancelCrop}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <XIcon className="w-4 h-4" />
                Cancel Crop
              </Button>
              <Button
                onClick={handleApplyCrop}
                size="sm"
                className="gap-2"
              >
                <Check className="w-4 h-4" />
                Apply Crop
              </Button>
            </div>
          )}
          {/* Canvas */}
          <div className="flex justify-center bg-muted/50 rounded-lg p-4">
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-96 border border-border rounded"
              style={{
                cursor: cropMode ? currentCursor : 'default'
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp} // Stop dragging if mouse leaves canvas
            />
          </div>
          {/* General Actions */}
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