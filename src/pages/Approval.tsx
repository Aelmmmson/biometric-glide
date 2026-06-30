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
  getPostingDate,
  SearchImagesResponse,
  DocumentData,
  getImagesByAccount
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

const getSafeImageValue = (
  data: {
    photo?: string;
    accsign?: string;
    thumbprint1?: string;
    thumbprint2?: string;
  } | undefined,
  key: string
): string => {
  if (!data) return '';
  if (key === 'photo') return data.photo || '';
  if (key === 'accsign') return data.accsign || '';
  if (key === 'thumbprint1') return data.thumbprint1 || '';
  if (key === 'thumbprint2') return data.thumbprint2 || '';
  return '';
};

interface ApprovalProps {
  mode?: 'relation' | 'account';
  accountParams?: {
    batch: string;
    custNo: string;
    approvedBy: string;
    hostname: string;
    terminalIp: string;
  };
}

const Approval = ({ mode = 'relation', accountParams }: ApprovalProps) => {
  const { toast } = useToast();
  const [searchResults, setSearchResults] = useState<SearchImagesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchRelationNo, setSearchRelationNo] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [approvalParams, setApprovalParams] = useState<ReturnType<typeof getApprovalParams>>({});
  const [postingDate, setPostingDate] = useState<string>('');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const dialogCloseRef = useRef<HTMLButtonElement>(null);

  // States for account mode
  const [accountRelations, setAccountRelations] = useState<any[]>([]);
  const [checkedRelations, setCheckedRelations] = useState<Record<string, boolean>>({});
  const [isAccountSubmitting, setIsAccountSubmitting] = useState(false);

  useEffect(() => {
    getPostingDate().then(setPostingDate).catch(console.error);
  }, []);

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

  const hasUnapprovedImages = (rel: any): boolean => {
    const nonDocTypes: string[] = [];
    const unapproved = rel.unapproved;
    if (unapproved) {
      if (unapproved.photo && unapproved.photo.trim() !== '') nonDocTypes.push('photo');
      if (unapproved.accsign && unapproved.accsign.trim() !== '') nonDocTypes.push('accsign');
      if (unapproved.thumbprint1 && unapproved.thumbprint1.trim() !== '') nonDocTypes.push('thumbprint1');
      if (unapproved.thumbprint2 && unapproved.thumbprint2.trim() !== '') nonDocTypes.push('thumbprint2');
    }
    const docTypes = unapproved?.documents?.map((d: any) => d.type) ?? [];
    return (nonDocTypes.length + docTypes.length) > 0;
  };

  const fetchAccountRelations = async (accountNo: string) => {
    setIsLoading(true);
    try {
      const res = await getImagesByAccount(accountNo);
      if (res.status === 'success' && res.data?.enq_details) {
        const detailsPromises = res.data.enq_details.map(async (rel) => {
          const detailRes = await searchImages(rel.relation_no);
          return detailRes.status === 'success' ? detailRes.data : null;
        });
        const details = await Promise.all(detailsPromises);
        const validDetails = details.filter(Boolean);
        setAccountRelations(validDetails);
        
        const initialChecked: Record<string, boolean> = {};
        validDetails.forEach((r: any) => {
          if (r.relation_no) {
            initialChecked[r.relation_no] = hasUnapprovedImages(r);
          }
        });
        setCheckedRelations(initialChecked);
        
        toast({
          title: "Account Loaded",
          description: `Loaded ${validDetails.length} signatories for account #${accountNo}.`,
        });
      } else {
        toast({
          title: "Account Not Found",
          description: res.message || "No signatories found for this account.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to load account relations.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (mode === 'account' && accountParams) {
      setApprovalParams({
        relationno: 'all',
        batch: accountParams.batch,
        custno: accountParams.custNo,
        approved_by: accountParams.approvedBy,
        hostname: accountParams.hostname,
        terminal_ip: accountParams.terminalIp
      });
      fetchAccountRelations(accountParams.custNo);
    } else {
      const params = getApprovalParams();
      setApprovalParams(params);

      if (params.relationno) {
        setSearchRelationNo(params.relationno);
        handleSearch(params.relationno);
      }
    }
  }, [handleSearch, mode, accountParams]);

  const handleApproveChecked = async () => {
    const checkedList = accountRelations.filter(r => checkedRelations[r.relation_no]);
    if (checkedList.length === 0) {
      toast({
        title: "No Signatories Selected",
        description: "Please check at least one signatory to approve.",
        variant: "destructive",
      });
      return;
    }

    setIsAccountSubmitting(true);
    let successCount = 0;
    let failCount = 0;

    for (const rel of checkedList) {
      const nonDocTypes: string[] = [];
      const unapproved = rel.unapproved;
      if (unapproved) {
        if (unapproved.photo && unapproved.photo.trim() !== '') nonDocTypes.push('photo');
        if (unapproved.accsign && unapproved.accsign.trim() !== '') nonDocTypes.push('accsign');
        if (unapproved.thumbprint1 && unapproved.thumbprint1.trim() !== '') nonDocTypes.push('thumbprint1');
        if (unapproved.thumbprint2 && unapproved.thumbprint2.trim() !== '') nonDocTypes.push('thumbprint2');
      }
      const docTypes = unapproved?.documents?.map((d: any) => d.type) ?? [];
      const imageTypes = [...nonDocTypes, ...docTypes];

      if (imageTypes.length === 0) {
        successCount++;
        continue;
      }

      try {
        const result = await approveCustomerImages({
          relationno: rel.relation_no,
          batch: approvalParams.batch || accountParams?.batch || 'B001',
          custno: approvalParams.custno || accountParams?.custNo || '',
          approved_by: approvalParams.approved_by || accountParams?.approvedBy || 'supervisor',
          hostname: approvalParams.hostname || accountParams?.hostname || 'STANDALONE-PC',
          terminal_ip: approvalParams.terminal_ip || accountParams?.terminalIp || '127.0.0.1',
          posting_date: postingDate,
        } as any);

        if (result.status === 'success') {
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        console.error(`Error approving relation #${rel.relation_no}:`, error);
        failCount++;
      }
    }

    setIsAccountSubmitting(false);
    toast({
      title: "Approval Process Finished",
      description: `Successfully approved ${successCount} signatory profile(s). Failed: ${failCount}.`,
      variant: failCount > 0 ? "destructive" : "default"
    });

    if (accountParams?.custNo) {
      fetchAccountRelations(accountParams.custNo);
    }
  };

  const handleRejectChecked = async () => {
    if (!rejectReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for rejection",
        variant: "destructive",
      });
      return;
    }

    const checkedList = accountRelations.filter(r => checkedRelations[r.relation_no]);
    if (checkedList.length === 0) {
      toast({
        title: "No Signatories Selected",
        description: "Please check at least one signatory to reject.",
        variant: "destructive",
      });
      return;
    }

    setIsAccountSubmitting(true);
    let successCount = 0;
    let failCount = 0;

    for (const rel of checkedList) {
      const nonDocTypes: string[] = [];
      const unapproved = rel.unapproved;
      if (unapproved) {
        if (unapproved.photo && unapproved.photo.trim() !== '') nonDocTypes.push('photo');
        if (unapproved.accsign && unapproved.accsign.trim() !== '') nonDocTypes.push('accsign');
        if (unapproved.thumbprint1 && unapproved.thumbprint1.trim() !== '') nonDocTypes.push('thumbprint1');
        if (unapproved.thumbprint2 && unapproved.thumbprint2.trim() !== '') nonDocTypes.push('thumbprint2');
      }
      const docTypes = unapproved?.documents?.map((d: any) => d.type) ?? [];
      const imageTypes = [...nonDocTypes, ...docTypes];

      if (imageTypes.length === 0) {
        successCount++;
        continue;
      }

      try {
        const result = await rejectCustomerImages(rel.relation_no, rejectReason, imageTypes);
        if (result.status === 'success') {
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        console.error(`Error rejecting relation #${rel.relation_no}:`, error);
        failCount++;
      }
    }

    setIsAccountSubmitting(false);
    setRejectReason('');
    dialogCloseRef.current?.click();
    toast({
      title: "Rejection Process Finished",
      description: `Successfully rejected ${successCount} signatory profile(s). Failed: ${failCount}.`,
      variant: failCount > 0 ? "destructive" : "default"
    });

    if (accountParams?.custNo) {
      fetchAccountRelations(accountParams.custNo);
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

    if (!searchResults?.data?.unapproved) return;

    const unapproved = searchResults.data.unapproved;
    const nonDocTypes: string[] = [];
    if (unapproved.photo && unapproved.photo.trim() !== '') nonDocTypes.push('photo');
    if (unapproved.accsign && unapproved.accsign.trim() !== '') nonDocTypes.push('accsign');
    if (unapproved.thumbprint1 && unapproved.thumbprint1.trim() !== '') nonDocTypes.push('thumbprint1');
    if (unapproved.thumbprint2 && unapproved.thumbprint2.trim() !== '') nonDocTypes.push('thumbprint2');
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
        posting_date: postingDate,
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
    const nonDocTypes: string[] = [];
    if (unapproved.photo && unapproved.photo.trim() !== '') nonDocTypes.push('photo');
    if (unapproved.accsign && unapproved.accsign.trim() !== '') nonDocTypes.push('accsign');
    if (unapproved.thumbprint1 && unapproved.thumbprint1.trim() !== '') nonDocTypes.push('thumbprint1');
    if (unapproved.thumbprint2 && unapproved.thumbprint2.trim() !== '') nonDocTypes.push('thumbprint2');
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
            <Icon className="h-3 w-3" />
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
              <div className="aspect-[4/3] overflow-hidden rounded-lg bg-gray-100">
                <img
                  src={image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`}
                  alt={title}
                  className={`w-full h-full ${isPhotoOrSignature ? 'object-cover' : 'object-contain'}`}
                />
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full">
                    <Eye className="mr-1 h-3 w-3" />
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
                    className="h-auto w-full"
                  />
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            <div className="flex aspect-[4/3] items-center justify-center rounded-lg bg-gray-100">
              <span className="text-sm text-gray-400">No image available</span>
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

    const validConfigs = allConfigs.filter(config => getSafeImageValue(data, config.key).trim() !== '');

    if (validConfigs.length === 0) return null;

    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {validConfigs.map((config) => (
          <ImageCard
            key={config.key}
            title={config.title}
            icon={config.icon}
            image={getSafeImageValue(data, config.key)}
            type={section}
          />
        ))}
      </div>
    );
  };

  const renderDocImages = (section: 'approved' | 'unapproved') => {
    if (!searchResults?.data) return null;
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
                  <FileText className="h-3 w-3" />
                  {doc.type.replace('_', ' ').toUpperCase()}
                  <Badge variant={section === 'approved' ? 'default' : 'secondary'} className={section === 'approved' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}>
                    {section === 'approved' ? 'Approved' : 'Pending'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

  const renderRelationNonDocImages = (relData: any, section: 'approved' | 'unapproved') => {
    if (!relData) return null;

    const data = section === 'approved' ? relData.approved : relData.unapproved;
    const allConfigs = [
      { key: 'photo', title: 'Photo', icon: Camera },
      { key: 'accsign', title: 'Signature Name', icon: PenTool },
      { key: 'thumbprint1', title: 'Right Thumbprint', icon: Fingerprint },
      { key: 'thumbprint2', title: 'Left Thumbprint', icon: Fingerprint }
    ];

    const validConfigs = allConfigs.filter(config => getSafeImageValue(data, config.key).trim() !== '');

    if (validConfigs.length === 0) return null;

    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {validConfigs.map((config) => (
          <ImageCard
            key={config.key}
            title={config.title}
            icon={config.icon}
            image={getSafeImageValue(data, config.key)}
            type={section}
          />
        ))}
      </div>
    );
  };

  const renderRelationDocImages = (relData: any, section: 'approved' | 'unapproved') => {
    if (!relData) return null;
    const data = section === 'approved' ? relData.approved : relData.unapproved;
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
                  <FileText className="h-3 w-3" />
                  {doc.type.replace('_', ' ').toUpperCase()}
                  <Badge variant={section === 'approved' ? 'default' : 'secondary'} className={section === 'approved' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}>
                    {section === 'approved' ? 'Approved' : 'Pending'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

  const renderRelationSectionData = (relData: any, section: 'approved' | 'unapproved', title: string, Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>, limit: string | number, mandate: string) => {
    if (!relData) return null;

    const data = section === 'approved' ? relData.approved : relData.unapproved;
    const nonDocContent = renderRelationNonDocImages(relData, section);
    const docContent = renderRelationDocImages(relData, section);
    const hasContent = !!nonDocContent || !!docContent;

    return (
      <Card className={section === 'unapproved' ? 'border-orange-200' : 'border-green-200'}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Icon className="h-4 w-4" />
            {title}
          </CardTitle>
          <div className="flex justify-center gap-4 pt-1">
            <div className="text-center">
              <Badge variant="outline" className="text-xs">Limit</Badge>
              <Badge variant="secondary" className="ml-2 text-xs">{limit || 'N/A'}</Badge>
            </div>
            <div className="text-center">
              <Badge variant="outline" className="text-xs">Mandate</Badge>
              <Badge variant="secondary" className="ml-2 text-xs">{mandate || 'N/A'}</Badge>
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
            <div className="py-8 text-center">
              <p className="text-lg text-gray-500">
                {section === 'approved' ? 'No approved images yet' : 'No pending images to review'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
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
            <Icon className="h-4 w-4" />
            {title}
          </CardTitle>
          <div className="flex justify-center gap-4 pt-1">
            <div className="text-center">
              <Badge variant="outline" className="text-xs">Limit</Badge>
              <Badge variant="secondary" className="ml-2 text-xs">{limit || 'N/A'}</Badge>
            </div>
            <div className="text-center">
              <Badge variant="outline" className="text-xs">Mandate</Badge>
              <Badge variant="secondary" className="ml-2 text-xs">{mandate || 'N/A'}</Badge>
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
            <div className="py-8 text-center">
              <p className="text-lg text-gray-500">
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
    const hasNonDoc =
      (unapproved.photo && unapproved.photo.trim() !== '') ||
      (unapproved.accsign && unapproved.accsign.trim() !== '') ||
      (unapproved.thumbprint1 && unapproved.thumbprint1.trim() !== '') ||
      (unapproved.thumbprint2 && unapproved.thumbprint2.trim() !== '');
    const hasDocs = unapproved.documents?.some((d: DocumentData) => 
      d.sides.front?.trim() !== '' || d.sides.back?.trim() !== ''
    ) ?? false;

    const allUnapprovedEmpty = !hasNonDoc && !hasDocs;

    if (allUnapprovedEmpty) return null;

    // return (
    //   <div className="my-4 flex justify-center gap-4">
    //     <Button
    //       size="lg"
    //       onClick={handleApprove}
    //       className="bg-green-600 hover:bg-green-700"
    //       disabled={allUnapprovedEmpty}
    //     >
    //       <CheckCircle className="mr-2 h-5 w-5" />
    //       Approve All Pending
    //     </Button>
    //     <Dialog>
    //       <DialogTrigger asChild>
    //         <Button
    //           size="lg"
    //           variant="outline"
    //           className="border-red-300 text-red-700 hover:bg-red-50"
    //           disabled={allUnapprovedEmpty}
    //         >
    //           <XCircle className="mr-2 h-5 w-5" />
    //           Reject
    //         </Button>
    //       </DialogTrigger>
    //       <DialogContent>
    //         <DialogTitle>Reject Unapproved Images</DialogTitle>
    //         <div className="space-y-4">
    //           <Textarea
    //             placeholder="Enter reason for rejection..."
    //             value={rejectReason}
    //             onChange={(e) => setRejectReason(e.target.value)}
    //             className="min-h-32"
    //           />
    //           <div className="flex justify-end gap-3">
    //             <DialogClose asChild>
    //               <Button variant="outline">Cancel</Button>
    //             </DialogClose>
    //             <Button onClick={handleReject} variant="destructive">
    //               Confirm Rejection
    //             </Button>
    //           </div>
    //         </div>
    //       </DialogContent>
    //     </Dialog>
    //   </div>
    // );
  };

  return (
    <div className="bg-gradient-soft min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-7xl">
          {mode === 'relation' ? (
            <>
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 text-center"
              >
                <h1 className="mb-3 text-4xl font-bold text-foreground">
                  Image Approval System
                </h1>
                <p className="text-lg text-muted-foreground">
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
                        <Search className="h-6 w-6" />
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
                  <div className="mt-0 flex flex-col items-center justify-center gap-4 sm:flex-row">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Customer Name</p>
                        <p className="font-medium">{searchResults.data.name || 'Not Available'}</p>
                      </div>
                    </div>

                    <div className="hidden h-8 w-px bg-gray-300 sm:block"></div>

                    <div className="flex items-center gap-3">
                      <IdCard className="h-5 w-5 text-indigo-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Signature ID</p>
                        <p className="font-mono font-semibold text-indigo-700">
                          {searchResults.data.relation_no || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
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
                        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2">
                          {renderSection('approved', 'Approved Images', CheckCircle, searchResults.data.approved?.limit || '', searchResults.data.approved?.mandate || '')}
                          {renderSection('unapproved', 'Pending Review', AlertCircle, searchResults.data.unapproved?.limit || '', searchResults.data.unapproved?.mandate || '')}
                        </div>
                      </>
                    );
                  })()}
                </motion.div>
              )}

              {searchResults?.status === 'not_found' && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <AlertCircle className="mx-auto mb-4 h-16 w-16 text-gray-400" />
                    <h3 className="mb-2 text-2xl font-semibold text-gray-600">No Records Found</h3>
                    <p className="text-lg text-gray-500">
                      No biometric data found for Signature ID: <strong>{searchRelationNo}</strong>
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            /* Account Mode UI */
            <div className="space-y-6">
              {(() => {
                const relationsWithUnapproved = accountRelations.filter(hasUnapprovedImages);
                const selectAllChecked = relationsWithUnapproved.length > 0 && relationsWithUnapproved.every(r => checkedRelations[r.relation_no]);
                const checkedCount = accountRelations.filter(r => checkedRelations[r.relation_no]).length;

                return (
                  <Card className="sticky top-0 z-20 border border-blue-700 bg-blue-600 text-white shadow-md">
                    <CardContent className="flex flex-col justify-between gap-4 p-4 md:flex-row md:items-center">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase text-blue-200">Account Approval</span>
                          <Badge className="border-none bg-blue-700 text-white hover:bg-blue-700">#{accountParams?.custNo || ''}</Badge>
                        </div>
                        <h2 className="text-lg font-bold text-white">
                          {accountRelations[0]?.unapproved?.mandate || accountRelations[0]?.approved?.mandate || 'Mandate'} Account
                        </h2>
                        <p className="text-xs text-blue-100">
                          Supervisor Approval Dashboard for Signatory Specimens
                        </p>
                      </div>

                      {relationsWithUnapproved.length > 0 ? (
                        <div className="flex shrink-0 items-center gap-4">
                          <div className="flex items-center gap-2 rounded-lg border border-blue-500 bg-white px-3 py-1.5 text-white">
                            <input
                              type="checkbox"
                              id="select-all"
                              checked={selectAllChecked}
                              onChange={(e) => {
                                const val = e.target.checked;
                                const updated: Record<string, boolean> = {};
                                accountRelations.forEach(r => {
                                  updated[r.relation_no] = val && hasUnapprovedImages(r);
                                });
                                setCheckedRelations(updated);
                              }}
                              className="h-4 w-4 cursor-pointer rounded text-white focus:ring-blue-500"
                            />
                            <label htmlFor="select-all" className="text-blue-800 font-bold cursor-pointer select-none text-xs">
                              Select All
                            </label>
                          </div>

                          <Button
                            onClick={handleApproveChecked}
                            disabled={isAccountSubmitting || checkedCount === 0}
                            className="h-10 rounded-[7px] border-none bg-green-600 px-4 font-bold text-white shadow-sm hover:bg-green-700 disabled:opacity-50"
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Approve Selected ({checkedCount})
                          </Button>

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="destructive"
                                disabled={isAccountSubmitting || checkedCount === 0}
                                className="h-10 rounded-[7px] border-none bg-red-500 px-4 font-bold text-white shadow-sm hover:bg-red-600 disabled:opacity-50"
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Reject Selected ({checkedCount})
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="border-slate-200 bg-white text-slate-800">
                              <DialogTitle className="font-bold text-slate-900">Reject Selected Signatories</DialogTitle>
                              <div className="space-y-4">
                                <Textarea
                                  placeholder="Enter reason for rejection..."
                                  value={rejectReason}
                                  onChange={(e) => setRejectReason(e.target.value)}
                                  className="min-h-32 border-slate-200 text-slate-800 focus-visible:ring-blue-500"
                                />
                                <div className="flex justify-end gap-3">
                                  <DialogClose asChild>
                                    <Button ref={dialogCloseRef} variant="outline" className="border-slate-200 text-slate-700 hover:bg-slate-50">Cancel</Button>
                                  </DialogClose>
                                  <Button onClick={handleRejectChecked} variant="destructive">
                                    Confirm Rejection
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      ) : (
                        <div className="shrink-0 rounded-lg border border-blue-500/30 bg-blue-700/50 px-3 py-1.5 text-xs font-bold text-blue-200">
                          No pending unapproved images for this account
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })()}

              {/* List of Relation Cards */}
              <div className="space-y-8">
                {accountRelations.map((rel: any) => {
                  const isChecked = !!checkedRelations[rel.relation_no];
                  return (
                    <Card key={rel.relation_no} className={`border border-slate-200 bg-white/90 shadow-sm overflow-hidden transition-all duration-300 ${isChecked ? 'ring-2 ring-blue-500/20' : 'opacity-70'}`}>
                      {/* Relation Card Header */}
                      <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 p-4 py-3">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={!hasUnapprovedImages(rel)}
                            onChange={(e) => {
                              setCheckedRelations(prev => ({
                                ...prev,
                                [rel.relation_no]: e.target.checked
                              }));
                            }}
                            className="h-4 w-4 cursor-pointer rounded text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
                          />
                          <div>
                            <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-800">
                              <span>{rel.name || 'Unnamed Relation'}</span>
                              <span className="font-mono text-xs text-slate-500">(ID: {rel.relation_no})</span>
                            </CardTitle>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="border-slate-200 bg-white text-xs font-bold text-slate-700">
                            Limit: {rel.unapproved?.limit || rel.approved?.limit || 'N/A'}
                          </Badge>
                          <Badge variant="outline" className="border-slate-200 bg-white text-xs font-bold text-slate-700">
                            Category: {rel.unapproved?.mandate || rel.approved?.mandate || 'N/A'}
                          </Badge>
                          <Badge
                            className={rel.unapproved && (rel.unapproved.photo || rel.unapproved.accsign || rel.unapproved.thumbprint1 || rel.unapproved.thumbprint2) ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}
                          >
                            {rel.unapproved && (rel.unapproved.photo || rel.unapproved.accsign || rel.unapproved.thumbprint1 || rel.unapproved.thumbprint2) ? 'Pending Review' : 'Approved'}
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="p-4">
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                          {renderRelationSectionData(rel, 'approved', 'Approved Specimens', CheckCircle, rel.approved?.limit || '', rel.approved?.mandate || '')}
                          {renderRelationSectionData(rel, 'unapproved', 'Pending Review', AlertCircle, rel.unapproved?.limit || '', rel.unapproved?.mandate || '')}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {accountRelations.length === 0 && !isLoading && (
                  <Card className="p-12 text-center">
                    <AlertCircle className="mx-auto mb-3 h-12 w-12 text-slate-300" />
                    <h3 className="font-bold text-slate-600">No Signatory Records</h3>
                    <p className="mt-1 text-xs text-slate-400">There are no signatory relation records found for this account profile.</p>
                  </Card>
                )}
              </div>
            </div>
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
            className="h-12 w-12 rounded-full bg-primary shadow-2xl hover:bg-primary/90"
          >
            <ArrowUp className="h-6 w-6" />
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default Approval;