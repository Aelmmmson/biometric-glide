import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  searchImages, 
  approveCustomerImages, 
  rejectCustomerImages, 
  getApprovalParams,
  SearchImagesResponse 
} from '@/services/api';
import { 
  Camera, 
  FileText, 
  Fingerprint, 
  PenTool, 
  Search, 
  CheckCircle, 
  XCircle, 
  Eye,
  AlertCircle 
} from 'lucide-react';

const Approval = () => {
  const { toast } = useToast();
  const [searchResults, setSearchResults] = useState<SearchImagesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchRelationNo, setSearchRelationNo] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [approvalParams, setApprovalParams] = useState<ReturnType<typeof getApprovalParams>>({});

  useEffect(() => {
    const params = getApprovalParams();
    setApprovalParams(params);
    
    if (params.relationno) {
      setSearchRelationNo(params.relationno);
      handleSearch(params.relationno);
    }
  }, []);

  const handleSearch = async (relationno?: string) => {
    const searchId = relationno || searchRelationNo;
    if (!searchId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a relation number",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await searchImages(searchId);
      setSearchResults(result);
      
      if (result.status === 'success') {
        toast({
          title: "Success",
          description: result.message,
        });
      } else if (result.status === 'not_found') {
        toast({
          title: "No Images Found",
          description: result.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to search images",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!approvalParams.relationno || !approvalParams.batch || !approvalParams.custno || 
        !approvalParams.approved_by || !approvalParams.hostname || !approvalParams.terminal_ip) {
      toast({
        title: "Error",
        description: "Missing approval parameters. Please access via proper approval URL.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await approveCustomerImages(approvalParams as Required<typeof approvalParams>);
      
      if (result.status === 'success') {
        toast({
          title: "Success",
          description: result.message,
        });
        // Refresh search results
        if (approvalParams.relationno) {
          handleSearch(approvalParams.relationno);
        }
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve images",
        variant: "destructive",
      });
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for rejection",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await rejectCustomerImages(searchRelationNo, rejectReason);
      
      if (result.status === 'success') {
        toast({
          title: "Success",
          description: result.message,
        });
        setRejectReason('');
        // Refresh search results
        handleSearch();
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject images",
        variant: "destructive",
      });
    }
  };

  const ImageCard = ({ 
    title, 
    icon: Icon, 
    image, 
    type 
  }: { 
    title: string; 
    icon: any; 
    image?: string; 
    type: 'approved' | 'unapproved';
  }) => (
    <Card className={`${type === 'unapproved' ? 'border-orange-200' : 'border-green-200'}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Icon className="w-4 h-4" />
          {title}
          <Badge 
            variant={type === 'approved' ? 'default' : 'secondary'}
            className={type === 'approved' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}
          >
            {type === 'approved' ? 'Approved' : 'Pending'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {image ? (
          <div className="space-y-2">
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
              <img 
                src={image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`}
                alt={title}
                className="w-full h-full object-cover"
              />
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                  <Eye className="w-3 h-3 mr-1" />
                  View Full Size
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <img 
                  src={image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`}
                  alt={title}
                  className="w-full h-auto"
                />
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
            <span className="text-gray-400 text-sm">No image</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-soft">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Image Approval System
            </h1>
            <p className="text-muted-foreground">
              Review and approve customer biometric data
            </p>
          </motion.div>

          {/* Search Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Search Customer Images
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <Input
                    placeholder="Enter relation number..."
                    value={searchRelationNo}
                    onChange={(e) => setSearchRelationNo(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button 
                    onClick={() => handleSearch()}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Searching...' : 'Search'}
                  </Button>
                </div>
                
                {approvalParams.relationno && (
                  <Alert className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Auto-loaded relation number: <strong>{approvalParams.relationno}</strong>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Results Section */}
          {searchResults && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-8"
            >
              {/* Unapproved Images Section */}
              {searchResults.data?.unapproved && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-orange-700">
                        <AlertCircle className="w-5 h-5" />
                        Pending Approval
                      </CardTitle>
                      <div className="flex gap-2">
                        <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve All
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-50">
                              <XCircle className="w-4 h-4 mr-2" />
                              Reject
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <div className="space-y-4">
                              <h3 className="text-lg font-semibold">Reject Images</h3>
                              <Textarea
                                placeholder="Enter reason for rejection..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                              />
                              <div className="flex gap-2 justify-end">
                                <Button variant="outline">Cancel</Button>
                                <Button onClick={handleReject} variant="destructive">
                                  Confirm Rejection
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <ImageCard 
                        title="Photo" 
                        icon={Camera} 
                        image={searchResults.data.unapproved.photo}
                        type="unapproved"
                      />
                      <ImageCard 
                        title="Signature" 
                        icon={PenTool} 
                        image={searchResults.data.unapproved.signature}
                        type="unapproved"
                      />
                      <ImageCard 
                        title="ID Document" 
                        icon={FileText} 
                        image={searchResults.data.unapproved.id}
                        type="unapproved"
                      />
                      <ImageCard 
                        title="Fingerprint" 
                        icon={Fingerprint} 
                        image={searchResults.data.unapproved.fingerprint}
                        type="unapproved"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Approved Images Section */}
              {searchResults.data?.approved && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-700">
                      <CheckCircle className="w-5 h-5" />
                      Approved Images
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <ImageCard 
                        title="Photo" 
                        icon={Camera} 
                        image={searchResults.data.approved.photo}
                        type="approved"
                      />
                      <ImageCard 
                        title="Signature" 
                        icon={PenTool} 
                        image={searchResults.data.approved.signature}
                        type="approved"
                      />
                      <ImageCard 
                        title="ID Document" 
                        icon={FileText} 
                        image={searchResults.data.approved.id}
                        type="approved"
                      />
                      <ImageCard 
                        title="Fingerprint" 
                        icon={Fingerprint} 
                        image={searchResults.data.approved.fingerprint}
                        type="approved"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* No Images Found */}
              {searchResults.status === 'not_found' && (
                <Card>
                  <CardContent className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No Images Found</h3>
                    <p className="text-gray-500">
                      No biometric data found for relation number: {searchRelationNo}
                    </p>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Approval;