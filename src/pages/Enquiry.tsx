import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, Image as ImageIcon, FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { enquiryImages, getCustomerId } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import type { EnquiryImagesResponse } from '@/services/api';

const Enquiry = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageData, setImageData] = useState<EnquiryImagesResponse['data']>([]);
  const [selectedImage, setSelectedImage] = useState<{ url: string; title: string } | null>(null);
  
  const customerId = getCustomerId();

  useEffect(() => {
    fetchImages();
  }, [customerId]);

  const fetchImages = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await enquiryImages(customerId);
      
      if (result.status === 'success' && result.data) {
        setImageData(result.data);
        toast({ title: "Images retrieved successfully!" });
      } else if (result.status === 'not_found') {
        setError('No images found for this customer');
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
  };

  const renderImageCard = (imageUrl: string | undefined, title: string, icon: React.ElementType) => {
    const Icon = icon;
    
    if (!imageUrl) {
      return (
        <div className="border-2 border-dashed border-border rounded-xl p-6 text-center bg-muted/30">
          <Icon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No {title.toLowerCase()}</p>
        </div>
      );
    }

    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="border-2 border-border rounded-xl p-4 bg-card cursor-pointer"
        onClick={() => setSelectedImage({ url: imageUrl, title })}
      >
        <div className="flex items-center gap-2 mb-3">
          <Icon className="w-5 h-5 text-primary" />
          <h4 className="font-semibold text-sm">{title}</h4>
        </div>
        <div className="bg-muted rounded-lg p-2 flex items-center justify-center min-h-[120px]">
          <img 
            src={imageUrl} 
            alt={title}
            className="max-h-28 max-w-full object-contain rounded"
          />
        </div>
        <p className="text-xs text-center text-muted-foreground mt-2">Click to view full size</p>
      </motion.div>
    );
  };

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
          <h1 className="text-3xl font-bold mb-2">Customer Image Enquiry</h1>
          <div className="flex items-center justify-center gap-2">
            <p className="text-muted-foreground">Customer ID:</p>
            <Badge variant="secondary" className="text-base">{customerId}</Badge>
          </div>
        </motion.div>

        {/* Records */}
        <div className="max-w-6xl mx-auto space-y-8">
          {!imageData || imageData.length === 0 ? (
            <Card className="p-12 text-center">
              <ImageIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Images Found</h3>
              <p className="text-muted-foreground">
                No biometric data is available for this customer.
              </p>
            </Card>
          ) : (
            imageData.map((record, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">
                      {imageData.length > 1 ? `Record ${index + 1}` : 'Biometric Data'}
                    </h2>
                    <Badge>View Only</Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {renderImageCard(record.photo, 'Photo', ImageIcon)}
                    {renderImageCard(record.accsign, 'Signature', FileText)}
                    {renderImageCard(record.id_front, 'ID Front', FileText)}
                    {renderImageCard(record.id_back, 'ID Back', FileText)}
                    {renderImageCard(record.fingerprint, 'Fingerprint', ImageIcon)}
                  </div>
                </Card>
              </motion.div>
            ))
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
      </div>
    </div>
  );
};

export default Enquiry;
