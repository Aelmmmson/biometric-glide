import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  AlertCircle,
  Image as ImageIcon,
  FileText,
  ArrowUp,
  Landmark,
  ShieldCheck,
  UserCheck,
  Download,
  ZoomIn,
  Fingerprint
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { enquiryImages, viewRelationDetailsFromAccount, getImagesByAccount } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import { handleSystemError } from '@/lib/errorHandler';
import type { EnquiryImagesResponse, DocumentData } from '@/services/api';

interface EnquiryProps {
  id: string;
  fetchType?: 'relation' | 'account' | 'getimages';
}

const Enquiry = ({ id, fetchType = 'relation' }: EnquiryProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageData, setImageData] = useState<EnquiryImagesResponse['data']>(null);
  const [selectedImage, setSelectedImage] = useState<{ url: string; title: string } | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const fetchImages = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let result: EnquiryImagesResponse;

      if (fetchType === 'account') {
        result = await viewRelationDetailsFromAccount(id);
        if (result.status === 'error' && (result.message?.toLowerCase().includes('decrypt') || result.message?.toLowerCase().includes('invalid credential'))) {
          setError('Invalid or expired account credential');
          toast({
            title: "Access Denied",
            description: "The provided account credential could not be resolved.",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }
      } else if (fetchType === 'getimages') {
        result = await getImagesByAccount(id);
      } else {
        result = await enquiryImages(id);
      }

      if (result.status === 'success' && result.data) {
        setImageData(result.data);
        const details = result.data.enq_details || [];
        const hasImages = details.some(d => 
          !!d.pix || 
          !!d.signature || 
          !!d.fingerprint_one || 
          !!d.fingerprint_two || 
          (d.docs && d.docs.length > 0)
        );
        toast({
          title: hasImages ? "Biometric profiles loaded" : "No Biometrics Captured",
          description: hasImages
            ? "Signatory profiles and biometrics retrieved successfully."
            : "Signatory details retrieved, but no biometrics images (photo, signature, voter ID, fingerprints) are captured for this account yet."
        });
      } else if (result.status === 'not_found') {
        setError(`No biometric profile found for this ${fetchType === 'account' ? 'account' : fetchType === 'getimages' ? 'account' : 'relation'}`);
      } else {
        setError(result.message || 'Failed to retrieve images');
      }
    } catch (err) {
      const uiError = handleSystemError(err, 'Enquiry.fetchImages');
      setError(`${uiError.alert} ${uiError.action}`);
    } finally {
      setLoading(false);
    }
  }, [id, fetchType]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getImageUrl = (imageDataStr: string | undefined): string | undefined => {
    if (!imageDataStr) return undefined;
    return `data:image/jpeg;base64,${imageDataStr}`;
  };

  const getInitialsColor = (name: string) => {
    const colors = [
      'bg-blue-50 text-blue-600 border-blue-100/80',
      'bg-emerald-50 text-emerald-600 border-emerald-100/80',
      'bg-indigo-50 text-indigo-600 border-indigo-100/80',
      'bg-violet-50 text-violet-600 border-violet-100/80',
      'bg-amber-50 text-amber-600 border-amber-100/80',
      'bg-rose-50 text-rose-600 border-rose-100/80',
    ];
    let sum = 0;
    for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
    return colors[sum % colors.length];
  };

  const renderBiometricCard = (imageDataStr: string | undefined, title: string, icon: React.ElementType) => {
    const Icon = icon;
    const imageUrl = getImageUrl(imageDataStr);

    if (!imageUrl) return null;

    return (
      <motion.div
        whileHover={{ y: -4, scale: 1.01 }}
        className="group relative bg-white border border-slate-100 rounded-2xl p-3 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] transition-all cursor-pointer flex flex-col justify-between overflow-hidden"
        onClick={() => setSelectedImage({ url: imageUrl, title })}
      >
        <div className="absolute inset-0 bg-slate-950/2 tracking-normal opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10 flex items-center justify-center backdrop-blur-[1px]">
          <div className="w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center text-slate-800 scale-90 group-hover:scale-100 transition-transform duration-300">
            <ZoomIn className="w-4 h-4" />
          </div>
        </div>

        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-50 shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
              <Icon className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{title}</span>
          </div>
          <span className="text-[8px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded-full uppercase">View</span>
        </div>

        <div className="bg-slate-50/50 rounded-xl h-40 flex items-center justify-center overflow-hidden p-2 border border-slate-100/20">
          <img
            src={imageUrl}
            alt={title}
            className="max-h-full max-w-full object-contain rounded-md"
          />
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] relative overflow-hidden select-none antialiased">
      {/* Decorative Glow Blobs */}
      <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-gradient-to-tr from-blue-500/5 to-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-violet-500/5 to-fuchsia-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header Block */}
        <motion.div
          initial={{ opacity: 0, y: -25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="max-w-6xl mx-auto mb-8"
        >
          <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.04)] flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100/50 text-[10px] font-bold tracking-wider uppercase leading-none">
                {/* <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /> */}
                Account Enquiry Console
              </div>

              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-none">
                  {fetchType === 'account' ? 'Account Enquiry' : 'Account Profile'}
                </h1>
                {imageData?.account_name && (
                  <p className="text-base font-bold text-slate-700 mt-2 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-500" />
                    Account Description: {imageData.account_name}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl flex flex-col">
                <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider mb-0.5">
                  {fetchType === 'account' ? 'Account Number' : 'Relation ID'}
                </span>
                <span className="text-sm font-extrabold text-slate-800 font-mono">{id}</span>
              </div>

              {fetchType !== 'account' && imageData && imageData.account_mandate && imageData.account_mandate.trim() !== '' && (
                <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider mb-0.5">Signing Mandate</span>
                  <span className="text-xs font-extrabold text-slate-700 uppercase">{imageData.account_mandate}</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Content Records */}
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="min-h-[40vh] flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
              <p className="text-sm text-slate-500 font-semibold">Retrieving biometric profiles...</p>
            </div>
          ) : error ? (
            <Card className="p-8 text-center max-w-md mx-auto rounded-3xl border-slate-200/80 shadow-md">
              <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-900 mb-1">Enquiry Error</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-5">{error}</p>
              <Button onClick={fetchImages} className="rounded-full bg-blue-600 hover:bg-blue-700 text-xs font-bold px-6 py-2.5 shadow-sm text-white">
                Retry Connection
              </Button>
            </Card>
          ) : !imageData || !imageData.enq_details || imageData.enq_details.length === 0 ? (
            <Card className="p-12 text-center rounded-3xl border-slate-200/80 shadow-md bg-white">
              <ImageIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-1">No Biometric Records Found</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                Biometric and identification data has not been captured for this customer setup yet.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-8">
              {imageData.enq_details.map((detail, index) => {
                const name = detail.relation_name || `Signatory #${index + 1}`;
                const firstInitial = detail.relation_name ? detail.relation_name.charAt(0).toUpperCase() : '';
                const parts = detail.relation_name?.trim().split(/\s+/) || [];
                const lastInitial = parts.length > 1 ? parts[parts.length - 1].charAt(0).toUpperCase() : '';
                const initials = `${firstInitial}${lastInitial}` || '??';
                const avatarColor = getInitialsColor(name);

                const hasBiometrics =
                  detail.pix?.trim() ||
                  detail.signature?.trim() ||
                  detail.fingerprint_one?.trim() ||
                  detail.fingerprint_two?.trim();

                const hasDocs = detail.docs && detail.docs.length > 0;

                return (
                  <motion.div
                    key={detail.relation_no}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_12px_30px_-10px_rgba(0,0,0,0.03)] overflow-hidden"
                  >
                    {/* Signatory Profile Header Bar */}
                    <div className="p-5 md:p-6 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className={`w-11 h-11 rounded-full border flex items-center justify-center font-bold text-sm shrink-0 shadow-sm ${avatarColor}`}>
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-extrabold text-slate-900 text-base truncate">{name}</h3>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5 flex items-center gap-2">
                            <span>Relation No: {detail.relation_no}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1"><UserCheck className="w-3 h-3 text-blue-500" /> Authorized Signatory</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {detail.sign_category && (
                          <Badge variant="secondary" className="text-[10px] uppercase font-extrabold tracking-wider bg-white text-slate-700 border border-slate-200">
                            Signatory Level: {detail.sign_category}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-[10px] font-extrabold bg-blue-50/30 text-blue-600 border-blue-200/60">
                          Limit: {detail.limit !== undefined && detail.limit > 0 ? `${new Intl.NumberFormat('en-US').format(detail.limit)}` : 'No Limit'}
                        </Badge>
                      </div>
                    </div>

                    {/* Specimens Content Panels */}
                    <div className="p-6 space-y-6">
                      {/* Biometrics Specimens Row */}
                      {hasBiometrics ? (
                        <div className="space-y-3.5">
                          <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-400 flex items-center gap-1.5">
                            <Fingerprint className="w-4 h-4 text-blue-500" /> Biometric Data
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                            {detail.pix?.trim() && renderBiometricCard(detail.pix, 'Portrait Photo', ImageIcon)}
                            {detail.signature?.trim() && renderBiometricCard(detail.signature, 'Signature Photo', FileText)}
                            {detail.fingerprint_one?.trim() && renderBiometricCard(detail.fingerprint_one, 'Right Thumbprint', Fingerprint)}
                            {detail.fingerprint_two?.trim() && renderBiometricCard(detail.fingerprint_two, 'Left Thumbprint', Fingerprint)}
                          </div>
                        </div>
                      ) : (
                        <div className="p-6 border border-dashed rounded-2xl bg-slate-50/50 text-center text-slate-400 text-xs">
                          No biometric templates captured for this signatory.
                        </div>
                      )}

                      {/* Documents Row */}
                      {hasDocs && (
                        <div className="pt-4 border-t border-slate-100 space-y-3.5">
                          <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-400 flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-indigo-500" /> Scanned Identification Documents
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                            {detail.docs.flatMap((doc: DocumentData) => [
                              doc.sides.front && { img: doc.sides.front, title: `${doc.type.replace(/_/g, ' ')} Front` },
                              doc.sides.back && { img: doc.sides.back, title: `${doc.type.replace(/_/g, ' ')} Back` },
                            ].filter(Boolean)).map((item, docIndex) => (
                              <div key={docIndex}>
                                {renderBiometricCard(item.img, item.title, FileText)}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Back to Top */}
        {showBackToTop && (
          <Button
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 rounded-full w-11 h-11 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 shadow-lg z-40 transition-all flex items-center justify-center"
            size="icon"
          >
            <ArrowUp className="w-4.5 h-4.5" />
          </Button>
        )}

        {/* Image Zoom Modal */}
        <AnimatePresence>
          {selectedImage && (
            <div
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
              onClick={() => setSelectedImage(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 10 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="bg-white rounded-3xl p-6 max-w-3xl w-full shadow-2xl flex flex-col max-h-[90vh] border border-slate-100"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-4 shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                    <h3 className="text-base font-extrabold text-slate-800">{selectedImage.title}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={selectedImage.url}
                      download={`${selectedImage.title.replace(/\s+/g, '_')}.jpg`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs text-slate-600 font-bold transition-all"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </a>
                    <button
                      onClick={() => setSelectedImage(null)}
                      className="text-slate-400 hover:text-slate-600 transition-colors text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-slate-100 border border-transparent"
                    >
                      Close
                    </button>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 flex-1 flex items-center justify-center overflow-hidden border border-slate-100/50">
                  <img
                    src={selectedImage.url}
                    alt={selectedImage.title}
                    className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-sm"
                  />
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Enquiry;