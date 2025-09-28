import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
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

// Define ApprovalParams interface to include imageTypes
interface ApprovalParams extends ReturnType<typeof getApprovalParams> {
  imageTypes?: string[];
}

// Define the required type for approveCustomerImages
interface RequiredApprovalParams {
  relationno: string;
  batch: string;
  custno: string;
  approved_by: string;
  hostname: string;
  terminal_ip: string;
  imageTypes?: string[];
}

// Step image config type
type StepImageConfig = {
  key: string;
  title: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const Approval = () => {
  const { toast } = useToast();
  const [searchResults, setSearchResults] = useState<SearchImagesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchRelationNo, setSearchRelationNo] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [approvalParams, setApprovalParams] = useState<ReturnType<typeof getApprovalParams>>({});
  const dialogCloseRef = useRef<HTMLButtonElement>(null); // Ref to programmatically close dialog

  // Memoize handleSearch to prevent unnecessary re-creations
  const handleSearch = useCallback(async (relationno?: string) => {
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
  }, [searchRelationNo, toast]);

  useEffect(() => {
    const params = getApprovalParams();
    setApprovalParams(params);

    if (params.relationno) {
      setSearchRelationNo(params.relationno);
      handleSearch(params.relationno);
    }
  }, [handleSearch]);

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

    if (!searchResults?.data?.unapproved) return;

    const imageTypes = Object.keys(searchResults.data.unapproved);

    if (imageTypes.length === 0) return;

    try {
      const result = await approveCustomerImages({
        relationno: approvalParams.relationno,
        batch: approvalParams.batch,
        custno: approvalParams.custno,
        approved_by: approvalParams.approved_by,
        hostname: approvalParams.hostname,
        terminal_ip: approvalParams.terminal_ip,
        imageTypes,
      } as RequiredApprovalParams);

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

    if (!searchResults?.data?.unapproved) return;

    const imageTypes = Object.keys(searchResults.data.unapproved);

    if (imageTypes.length === 0) return;

    try {
      const result = await rejectCustomerImages(searchRelationNo, rejectReason, imageTypes);

      if (result.status === 'success') {
        toast({
          title: "Success",
          description: "Images have been rejected",
        });
        setRejectReason('');
        // Programmatically close the dialog
        dialogCloseRef.current?.click();
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
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
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
                <VisuallyHidden>
                  <DialogTitle>Full Size {title}</DialogTitle>
                </VisuallyHidden>
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

  // Get all image configs
  const getAllImageConfigs = (data: NonNullable<SearchImagesResponse['data']>): StepImageConfig[] => {
    const hasFrontBack = 'id_front' in data.unapproved || 'id_back' in data.unapproved ||
                         'id_front' in data.approved || 'id_back' in data.approved;

    const configs: StepImageConfig[] = [
      { key: 'photo', title: 'Photo', icon: Camera },
      { key: 'accsign', title: 'Signature', icon: PenTool },
    ];

    if (hasFrontBack) {
      configs.push(
        { key: 'id_front', title: 'ID Document (Front)', icon: FileText },
        { key: 'id_back', title: 'ID Document (Back)', icon: FileText }
      );
    } else {
      configs.push(
        { key: 'id', title: 'ID Document', icon: FileText }
      );
    }

    configs.push(
      { key: 'fingerprint', title: 'Fingerprint', icon: Fingerprint }
    );

    return configs;
  };

  // Render unapproved images only
  const renderUnapprovedImages = () => {
    if (!searchResults?.data) return null;

    const allConfigs = getAllImageConfigs(searchResults.data);
    const unapprovedConfigs = allConfigs.filter(config => !!searchResults.data.unapproved[config.key]);

    if (unapprovedConfigs.length === 0) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {unapprovedConfigs.map((config) => (
          <ImageCard
            key={config.key}
            title={config.title}
            icon={config.icon}
            image={searchResults.data.unapproved[config.key]}
            type="unapproved"
          />
        ))}
      </div>
    );
  };

  // Render approved images for the approved section
  const renderApprovedImages = () => {
    if (!searchResults?.data?.approved) return null;

    const { approved } = searchResults.data;
    const hasIdFrontBack = 'id_front' in approved || 'id_back' in approved;

    const gridCols = hasIdFrontBack ? 'lg:grid-cols-5' : 'lg:grid-cols-4'; // Adjust if front/back

    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 ${gridCols} gap-4`}>
        <ImageCard
          title="Photo"
          icon={Camera}
          image={approved.photo}
          type="approved"
        />
        <ImageCard
          title="Signature"
          icon={PenTool}
          image={approved.accsign}
          type="approved"
        />
        {hasIdFrontBack ? (
          <>
            <ImageCard
              title="ID Document (Front)"
              icon={FileText}
              image={approved.id_front}
              type="approved"
            />
            <ImageCard
              title="ID Document (Back)"
              icon={FileText}
              image={approved.id_back}
              type="approved"
            />
          </>
        ) : (
          <ImageCard
            title="ID Document"
            icon={FileText}
            image={approved.id}
            type="approved"
          />
        )}
        <ImageCard
          title="Fingerprint"
          icon={Fingerprint}
          image={approved.fingerprint}
          type="approved"
        />
      </div>
    );
  };

  // Determine action buttons
  const renderActionButtons = () => {
    if (!searchResults?.data) return null;

    const hasUnapproved = Object.keys(searchResults.data.unapproved).length > 0;

    if (!hasUnapproved) return null;

    return (
      <div className="flex gap-2">
        <Button
          onClick={handleApprove}
          className="bg-green-600 hover:bg-green-700"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Approve
        </Button>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-50">
              <XCircle className="w-4 h-4 mr-2" />
              Reject
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>Reject Unapproved Images</DialogTitle>
            <div className="space-y-4">
              <Textarea
                placeholder="Enter reason for rejection..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline">Cancel</Button>
                <DialogClose asChild>
                  <Button ref={dialogCloseRef} style={{ display: 'none' }} />
                </DialogClose>
                <Button onClick={handleReject} variant="destructive">
                  Confirm Rejection
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  };

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
              {searchResults.data && (
                <>
                  {Object.keys(searchResults.data.unapproved).length === 0 ? (
                    <Card>
                      <CardContent className="text-center py-8">
                        <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-green-600 mb-2">All Steps Completed</h3>
                        <p className="text-gray-500">
                          All biometric data has been reviewed.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2 text-orange-700">
                            <AlertCircle className="w-5 h-5" />
                            Review Unapproved Images
                          </CardTitle>
                          {renderActionButtons()}
                        </div>
                      </CardHeader>
                      <CardContent>
                        {renderUnapprovedImages()}
                      </CardContent>
                    </Card>
                  )}
                </>
              )}

              {/* Approved Images Section (all approved) */}
              {searchResults.data?.approved && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-700">
                      <CheckCircle className="w-5 h-5" />
                      All Approved Images
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {renderApprovedImages()}
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