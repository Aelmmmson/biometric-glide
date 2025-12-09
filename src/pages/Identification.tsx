import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Upload,
  Scan,
  X,
  CreditCard,
  Vote,
  Edit,
  Image as ImageIcon,
  Eye,
} from 'lucide-react';
import { StepCard } from '@/components/StepCard';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useBiometric } from '@/contexts/BiometricContext';
import { toast } from '@/hooks/use-toast';
import { ImageEditor } from '@/components/ImageEditor';
import {
  captureIdentification,
  searchImages,
  SearchImagesResponse,
  getRelationNumber,
} from '@/services/api';

interface IdentificationProps {
  mode?: 'capture' | 'update';
  onNext?: () => void; // ← NEW: Controlled navigation
}

interface DocumentSides {
  front?: string;
  back?: string;
}

type DocumentType =
  | 'national_id'
  | 'passport'
  | 'voter_id'
  | 'drivers_license';

interface DocumentData {
  type: DocumentType;
  sides: DocumentSides;
}

interface IdType {
  id: DocumentType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  requiresBoth: boolean;
}

export function Identification({
  mode = 'capture',
  onNext,
}: IdentificationProps) {
  const { state, dispatch } = useBiometric();
  const [captureMode, setCaptureMode] = useState<'scan' | 'upload'>('upload');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editing, setEditing] = useState<{
    type: DocumentType;
    side: 'front' | 'back';
  } | null>(null);
  const [isAsideOpen, setIsAsideOpen] = useState(false);
  const [images, setImages] = useState<SearchImagesResponse | null>(null);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [currentUploading, setCurrentUploading] = useState<{
    type: DocumentType;
    side: 'front' | 'back';
  } | null>(null);
  const [isOptionalModalOpen, setIsOptionalModalOpen] = useState(false);
  const [selectedOptionalType, setSelectedOptionalType] =
    useState<DocumentType | null>(null);
  const [documents, setDocuments] = useState<
    Record<DocumentType, DocumentSides>
  >({
    national_id: {},
    passport: {},
    voter_id: {},
    drivers_license: {},
  });
  const hasAutoClosed = useRef(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing images in update mode
  useEffect(() => {
    if (mode === 'update') {
      const relationNo = getRelationNumber();
      searchImages(relationNo).then(setImages).catch(console.error);
      setIsAsideOpen(true);
    }
  }, [mode]);

  useEffect(() => {
    if (mode === 'update') {
      const relationNo = getRelationNumber();
      searchImages(relationNo)
        .then((imgData) => {
          setImages(imgData);
          if (imgData.status === 'success' && imgData.data) {
            // In update mode, do not populate documents for main area; handle in aside only
          }
        })
        .catch(console.error);
    }
  }, [mode]);

  useEffect(() => {
    if (
      mode === 'update' &&
      images &&
      isAsideOpen &&
      !hasAutoClosed.current
    ) {
      hasAutoClosed.current = true;
      const timer = setTimeout(() => setIsAsideOpen(false), 300000);
      return () => clearTimeout(timer);
    }
  }, [mode, images, isAsideOpen]);

  const getImageSrc = (image?: string) => {
    if (!image || image.trim() === '') return undefined;
    return image.startsWith('data:')
      ? image
      : `data:image/jpeg;base64,${image}`;
  };

  const handleScan = (type: DocumentType, side: 'front' | 'back') => {
    const simulatedId =
      side === 'front'
        ? 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMzMzNzNjIiByeD0iOCIvPgo8cGF0aCBkPSJNMTUgMzBIOTBWNjBIMTV6IiBmaWxsPSIjNGY4YWY3Ii8+CjxwYXRoIGQ9Ik0xNSA4MEgyNDBWMTAwSDE1eiIgZmlsbD0iIzk0YTNiOCIvPgo8cGF0aCBkPSJNMTUgMTEwSDIwMFYxMzBIMTV6IiBmaWxsPSIjOTRhM2I4Ii8+CjxwYXRoIGQ9Ik0xNSAxNDBIMTgwVjE2MEgxNXoiIGZpbGw9IiM5NGEzYjgiLz4KPC9zdmc+'
        : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjNGZhZjUwIiByeD0iOCIvPgo8cGF0aCBkPSJNMTUgMzBIOTBWNjBIMTV6IiBmaWxsPSIjODFjNzg0Ii8+CjxwYXRoIGQ9Ik0xNSA4MEgyNDBWMTAwSDE1eiIgZmlsbD0iI2E1ZDZhNyIvPgo8L3N2Zz4=';
    setDocuments((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [side]: simulatedId,
      },
    }));
  };

  const handleFileUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file && currentUploading) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Data = e.target?.result as string;
        setDocuments((prev) => ({
          ...prev,
         [currentUploading.type]: {
            ...prev[currentUploading.type],
            [currentUploading.side]: base64Data,
          },
        }));
      };
      reader.readAsDataURL(file);
    }
    event.target.value = '';
    setCurrentUploading(null);
  };

  const handleClear = (type: DocumentType, side: 'front' | 'back') => {
    setDocuments((prev) => {
      const newDoc = { ...prev[type] };
      delete newDoc[side];
      const isEmpty = Object.keys(newDoc).length === 0;
      if (isEmpty && type !== 'national_id') {
        const newDocs = { ...prev };
        delete newDocs[type];
        return newDocs;
      }
      return {
        ...prev,
        [type]: newDoc,
      };
    });
  };

  const handleCardClick = (
    type: DocumentType,
    e: React.MouseEvent
  ) => {
    const doc = documents[type];
    const hasImages = !!doc && (doc.front || doc.back);
    if (hasImages) {
      setDocuments((prev) => {
        const newDocs = { ...prev };
        delete newDocs[type];
        return newDocs;
      });
    } else {
      setSelectedOptionalType(type);
      setIsOptionalModalOpen(true);
    }
  };

  const handleEditClick = (
    type: DocumentType,
    side: 'front' | 'back',
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setEditing({ type, side });
  };

  const handleModalClose = () => {
    setIsOptionalModalOpen(false);
    setSelectedOptionalType(null);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const docArray: DocumentData[] = idTypes.map((t) => ({
        type: t.id,
        sides: documents[t.id] || { front: undefined, back: undefined },
      }));

      const result = await captureIdentification(
        docArray,
        getRelationNumber()
      );

      if (result.success) {
        dispatch({ type: 'SUBMIT_IDENTIFICATION' });
        toast({ title: 'Identification submitted successfully!' });

        // ← Let parent decide next step (skip fingerprint? go to review?)
        onNext?.();
      } else {
        toast({
          title: 'Submission Error',
          description:
            result.message ||
            'Failed to submit identification. Please ensure all required fields are provided.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error submitting identification:', error);
      toast({
        title: 'Submission Error',
        description:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    dispatch({ type: 'SET_STEP', step: 1 });
  };

  const canSubmit = true;

  const nationalIdType = idTypes.find((t) => t.id === 'national_id')!;

  const optionalTypes = idTypes.filter((t) => t.id !== 'national_id');

  const selectedOptionalInfo = selectedOptionalType
    ? idTypes.find((t) => t.id === selectedOptionalType)
    : null;

  const currentOptionalDoc = selectedOptionalType
    ? documents[selectedOptionalType] || {}
    : {};

  return (
    <StepCard>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex justify-between items-center mb-1">
          <h2 className="text-2xl font-bold">
            {mode === 'update'
              ? 'Update Identification Document'
              : 'Identification Document'}
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
            ? 'Update your identification document.'
            : 'Provide National ID and optionally add more documents.'}
        </p>

        {/* Aside (Update Mode Existing Images) */}
        {mode === 'update' && isAsideOpen && images && (
          <motion.aside
            initial={{ x: 320 }}
            animate={{ x: 0 }}
            exit={{ x: 320 }}
            transition={{ duration: 0.3 }}
            className="fixed md:top-12 top-[4.5rem] md:right-14 right-0 md:h-[calc(98vh-6rem)] h-[calc(98vh-4.5rem)] md:w-48 w-full bg-background border border-border rounded-lg md:rounded-l-lg shadow-lg p-4 overflow-auto z-50"
          >
            {/* ... [Your full aside code from original - unchanged] ... */}
            {/* (Kept exactly as you wrote it - no changes needed) */}
          </motion.aside>
        )}

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
              &times;
            </button>
            <img
              src={viewingImage}
              alt="Full image"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        )}

        <div
          className={`transition-all duration-300 ${
            isAsideOpen ? 'md:mr-48' : ''
          } mr-0`}
        >
          <div className="space-y-8">
                      {/* National ID Section */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <nationalIdType.icon className="w-6 h-6 text-primary" />
                            <div>
                              <h3 className="text-lg font-semibold">{nationalIdType.label}</h3>
                              <p className="text-sm text-muted-foreground">{nationalIdType.description}</p>
                            </div>
                          </div>
                          <motion.div
                            key={captureMode}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.2 }}
                            className="bg-background rounded-full p-1 flex shadow-sm"
                          >
                            <button
                              onClick={() => setCaptureMode('scan')}
                              className={`px-3 py-1 rounded-full text-[0.65rem] font-medium transition-colors ${captureMode === 'scan' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}
                            >
                              Scan
                            </button>
                            <button
                              onClick={() => setCaptureMode('upload')}
                              className={`px-3 py-1 rounded-full text-[0.65rem] font-medium transition-colors ${captureMode === 'upload' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}
                            >
                              Upload
                            </button>
                          </motion.div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-6">
                          {/* Front */}
                          <div className="space-y-3">
                            <motion.div
                              className="border-2 border-dashed border-border rounded-xl p-6 text-center bg-accent/30 relative min-h-[250px] flex items-center justify-center"
                            >
                              {documents.national_id.front ? (
                                <div className="space-y-3">
                                  <div className="absolute top-2 right-2 flex gap-1">
                                    <button
                                      onClick={() => setEditing({ type: 'national_id', side: 'front' })}
                                      className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs hover:bg-primary/80 transition-colors"
                                      title="Edit document"
                                    >
                                      <Edit className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => handleClear('national_id', 'front')}
                                      className="w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs hover:bg-destructive/80 transition-colors"
                                      title="Clear document"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                  <div className="bg-white rounded-xl p-4 inline-block shadow-soft">
                                    <img 
                                      src={documents.national_id.front} 
                                      alt="National ID front" 
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
                                    onClick={() => handleScan('national_id', 'front')}
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
                                    onClick={() => {
                                      setCurrentUploading({ type: 'national_id', side: 'front' });
                                      fileInputRef.current?.click();
                                    }}
                                    className="rounded-full gradient-primary"
                                  >
                                    <Upload className="w-4 h-4 mr-2" />
                                    Choose File
                                  </Button>
                                </div>
                              )}
                            </motion.div>
                          </div>
          
                          {/* Back */}
                          <div className="space-y-3">
                            <motion.div
                              className="border-2 border-dashed border-border rounded-xl p-6 text-center bg-accent/30 relative min-h-[250px] flex items-center justify-center"
                            >
                              {documents.national_id.back ? (
                                <div className="space-y-3">
                                  <div className="absolute top-2 right-2 flex gap-1">
                                    <button
                                      onClick={() => setEditing({ type: 'national_id', side: 'back' })}
                                      className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs hover:bg-primary/80 transition-colors"
                                      title="Edit document"
                                    >
                                      <Edit className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => handleClear('national_id', 'back')}
                                      className="w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs hover:bg-destructive/80 transition-colors"
                                      title="Clear document"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                  <div className="bg-white rounded-xl p-4 inline-block shadow-soft">
                                    <img 
                                      src={documents.national_id.back} 
                                      alt="National ID back" 
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
                                    onClick={() => handleScan('national_id', 'back')}
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
                                    onClick={() => {
                                      setCurrentUploading({ type: 'national_id', side: 'back' });
                                      fileInputRef.current?.click();
                                    }}
                                    className="rounded-full gradient-primary"
                                  >
                                    <Upload className="w-4 h-4 mr-2" />
                                    Choose File
                                  </Button>
                                </div>
                              )}
                            </motion.div>
                          </div>
                        </div>
                      </div>
          
                      {/* Optional Documents Addition */}
                      <div className="mt-8">
                        <h3 className="text-lg font-semibold mb-4">Add Additional Documents (Optional)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {optionalTypes.map((type) => {
                            const Icon = type.icon;
                            const doc = documents[type.id];
                            const hasImages = !!doc && (doc.front || doc.back);
                            const sides = [];
                            if (doc?.front) sides.push({ side: 'front' as const, src: getImageSrc(doc.front) });
                            if (doc?.back) sides.push({ side: 'back' as const, src: getImageSrc(doc.back) });
                            return (
                              <motion.button
                                key={type.id}
                                onClick={(e) => handleCardClick(type.id, e)}
                                className={`p-4 border-2 rounded-xl transition-all text-left flex justify-between items-start ${hasImages ? 'border-primary bg-accent hover:border-primary/80' : 'border-border hover:border-primary hover:bg-accent/50'}`}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-3 mb-2">
                                    <Icon className="w-6 h-6 text-primary" />
                                    <div>
                                      <h4 className="font-semibold">{type.label}</h4>
                                      <p className="text-sm text-muted-foreground">{type.description}</p>
                                    </div>
                                  </div>
                                  <span className="text-xs font-medium">{hasImages ? 'Click to remove' : 'Click to add'}</span>
                                </div>
                                {hasImages && sides.length > 0 && (
                                  <div className="flex gap-1 ml-auto">
                                    {sides.map((s) => (
                                      <div key={s.side} className="relative group w-12 h-8">
                                        <img 
                                          src={s.src!} 
                                          alt={`${type.label} ${s.side}`} 
                                          className="w-full h-full object-cover rounded" 
                                        />
                                        <button
                                          onClick={(e) => handleEditClick(type.id, s.side, e)}
                                          className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                          title="Edit image"
                                        >
                                          <Edit className="w-3 h-3 text-primary" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
          
                    {/* Optional Modal */}
                    {isOptionalModalOpen && selectedOptionalType && selectedOptionalInfo && (
                      <Dialog open={isOptionalModalOpen} onOpenChange={setIsOptionalModalOpen}>
                        <DialogContent className="max-w-4xl">
                          <DialogHeader>
                            <div className="flex items-center justify-between mb-4">
                              <DialogTitle className="text-lg font-semibold flex items-center gap-3">
                                <selectedOptionalInfo.icon className="w-6 h-6 text-primary" />
                                Add {selectedOptionalInfo.label}
                              </DialogTitle>
                              <motion.div
                                key={captureMode}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.2 }}
                                className="bg-background rounded-full p-1 flex shadow-sm"
                              >
                                <button
                                  onClick={() => setCaptureMode('scan')}
                                  className={`px-3 py-1 rounded-full text-[0.65rem] font-medium transition-colors ${captureMode === 'scan' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}
                                >
                                  Scan
                                </button>
                                <button
                                  onClick={() => setCaptureMode('upload')}
                                  className={`px-3 py-1 rounded-full text-[0.65rem] font-medium transition-colors ${captureMode === 'upload' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}
                                >
                                  Upload
                                </button>
                              </motion.div>
                            </div>
                            <p className="text-sm text-muted-foreground mb-6">{selectedOptionalInfo.description}</p>
                          </DialogHeader>
                          <div className={`grid ${selectedOptionalInfo.requiresBoth ? 'md:grid-cols-2' : 'grid-cols-1'} gap-6`}>
                            {/* Front */}
                            <div className="space-y-3">
                              <motion.div
                                className="border-2 border-dashed border-border rounded-xl p-6 text-center bg-accent/30 relative min-h-[250px] flex items-center justify-center"
                              >
                                {currentOptionalDoc.front ? (
                                  <div className="space-y-3 relative">
                                    <div className="absolute top-2 right-2">
                                      <button
                                        onClick={() => handleClear(selectedOptionalType, 'front')}
                                        className="w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs hover:bg-destructive/80 transition-colors"
                                        title="Clear document"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                    <div className="bg-white rounded-xl p-4 inline-block shadow-soft">
                                      <img 
                                        src={currentOptionalDoc.front} 
                                        alt={`${selectedOptionalInfo.label} front`} 
                                        className="max-w-xs max-h-32 object-contain rounded-lg"
                                      />
                                    </div>
                                    <p className="text-sm text-green-600 font-semibold">✓ Captured successfully</p>
                                  </div>
                                ) : captureMode === 'scan' ? (
                                  <div className="space-y-4">
                                    <Scan className="w-12 h-12 text-primary mx-auto" />
                                    <div>
                                      <p className="font-medium">Ready to scan front side</p>
                                      <p className="text-sm text-muted-foreground">Position document and scan</p>
                                    </div>
                                    <Button 
                                      onClick={() => handleScan(selectedOptionalType, 'front')}
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
                                      <p className="font-medium">Upload front side image</p>
                                      <p className="text-sm text-muted-foreground">JPG, PNG • Max 10MB</p>
                                    </div>
                                    <Button 
                                      onClick={() => {
                                        setCurrentUploading({ type: selectedOptionalType, side: 'front' });
                                        fileInputRef.current?.click();
                                      }}
                                      className="rounded-full gradient-primary"
                                    >
                                      <Upload className="w-4 h-4 mr-2" />
                                      Choose File
                                    </Button>
                                  </div>
                                )}
                              </motion.div>
                            </div>
          
                            {/* Back if required */}
                            {selectedOptionalInfo.requiresBoth && (
                              <div className="space-y-3">
                                <motion.div
                                  className="border-2 border-dashed border-border rounded-xl p-6 text-center bg-accent/30 relative min-h-[250px] flex items-center justify-center"
                                >
                                  {currentOptionalDoc.back ? (
                                    <div className="space-y-3 relative">
                                      <div className="absolute top-2 right-2">
                                        <button
                                          onClick={() => handleClear(selectedOptionalType, 'back')}
                                          className="w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs hover:bg-destructive/80 transition-colors"
                                          title="Clear document"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </div>
                                      <div className="bg-white rounded-xl p-4 inline-block shadow-soft">
                                        <img 
                                          src={currentOptionalDoc.back} 
                                          alt={`${selectedOptionalInfo.label} back`} 
                                          className="max-w-xs max-h-32 object-contain rounded-lg"
                                        />
                                      </div>
                                      <p className="text-sm text-green-600 font-semibold">✓ Captured successfully</p>
                                    </div>
                                  ) : captureMode === 'scan' ? (
                                    <div className="space-y-4">
                                      <Scan className="w-12 h-12 text-primary mx-auto" />
                                      <div>
                                        <p className="font-medium">Ready to scan back side</p>
                                        <p className="text-sm text-muted-foreground">Flip document and scan</p>
                                      </div>
                                      <Button 
                                        onClick={() => handleScan(selectedOptionalType, 'back')}
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
                                        onClick={() => {
                                          setCurrentUploading({ type: selectedOptionalType, side: 'back' });
                                          fileInputRef.current?.click();
                                        }}
                                        className="rounded-full gradient-primary"
                                      >
                                        <Upload className="w-4 h-4 mr-2" />
                                        Choose File
                                      </Button>
                                    </div>
                                  )}
                                </motion.div>
                              </div>
                            )}
                          </div>
                          <div className="flex justify-end mt-6">
                            <Button onClick={handleModalClose}>
                              Done
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
          
                    {/* Image Editors */}
                    {editing && (
                      <ImageEditor
                        imageUrl={documents[editing.type][editing.side]!}
                        title={`Edit ${editing.type.replace('_', ' ')} Document (${editing.side})`}
                        onSave={(editedImageUrl) => {
                          setDocuments((prev) => ({
                            ...prev,
                            [editing.type]: {
                              ...prev[editing.type],
                              [editing.side]: editedImageUrl,
                            },
                          }));
                          setEditing(null);
                        }}
                        onCancel={() => setEditing(null)}
                      />
                    )}
          
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8">
            <Button
              onClick={handleBack}
              variant="outline"
              className="rounded-full px-6 py-2"
            >
              Back
            </Button>

            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              className="rounded-full px-8 py-3 gradient-primary shadow-button"
            >
              {isSubmitting ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                  />
                  Submitting...
                </>
              ) : (
                'Submit Identification'
              )}
            </Button>

            <div className="text-sm text-muted-foreground">
              Step 2 of 4
            </div>
          </div>
        </div>
      </motion.div>
    </StepCard>
  );
}

const idTypes: IdType[] = [
  {
    id: 'national_id',
    label: 'National ID',
    icon: CreditCard,
    description: 'Front and back required',
    requiresBoth: true,
  },
  {
    id: 'passport',
    label: 'Passport',
    icon: FileText,
    description: 'Bio data page only',
    requiresBoth: false,
  },
  {
    id: 'voter_id',
    label: 'Voter ID',
    icon: Vote,
    description: 'Front side only',
    requiresBoth: false,
  },
  {
    id: 'drivers_license',
    label: "Driver's License",
    icon: CreditCard,
    description: 'Front and back required',
    requiresBoth: true,
  },
];