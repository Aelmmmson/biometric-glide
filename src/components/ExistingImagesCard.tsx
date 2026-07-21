import React from 'react';
import { motion } from 'framer-motion';
import { Image as ImageIcon, X, Eye, Camera, FileSignature, Fingerprint, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchImagesResponse, DocumentData } from '@/services/api';

interface ExistingImagesCardProps {
  images: SearchImagesResponse | null;
  isLoading?: boolean;
  onClose: () => void;
  onViewImage: (src: string) => void;
  className?: string;
}

export function ExistingImagesCard({
  images,
  isLoading = false,
  onClose,
  onViewImage,
  className = '',
}: ExistingImagesCardProps) {
  const getImageSrc = (image?: string) => {
    if (!image || image.trim() === '') return undefined;
    return image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`;
  };

  const unapprovedPhoto = getImageSrc(images?.data?.unapproved?.photo);
  const unapprovedSign = getImageSrc(images?.data?.unapproved?.accsign);
  const unapprovedThumb1 = getImageSrc(images?.data?.unapproved?.thumbprint1);
  const unapprovedThumb2 = getImageSrc(images?.data?.unapproved?.thumbprint2);
  const unapprovedDocs = images?.data?.unapproved?.documents || [];

  const approvedPhoto = getImageSrc(images?.data?.approved?.photo);
  const approvedSign = getImageSrc(images?.data?.approved?.accsign);
  const approvedThumb1 = getImageSrc(images?.data?.approved?.thumbprint1);
  const approvedThumb2 = getImageSrc(images?.data?.approved?.thumbprint2);
  const approvedDocs = images?.data?.approved?.documents || [];

  const extractDocItems = (docs: DocumentData[]) => {
    const items: { label: string; src: string }[] = [];
    docs.forEach((doc) => {
      const typeLabel = (doc.type || 'ID').replace(/_/g, ' ');
      if (doc.sides?.front) {
        const src = getImageSrc(doc.sides.front);
        if (src) items.push({ label: `${typeLabel} Front`, src });
      }
      if (doc.sides?.back) {
        const src = getImageSrc(doc.sides.back);
        if (src) items.push({ label: `${typeLabel} Back`, src });
      }
    });
    return items;
  };

  const unapprovedDocItems = extractDocItems(unapprovedDocs);
  const approvedDocItems = extractDocItems(approvedDocs);

  const renderSlot = (
    label: string,
    imgSrc?: string,
    fallbackIcon: React.ReactNode = <Camera className="w-3.5 h-3.5 opacity-50" />,
    noLabel: string = 'No Image'
  ) => (
    <div className="space-y-1">
      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block truncate">{label}</span>
      {imgSrc ? (
        <div className="relative group overflow-hidden rounded-lg border border-border shadow-xs bg-background">
          <img
            src={imgSrc}
            alt={label}
            className="w-full aspect-square object-contain cursor-pointer transition-transform duration-200 group-hover:scale-105 p-0.5"
            onClick={() => onViewImage(imgSrc)}
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewImage(imgSrc);
            }}
            className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            type="button"
            title={`View ${label}`}
          >
            <Eye className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <div className="w-full aspect-square rounded-lg border border-dashed border-border/80 bg-accent/30 flex flex-col items-center justify-center text-muted-foreground/60 text-[9px] font-semibold gap-0.5 select-none p-1 text-center">
          {fallbackIcon}
          <span className="truncate max-w-full">{noLabel}</span>
        </div>
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`border border-border/80 rounded-xl bg-card p-3.5 space-y-4 shadow-sm text-left ${className}`}
    >
      {/* Header */}
      <div className="flex justify-between items-center pb-2 border-b border-border/60">
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="truncate md:text-[8px]">Existing Images</span>
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-6 w-6 p-0 rounded-full hover:bg-accent shrink-0"
          type="button"
          title="Close Existing Images"
        >
          <X className="w-3.5 h-3.5 text-muted-foreground" />
        </Button>
      </div>

      {isLoading || (!images && images !== null) ? (
        <div className="space-y-4 animate-pulse">
          <div className="space-y-2">
            <div className="h-3 bg-amber-200/60 dark:bg-amber-900/40 rounded w-20 mb-2" />
            <div className="grid grid-cols-2 gap-2">
              <div className="w-full aspect-square bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
              <div className="w-full aspect-square bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
            </div>
          </div>
          <div className="space-y-2 pt-2 border-t border-border/40">
            <div className="h-3 bg-emerald-200/60 dark:bg-emerald-900/40 rounded w-20 mb-2" />
            <div className="grid grid-cols-2 gap-2">
              <div className="w-full aspect-square bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
              <div className="w-full aspect-square bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      ) : images?.status !== 'success' || !images.data ? (
        <div className="text-center py-6">
          <p className="text-muted-foreground text-[11px] italic">No existing images available</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {/* Pending Review Section */}
          <div className="space-y-2">
            <h4 className="font-extrabold text-[10px] md:text-[9px] uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md inline-block">
              Pending Review
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {renderSlot('Photo', unapprovedPhoto, <Camera className="w-3.5 h-3.5 opacity-50" />, 'No Photo')}
              {renderSlot('Signature', unapprovedSign, <FileSignature className="w-3.5 h-3.5 opacity-50" />, 'No Sign')}
              
              {/* Primary & Secondary Fingerprints if present */}
              {unapprovedThumb1 && renderSlot('Finger 1', unapprovedThumb1, <Fingerprint className="w-3.5 h-3.5 opacity-50" />, 'No Finger')}
              {unapprovedThumb2 && renderSlot('Finger 2', unapprovedThumb2, <Fingerprint className="w-3.5 h-3.5 opacity-50" />, 'No Finger')}

              {/* ID Documents if present */}
              {unapprovedDocItems.map((doc, idx) => (
                <React.Fragment key={idx}>
                  {renderSlot(doc.label, doc.src, <FileText className="w-3.5 h-3.5 opacity-50" />, 'No Doc')}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Approved Images Section */}
          <div className="space-y-2 pt-2 border-t border-border/40">
            <h4 className="font-extrabold text-[10px] md:text-[9px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md inline-block">
              Approved Images
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {renderSlot('Photo', approvedPhoto, <Camera className="w-3.5 h-3.5 opacity-50" />, 'No Photo')}
              {renderSlot('Signature', approvedSign, <FileSignature className="w-3.5 h-3.5 opacity-50" />, 'No Sign')}

              {/* Primary & Secondary Fingerprints if present */}
              {approvedThumb1 && renderSlot('Finger 1', approvedThumb1, <Fingerprint className="w-3.5 h-3.5 opacity-50" />, 'No Finger')}
              {approvedThumb2 && renderSlot('Finger 2', approvedThumb2, <Fingerprint className="w-3.5 h-3.5 opacity-50" />, 'No Finger')}

              {/* ID Documents if present */}
              {approvedDocItems.map((doc, idx) => (
                <React.Fragment key={idx}>
                  {renderSlot(doc.label, doc.src, <FileText className="w-3.5 h-3.5 opacity-50" />, 'No Doc')}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

