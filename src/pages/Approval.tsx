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
  SearchImagesResponse,
  DocumentData
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

    const unapproved = searchResults.data.unapproved;
    const nonDocTypes = ['photo', 'accsign', 'thumbprint1', 'thumbprint2'].filter(
      key => unapproved[key] && unapproved[key].trim() !== ''
    );
    const docTypes = unapproved.documents?.map((d: DocumentData) => d.type) ?? [];
    const imageTypes = [...nonDocTypes, ...docTypes];

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

    const unapproved = searchResults.data.unapproved;
    const nonDocTypes = ['photo', 'accsign', 'thumbprint1', 'thumbprint2'].filter(
      key => unapproved[key] && unapproved[key].trim() !== ''
    );
    const docTypes = unapproved.documents?.map((d: DocumentData) => d.type) ?? [];
    const imageTypes = [...nonDocTypes, ...docTypes];

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
        {image && image.trim() !== '' ? (
          <div className="space-y-2">
            <div className="aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`}
                alt={title}
                className="w-full h-full object-contain"
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
          <div className="aspect-[4/3] bg-gray-100 rounded-lg flex items-center justify-center">
            <span className="text-gray-400 text-sm">No image available</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Get all image configs for non-document images
  const getAllImageConfigs = (data: NonNullable<SearchImagesResponse['data']>): StepImageConfig[] => {
    const configs: StepImageConfig[] = [
      { key: 'photo', title: 'Photo', icon: Camera },
      { key: 'accsign', title: 'Signature', icon: PenTool },
      { key: 'thumbprint1', title: 'Right Thumbprint', icon: Fingerprint },
      { key: 'thumbprint2', title: 'Left Thumbprint', icon: Fingerprint }
    ];

    return configs;
  };

  // Render non-document unapproved images
  const renderNonDocUnapprovedImages = () => {
    if (!searchResults?.data) return null;

    const allConfigs = getAllImageConfigs(searchResults.data);
    const unapprovedConfigs = allConfigs.filter(config => 
      searchResults.data.unapproved[config.key] && 
      searchResults.data.unapproved[config.key].trim() !== ''
    );

    if (unapprovedConfigs.length === 0) return null;

    const gridCols = 'lg:grid-cols-4';

    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 ${gridCols} gap-4 mb-6`}>
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

  // Render document unapproved images
  const renderDocUnapprovedImages = () => {
    if (!searchResults?.data?.unapproved?.documents || searchResults.data.unapproved.documents.length === 0) return null;

    return (
      <div className="space-y-4">
        {searchResults.data.unapproved.documents.map((doc: DocumentData) => {
          const hasFront = !!doc.sides.front && doc.sides.front.trim() !== '';
          const hasBack = !!doc.sides.back && doc.sides.back.trim() !== '';
          if (!hasFront && !hasBack) return null;

          return (
            <Card key={doc.type} className="border-orange-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <FileText className="w-4 h-4" />
                  {doc.type.replace('_', ' ').toUpperCase()}
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                    Pending
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`grid ${hasBack ? 'md:grid-cols-2' : 'grid-cols-1'} gap-4`}>
                  {hasFront && (
                    <ImageCard
                      title={`${doc.type.replace('_', ' ')} (Front)`}
                      icon={FileText}
                      image={doc.sides.front}
                      type="unapproved"
                    />
                  )}
                  {hasBack && (
                    <ImageCard
                      title={`${doc.type.replace('_', ' ')} (Back)`}
                      icon={FileText}
                      image={doc.sides.back}
                      type="unapproved"
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  // Render unapproved images only
  const renderUnapprovedImages = () => {
    const nonDoc = renderNonDocUnapprovedImages();
    const docs = renderDocUnapprovedImages();

    if (!nonDoc && !docs) return null;

    return (
      <>
        {nonDoc}
        {docs}
      </>
    );
  };

  // Render non-document approved images
  const renderNonDocApprovedImages = () => {
    if (!searchResults?.data?.approved) return null;

    const { approved } = searchResults.data;
    const configsToRender = getAllImageConfigs(searchResults.data).filter(config => 
      approved[config.key] && approved[config.key].trim() !== ''
    );

    if (configsToRender.length === 0) return null;

    const gridCols = 'lg:grid-cols-4';

    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 ${gridCols} gap-4 mb-6`}>
        {configsToRender.map(config => (
          <ImageCard
            key={config.key}
            title={config.title}
            icon={config.icon}
            image={approved[config.key]}
            type="approved"
          />
        ))}
      </div>
    );
  };

  // Render document approved images
  const renderDocApprovedImages = () => {
    if (!searchResults?.data?.approved?.documents || searchResults.data.approved.documents.length === 0) return null;

    return (
      <div className="space-y-4">
        {searchResults.data.approved.documents.map((doc: DocumentData) => {
          const hasFront = !!doc.sides.front && doc.sides.front.trim() !== '';
          const hasBack = !!doc.sides.back && doc.sides.back.trim() !== '';
          if (!hasFront && !hasBack) return null;

          return (
            <Card key={doc.type} className="border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <FileText className="w-4 h-4" />
                  {doc.type.replace('_', ' ').toUpperCase()}
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    Approved
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`grid ${hasBack ? 'md:grid-cols-2' : 'grid-cols-1'} gap-4`}>
                  {hasFront && (
                    <ImageCard
                      title={`${doc.type.replace('_', ' ')} (Front)`}
                      icon={FileText}
                      image={doc.sides.front}
                      type="approved"
                    />
                  )}
                  {hasBack && (
                    <ImageCard
                      title={`${doc.type.replace('_', ' ')} (Back)`}
                      icon={FileText}
                      image={doc.sides.back}
                      type="approved"
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  // Render approved images for the approved section
  const renderApprovedImages = () => {
    const nonDoc = renderNonDocApprovedImages();
    const docs = renderDocApprovedImages();

    if (!nonDoc && !docs) return null;

    return (
      <>
        {nonDoc}
        {docs}
      </>
    );
  };

  // Determine action buttons
  const renderActionButtons = () => {
    if (!searchResults?.data?.unapproved) return null;

    const unapproved = searchResults.data.unapproved;
    const hasNonDoc = ['photo', 'accsign', 'thumbprint1', 'thumbprint2'].some(
      key => unapproved[key] && unapproved[key].trim() !== ''
    );
    const hasDocs = unapproved.documents?.some((d: DocumentData) => 
      d.sides.front?.trim() !== '' || d.sides.back?.trim() !== ''
    ) ?? false;

    const allUnapprovedEmpty = !hasNonDoc && !hasDocs;

    if (allUnapprovedEmpty) return null;

    return (
      <div className="flex gap-2">
        <Button
          onClick={handleApprove}
          className="bg-green-600 hover:bg-green-700"
          disabled={allUnapprovedEmpty}
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Approve
        </Button>
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="border-red-200 text-red-700 hover:bg-red-50"
              disabled={allUnapprovedEmpty}
            >
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

          {/* Search Section - Only show when no relation number available */}
          {!approvalParams.relationno && (
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
                </CardContent>
              </Card>
            </motion.div>
          )}

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
                  {(() => {
                    const unapproved = searchResults.data.unapproved;
                    const hasNonDoc = ['photo', 'accsign', 'thumbprint1', 'thumbprint2'].some(
                      key => unapproved[key] && unapproved[key].trim() !== ''
                    );
                    const hasDocs = unapproved.documents?.some((d: DocumentData) => 
                      d.sides.front?.trim() !== '' || d.sides.back?.trim() !== ''
                    ) ?? false;
                    const allUnapprovedEmpty = !hasNonDoc && !hasDocs;
                    if (allUnapprovedEmpty) {
                      return (
                        <Card>
                          <CardContent className="text-center py-8">
                            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-green-600 mb-2">All Steps Completed</h3>
                            <p className="text-gray-500">
                              All biometric data has been reviewed.
                            </p>
                          </CardContent>
                        </Card>
                      );
                    } else {
                      return (
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
                      );
                    }
                  })()}
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