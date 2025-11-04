import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, Image as ImageIcon, FileText, ArrowUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { enquiryImages, viewRelationDetailsFromAccount } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import type { EnquiryImagesResponse, DocumentData } from '@/services/api';

interface EnquiryProps {
  id: string;
  fetchType?: 'relation' | 'account';
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
        // Account-specific error handling
        if (result.status === 'error' && result.message?.toLowerCase().includes('decrypt') || result.message?.toLowerCase().includes('invalid credential')) {
          setError('Invalid or expired account credential');
          toast({ 
            title: "Access Denied", 
            description: "The provided account credential could not be resolved.",
            variant: "destructive" 
          });
          setLoading(false);
          return;
        }
      } else {
        result = await enquiryImages(id);
      }
      
      if (result.status === 'success' && result.data) {
        setImageData(result.data);
        toast({ title: "Images retrieved successfully!" });
      } else if (result.status === 'not_found') {
        setError(`No images found for this ${fetchType === 'account' ? 'account' : 'relation'}`);
        toast({ 
          title: "No images found", 
          description: result.message,
          variant: "destructive" 
        });
      } else {
        setError(result.message || 'Failed to retrieve images');
        toast({ 
          title: "Error", 
          description: result.message,
          variant: "destructive" 
        });
      }
    } catch (err) {
      console.error('Error fetching images:', err);
      setError('An unexpected error occurred');
      toast({ 
        title: "Error", 
        description: "Failed to retrieve images",
        variant: "destructive" 
      });
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

  const getImageUrl = (imageData: string | undefined): string | undefined => {
    if (!imageData) return undefined;
    // Assume base64 without prefix; add data URL prefix for display
    return `data:image/png;base64,${imageData}`;
  };

  const renderImageCard = (imageData: string | undefined, title: string, icon: React.ElementType) => {
    const Icon = icon;
    const imageUrl = getImageUrl(imageData);
    
    if (!imageUrl) {
      return (
        <div className="border-2 border-dashed border-border rounded-xl p-2 text-center bg-muted/30 aspect-square flex flex-col items-center justify-center">
          <Icon className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">No {title.toLowerCase()}</p>
        </div>
      );
    }

    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="border-2 border-border rounded-xl p-2 bg-card cursor-pointer aspect-square flex flex-col"
        onClick={() => setSelectedImage({ url: imageUrl, title })}
      >
        <div className="flex items-center gap-1 mb-1">
          <Icon className="w-3 h-3 text-primary" />
          <h4 className="font-semibold text-xs">{title}</h4>
        </div>
        <div className="bg-muted rounded flex-1 flex items-center justify-center">
          <img 
            src={imageUrl} 
            alt={title}
            className="max-h-full max-w-full object-contain rounded"
          />
        </div>
        <p className="text-xs text-center text-muted-foreground mt-1">Click to view full size</p>
      </motion.div>
    );
  };

  const numRelations = imageData?.enq_details?.length || 0;
  const defaultValues = numRelations === 1 ? ['item-0'] : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading customer images...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Error Loading Images</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={fetchImages} className="rounded-full gradient-primary">
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-soft">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold mb-2">Customer Account Biometric</h1>
          {/* <div className="flex items-center justify-center gap-2 mb-2">
            <p className="text-muted-foreground">{fetchType === 'account' ? 'Account Credential:' : 'Customer ID:'}</p>
            <Badge variant="secondary" className="text-base">{id}</Badge>
          </div> */}
          {/* {imageData && (
            <div className="flex items-center justify-center gap-2">
              <p className="text-muted-foreground">Account Mandate:</p>
              <Badge variant="outline" className="text-base">{imageData.account_mandate}</Badge>
            </div>
          )} */}
        </motion.div>

        {/* Records */}
        <div className="max-w-6xl mx-auto space-y-8">
          {!imageData || !imageData.enq_details || imageData.enq_details.length === 0 ? (
            <Card className="p-12 text-center">
              <ImageIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Images Found</h3>
              <p className="text-muted-foreground">
                No biometric data is available for this customer.
              </p>
            </Card>
          ) : (
            <Accordion type="multiple" defaultValue={defaultValues} className="w-full">
              {imageData.enq_details.map((detail, index) => (
                <AccordionItem key={detail.relation_no} value={`item-${index}`}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center justify-between w-full">
                      <h2 className="text-xl font-bold">Relation No: {detail.relation_no}</h2>
                      <Badge className="ml-4">View Only</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4">
                    <Card className="p-4">
                      {/* Biometrics */}
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-4">Biometrics</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                          {renderImageCard(detail.pix, 'Photo', ImageIcon)}
                          {renderImageCard(detail.signature, 'Signature', FileText)}
                          {renderImageCard(detail.fingerprint_one, 'Right Thumbprint', ImageIcon)}
                          {renderImageCard(detail.fingerprint_two, 'Left Thumbprint', ImageIcon)}
                        </div>
                      </div>

                      {/* Documents */}
                      {detail.docs && detail.docs.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Documents</h3>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            {detail.docs.flatMap((doc: DocumentData) => [
                              doc.sides.front && { img: doc.sides.front, title: `${doc.type.replace(/_/g, ' ')} Front` },
                              doc.sides.back && { img: doc.sides.back, title: `${doc.type.replace(/_/g, ' ')} Back` },
                            ].filter(Boolean)).map((item, docIndex) => (
                              <div key={docIndex} className="space-y-2">
                                <h4 className="font-semibold text-xs capitalize text-center">
                                  {item.title}
                                </h4>
                                {renderImageCard(item.img, item.title, FileText)}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </Card>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>

        {/* Full Image Modal */}
        {selectedImage && (
          <div 
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">{selectedImage.title}</h3>
                <Button
                  variant="outline"
                  onClick={() => setSelectedImage(null)}
                  className="rounded-full"
                >
                  Close
                </Button>
              </div>
              <div className="bg-muted rounded-lg p-4 flex items-center justify-center">
                <img 
                  src={selectedImage.url} 
                  alt={selectedImage.title}
                  className="max-w-full max-h-[70vh] object-contain rounded"
                />
              </div>
            </motion.div>
          </div>
        )}

        {/* Back to Top Button */}
        {showBackToTop && (
          <Button
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 rounded-full w-12 h-12 shadow-lg z-40"
            variant="outline"
          >
            <ArrowUp className="w-5 h-5" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default Enquiry;