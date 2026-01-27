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
  AlertCircle,
  ArrowUp,
  User,
  IdCard
} from 'lucide-react';

interface ApprovalParams extends ReturnType<typeof getApprovalParams> {
  imageTypes?: string[];
}

interface RequiredApprovalParams {
  relationno: string;
  batch: string;
  custno: string;
  approved_by: string;
  hostname: string;
  terminal_ip: string;
  imageTypes?: string[];
}

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
  const [showScrollTop, setShowScrollTop] = useState(false);
  const dialogCloseRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
        dialogCloseRef.current?.click();
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
    type,
    className = ''
  }: {
    title: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    image?: string;
    type: 'approved' | 'unapproved';
    className?: string;
  }) => {
    const isPhotoOrSignature = title.includes('Photo') || title.includes('Signature');
    return (
      <Card className={`${type === 'unapproved' ? 'border-orange-200' : 'border-green-200'} ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-xs">
            <Icon className="w-3 h-3" />
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
                  className={`w-full h-full ${isPhotoOrSignature ? 'object-cover' : 'object-contain'}`}
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
  };

  const getAllImageConfigs = (data: NonNullable<SearchImagesResponse['data']>): StepImageConfig[] => {
    return [
      { key: 'photo', title: 'Photo', icon: Camera },
      { key: 'accsign', title: 'Signature Name', icon: PenTool }, // Updated label
      { key: 'thumbprint1', title: 'Right Thumbprint', icon: Fingerprint },
      { key: 'thumbprint2', title: 'Left Thumbprint', icon: Fingerprint }
    ];
  };

  const renderNonDocImages = (section: 'approved' | 'unapproved') => {
    if (!searchResults?.data) return null;

    const data = section === 'approved' ? searchResults.data.approved : searchResults.data.unapproved;
    const allConfigs = getAllImageConfigs(searchResults.data);

    const validConfigs = allConfigs.filter(config => data[config.key]?.trim() !== '');

    if (validConfigs.length === 0) return null;

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {validConfigs.map((config) => (
          <ImageCard
            key={config.key}
            title={config.title}
            icon={config.icon}
            image={data[config.key]}
            type={section}
          />
        ))}
      </div>
    );
  };

  const renderDocImages = (section: 'approved' | 'unapproved') => {
    const data = section === 'approved' ? searchResults.data.approved : searchResults.data.unapproved;
    const documents = data?.documents || [];

    if (documents.length === 0) return null;

    return (
      <div className="space-y-4">
        {documents.map((doc: DocumentData) => {
          const hasFront = !!doc.sides.front && doc.sides.front.trim() !== '';
          const hasBack = !!doc.sides.back && doc.sides.back.trim() !== '';
          if (!hasFront && !hasBack) return null;

          return (
            <Card key={doc.type} className={section === 'unapproved' ? 'border-orange-200' : 'border-green-200'}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-xs">
                  <FileText className="w-3 h-3" />
                  {doc.type.replace('_', ' ').toUpperCase()}
                  <Badge variant={section === 'approved' ? 'default' : 'secondary'} className={section === 'approved' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}>
                    {section === 'approved' ? 'Approved' : 'Pending'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {hasFront && (
                    <ImageCard
                      title={`${doc.type.replace('_', ' ')} (Front)`}
                      icon={FileText}
                      image={doc.sides.front}
                      type={section}
                    />
                  )}
                  {hasBack && (
                    <ImageCard
                      title={`${doc.type.replace('_', ' ')} (Back)`}
                      icon={FileText}
                      image={doc.sides.back}
                      type={section}
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

  const renderSection = (section: 'approved' | 'unapproved', title: string, Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>, limit: string | number, mandate: string) => {
    if (!searchResults?.data) return null;

    const data = section === 'approved' ? searchResults.data.approved : searchResults.data.unapproved;
    const nonDocContent = renderNonDocImages(section);
    const docContent = renderDocImages(section);
    const hasContent = !!nonDocContent || !!docContent;

    return (
      <Card className={section === 'unapproved' ? 'border-orange-200' : 'border-green-200'}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Icon className="w-4 h-4" />
            {title}
          </CardTitle>
          <div className="flex justify-center pt-1 gap-4">
            <div className="text-center">
              <Badge variant="outline" className="text-xs">Limit</Badge>
              <Badge variant="secondary" className="text-xs ml-2">{limit || 'N/A'}</Badge>
            </div>
            <div className="text-center">
              <Badge variant="outline" className="text-xs">Mandate</Badge>
              <Badge variant="secondary" className="text-xs ml-2">{mandate || 'N/A'}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {hasContent ? (
            <div className="space-y-4">
              {nonDocContent}
              {docContent}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 text-lg">
                {section === 'approved' ? 'No approved images yet' : 'No pending images to review'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

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
      <div className="flex justify-center gap-4 my-4">
        <Button
          size="lg"
          onClick={handleApprove}
          className="bg-green-600 hover:bg-green-700"
          disabled={allUnapprovedEmpty}
        >
          <CheckCircle className="w-5 h-5 mr-2" />
          Approve All Pending
        </Button>
        <Dialog>
          <DialogTrigger asChild>
            <Button
              size="lg"
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50"
              disabled={allUnapprovedEmpty}
            >
              <XCircle className="w-5 h-5 mr-2" />
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
                className="min-h-32"
              />
              <div className="flex gap-3 justify-end">
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
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
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-5"
          >
            <h1 className="text-4xl font-bold text-foreground mb-3">
              Image Approval System
            </h1>
            <p className="text-muted-foreground text-lg">
              Review and approve customer biometric data
            </p>
          </motion.div>

          {/* Search Section */}
          {!approvalParams.relationno && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-2"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="w-6 h-6" />
                    Search Customer Images
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <Input
                      placeholder="Enter relation number..."
                      value={searchRelationNo}
                      onChange={(e) => setSearchRelationNo(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      className="text-lg"
                    />
                    <Button
                      onClick={() => handleSearch()}
                      disabled={isLoading}
                      size="lg"
                    >
                      {isLoading ? 'Searching...' : 'Search'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Customer Info Header */}
          {searchResults?.data && (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="mb-1 mt-0"
  >
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-0">
      {/* Customer Name */}
      <div className="flex items-center gap-3">
        <User className="w-5 h-5 text-blue-600" />
        <div>
          <p className="text-sm text-muted-foreground">Customer Name</p>
          <p className="font-medium">{searchResults.data.name || 'Not Available'}</p>
        </div>
      </div>

      {/* Vertical Divider */}
      <div className="hidden sm:block h-8 w-px bg-gray-300"></div>

      {/* Signature ID */}
      <div className="flex items-center gap-3">
        <IdCard className="w-5 h-5 text-indigo-600" />
        <div>
          <p className="text-sm text-muted-foreground">Signature ID</p>
          <p className="font-mono font-semibold text-indigo-700">
            {searchResults.data.relation_no || 'N/A'}
          </p>
        </div>
      </div>
    </div>

    {/* Optional horizontal line below */}
    {/* <div className="mt-6 border-t"></div> */}
  </motion.div>
)}

          {/* Results */}
          {searchResults && searchResults.status === 'success' && searchResults.data && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-2"
            >
              {(() => {
                return (
                  <>
                    {renderActionButtons()}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                      {renderSection('approved', 'Approved Images', CheckCircle, searchResults.data.approved.limit || '', searchResults.data.approved.mandate || '')}
                      {renderSection('unapproved', 'Pending Review', AlertCircle, searchResults.data.unapproved.limit || '', searchResults.data.unapproved.mandate || '')}
                    </div>
                  </>
                );
              })()}
            </motion.div>
          )}

          {searchResults?.status === 'not_found' && (
            <Card>
              <CardContent className="text-center py-12">
                <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-2xl font-semibold text-gray-600 mb-2">No Records Found</h3>
                <p className="text-gray-500 text-lg">
                  No biometric data found for Signature ID: <strong>{searchRelationNo}</strong>
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {showScrollTop && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed bottom-8 right-8 z-50"
        >
          <Button
            onClick={scrollToTop}
            size="icon"
            className="rounded-full bg-primary hover:bg-primary/90 shadow-2xl w-12 h-12"
          >
            <ArrowUp className="w-6 h-6" />
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default Approval;