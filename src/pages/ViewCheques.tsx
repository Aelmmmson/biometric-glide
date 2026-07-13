import { useRef, useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Loader2, AlertCircle, ChevronLeft, ChevronRight, 
    Printer, Eye, EyeOff, Image as ImageIcon,
    ShieldCheck, Info, LucideIcon, Banknote,
    Hash, FileText, Calendar, CheckCircle2,
    CreditCard, User, Building, Landmark,
    AlertTriangle, Shield, Menu, X, Check, ZoomIn, Maximize2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { getChequeDetails, getAccountSignatures, verifySignature, verifyChequeMandate, type ChequeDetailResponse, type SignatureVerificationResponse } from '@/services/api';
import { SandboxVerifyModal } from '@/components/SandboxVerifyModal';
import { handleSystemError } from '@/lib/errorHandler';
import { Beaker } from 'lucide-react';

interface ViewChequesProps {
  chequeNumber?: string;
}

interface SignatureItem {
    photo: string;
    signature: string;
    rank?: string;
    relation_no: string;
    limit?: number;
    sign_category?: string;
}

const ZoomableImage = ({ 
    src, 
    alt, 
    className, 
    onImageClick,
    isZoomed: controlledIsZoomed,
    onZoomChange,
    coords: controlledCoords,
    onCoordsChange
}: { 
    src: string, 
    alt: string, 
    className?: string, 
    onImageClick?: (e: React.MouseEvent) => void,
    isZoomed?: boolean,
    onZoomChange?: (zoomed: boolean) => void,
    coords?: { x: number, y: number },
    onCoordsChange?: (coords: { x: number, y: number }) => void
}) => {
    const [localIsZoomed, setLocalIsZoomed] = useState(false);
    const isZoomed = controlledIsZoomed !== undefined ? controlledIsZoomed : localIsZoomed;
    const setIsZoomed = onZoomChange || setLocalIsZoomed;
    const [localCoords, setLocalCoords] = useState({ x: 0, y: 0 });
    const coords = controlledCoords !== undefined ? controlledCoords : localCoords;
    const setCoords = onCoordsChange || setLocalCoords;
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isZoomed || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const xPercent = (x / rect.width) * 100;
        const yPercent = (y / rect.height) * 100;
        const newCoords = {
            x: (50 - xPercent) * 1.5,
            y: (50 - yPercent) * 1.5
        };
        setCoords(newCoords);
    };

    const toggleZoom = (e: React.MouseEvent) => {
        e.stopPropagation();
        const nextZoomed = !isZoomed;
        setIsZoomed(nextZoomed);
        if (!nextZoomed) {
            setCoords({ x: 0, y: 0 });
        }
    };

    const handleContainerClick = (e: React.MouseEvent) => {
        if (onImageClick) {
            e.stopPropagation();
            onImageClick(e);
        } else {
            toggleZoom(e);
        }
    };

    return (
        <div 
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => { 
                if (controlledIsZoomed === undefined) {
                    setIsZoomed(false); 
                    setCoords({ x: 0, y: 0 }); 
                } 
            }}
            className="relative overflow-hidden w-full h-full flex items-center justify-center select-none"
            style={{ cursor: isZoomed ? 'zoom-out' : (onImageClick ? 'pointer' : 'zoom-in') }}
            onClick={handleContainerClick}
        >
            <img 
                src={src} 
                alt={alt} 
                className={`transition-transform duration-100 ease-out w-full h-full ${className || 'object-contain'}`}
                style={{
                    transform: isZoomed ? `scale(2.5) translate(${coords.x}%, ${coords.y}%)` : 'scale(1) translate(0px, 0px)',
                }}
            />
        </div>
    );
};

const SignatoryCard = ({ 
    sig, 
    index, 
    chequeAmountValue, 
    showRelation,
    onZoom,
    isActive,
    onClick,
    syncedZoom,
    syncedCoords
}: { 
    sig: SignatureItem, 
    index: number, 
    chequeAmountValue: number,
    showRelation: boolean,
    onZoom: (src: string) => void,
    isActive?: boolean,
    onClick?: () => void,
    syncedZoom?: boolean,
    syncedCoords?: { x: number, y: number }
}) => {
    const [isFlipped, setIsFlipped] = useState(false);
    const [isZoomedFront, setIsZoomedFront] = useState(false);
    const [isZoomedBack, setIsZoomedBack] = useState(false);
    const isLimitExceeded = sig.limit !== undefined && sig.limit > 0 && chequeAmountValue > sig.limit;
    
    const currentImgSrc = isFlipped ? sig.photo : sig.signature;

    const handleFlip = () => {
        setIsFlipped(!isFlipped);
        setIsZoomedFront(false);
        setIsZoomedBack(false);
    };

    // Auto-flip back to signature if parent zoom is active
    useEffect(() => {
        if (syncedZoom && isActive) {
            setIsFlipped(false);
        }
    }, [syncedZoom, isActive]);

    return (
        <TooltipProvider delayDuration={200}>
        <div 
            onClick={onClick}
            className={`bg-white border rounded-xl overflow-hidden shadow-sm transition-all hover:shadow-md page-break-inside-avoid relative cursor-pointer ${
                isActive 
                    ? 'border-primary ring-2 ring-primary/20 shadow-md scale-[1.01]' 
                    : 'border-border'
            }`}
        >
            {/* Header row with title, badges, and image controls */}
            <div className="flex justify-between items-center px-3 py-2 border-b border-border/60">
                <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-primary whitespace-nowrap">Signatory {index + 1}</span>
                    {isActive && (
                        <span className="text-[9px] font-black uppercase tracking-wider text-white bg-primary px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shrink-0">
                            <Shield className="w-2.5 h-2.5 text-white" />
                            Active
                        </span>
                    )}
                    {isLimitExceeded && (
                        <span className="text-[9px] font-black uppercase tracking-wider text-red-600 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 flex-shrink-0">
                            <AlertTriangle className="w-3 h-3 text-red-600 animate-pulse" />
                            <span className="hidden sm:inline">Exceeded</span>
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    {/* Zoom toggle */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                onClick={(e) => { 
                                    e.stopPropagation(); 
                                    if (isFlipped) {
                                        setIsZoomedBack(!isZoomedBack);
                                    } else {
                                        setIsZoomedFront(!isZoomedFront);
                                    }
                                }}
                                className={`h-6 w-6 rounded-full flex items-center justify-center transition-all ${
                                    (isFlipped ? isZoomedBack : isZoomedFront) 
                                        ? 'bg-primary text-white hover:bg-primary/95 shadow-sm' 
                                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                                }`}
                            >
                                <ZoomIn className="w-3 h-3" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-[10px] font-bold">
                            {(isFlipped ? isZoomedBack : isZoomedFront) ? 'Zoom out' : 'Zoom in'}
                        </TooltipContent>
                    </Tooltip>
                    {/* Fullscreen modal */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                onClick={(e) => { e.stopPropagation(); if (currentImgSrc) onZoom(currentImgSrc); }}
                                className="h-6 w-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all"
                            >
                                <Maximize2 className="w-3 h-3" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-[10px] font-bold">
                            View fullscreen
                        </TooltipContent>
                    </Tooltip>
                </div>
            </div>
            
            {/* Category, Limit & Relation Row */}
            <div className="grid grid-cols-3 gap-2 px-3 py-1.5 text-slate-700 border-b border-border/40">
                <div className="flex flex-col">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 mb-0.5">Sign Category</span>
                    <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`text-xs font-bold truncate ${isLimitExceeded ? 'text-red-600 font-bold' : 'text-slate-900'}`}>{sig.sign_category || 'N/A'}</span>
                        {isLimitExceeded ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-red-600 animate-pulse shrink-0" />
                        ) : (
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        )}
                    </div>
                </div>
                <div className="flex flex-col">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 mb-0.5">Limit</span>
                    <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`text-xs font-bold truncate ${isLimitExceeded ? 'text-red-600 font-bold' : 'text-slate-900'}`}>
                            {sig.limit !== undefined && sig.limit > 0 
                                ? `SLE ${new Intl.NumberFormat('en-US').format(sig.limit)}` 
                                : 'No Limit'}
                        </span>
                        {isLimitExceeded ? (
                            <AlertCircle className="w-3.5 h-3.5 text-red-600 animate-pulse shrink-0" />
                        ) : (
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        )}
                    </div>
                </div>
                {showRelation && sig.relation_no && (
                    <div className="flex flex-col">
                        <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 mb-0.5">Relation No</span>
                        <span className="text-xs font-bold text-slate-900 font-mono truncate">{sig.relation_no}</span>
                    </div>
                )}
            </div>
            
            {/* SCREEN VIEW: 3D Flipping specimen card — edge-to-edge images */}
            <div className="print:hidden w-full h-[220px] perspective-1000">
                <div 
                    onClick={(e) => { e.stopPropagation(); handleFlip(); }}
                    className={`w-full h-full relative transform-style-3d transition-transform duration-500 cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}
                >
                    {/* Front: Signature */}
                    <div className="absolute inset-0 w-full h-full backface-hidden bg-white overflow-hidden">
                        {sig.signature ? (
                            <ZoomableImage 
                                src={sig.signature} 
                                alt={`Signature ${index + 1}`} 
                                className="object-contain contrast-125 grayscale"
                                onImageClick={handleFlip}
                                isZoomed={isActive ? (syncedZoom || isZoomedFront) : isZoomedFront}
                                onZoomChange={isActive && syncedZoom ? undefined : setIsZoomedFront}
                                coords={isActive && syncedZoom ? syncedCoords : undefined}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground/45 italic bg-slate-50">
                                No Signature Specimen
                            </div>
                        )}
                    </div>

                    {/* Back: Portrait */}
                    <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-white overflow-hidden">
                        {sig.photo ? (
                            <ZoomableImage 
                                src={sig.photo} 
                                alt={`Portrait ${index + 1}`} 
                                onImageClick={handleFlip}
                                isZoomed={isZoomedBack}
                                onZoomChange={setIsZoomedBack}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground/45 italic bg-slate-50">
                                No Portrait Specimen
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Flip indicator — subtle bottom bar */}
            <div className="print:hidden flex items-center justify-center py-1 bg-slate-50/80 border-t border-border/30">
                <span className="text-[9px] text-slate-400 font-medium tracking-wide">{isFlipped ? 'Portrait' : 'Signature'} · tap to flip</span>
            </div>

            {/* PRINT VIEW: BOTH specimens side-by-side */}
            <div className="hidden print:grid print:grid-cols-2 print:gap-4 p-3">
                <div className="flex flex-col items-center justify-center p-3 bg-slate-50 border border-slate-200 rounded-lg min-h-[140px]">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Portrait</span>
                    {sig.photo ? (
                        <img src={sig.photo} className="max-h-[100px] object-contain rounded border border-slate-200 bg-white" alt={`Portrait ${index + 1}`} />
                    ) : (
                        <span className="text-[9px] text-slate-400 italic">No Portrait</span>
                    )}
                </div>
                <div className="flex flex-col items-center justify-center p-3 bg-slate-50 border border-slate-200 rounded-lg min-h-[140px]">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Signature</span>
                    {sig.signature ? (
                        <img src={sig.signature} className="max-h-[100px] object-contain contrast-125 grayscale bg-white p-1 rounded border border-slate-200" alt={`Signature ${index + 1}`} />
                    ) : (
                        <span className="text-[9px] text-slate-400 italic">No Signature</span>
                    )}
                </div>
            </div>
        </div>
        </TooltipProvider>
    );
};

const ViewCheques = ({ chequeNumber: propChequeNumber }: ViewChequesProps) => {
  const params = useParams<{ chequeNumber: string }>();
  const chequeNumber = propChequeNumber || params.chequeNumber;
  
  const [loading, setLoading] = useState(!!chequeNumber);
  const [error, setError] = useState<string | null>(null);
  const [chequeData, setChequeData] = useState<ChequeDetailResponse['data'] | null>(null);
  const [signatures, setSignatures] = useState<SignatureItem[]>([]);
  const [isLoadingSignatures, setIsLoadingSignatures] = useState(false);
  
  // UI State
  const [currentSigIndex, setCurrentSigIndex] = useState(0);
  const [showPhoto, setShowPhoto] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isSandboxOpen, setIsSandboxOpen] = useState(false);
  const [zoomImageSrc, setZoomImageSrc] = useState<string | null>(null);
  const [verificationDecision, setVerificationDecision] = useState<'corresponds' | 'mismatch' | null>(null);
  
  // Collapsible Sidebar & Validation states
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [accountMandate, setAccountMandate] = useState('');
  const [validationStatus, setValidationStatus] = useState<'pending' | 'submitting' | 'corresponds' | 'invalid' | 'error'>('pending');
  const [validationMessage, setValidationMessage] = useState('');

  // AI Verification State
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationMatrix, setVerificationMatrix] = useState<Record<number, Record<string, SignatureVerificationResponse>>>({});
  const [isAiModuleActive, setIsAiModuleActive] = useState(false);
  const [roiZones, setRoiZones] = useState<Array<{id: string, x: number, y: number, w: number, h: number}>>([]);
  const [isCalibrating, setIsCalibrating] = useState(true); // Default to true to show automated nudge area

  // Synced Zoom & Lens States
  const [isChequeZoomed, setIsChequeZoomed] = useState(false);
  const [chequeCoords, setChequeCoords] = useState({ x: 0, y: 0 });
  const [isLensModeActive, setIsLensModeActive] = useState(false);
  const [lensData, setLensData] = useState<{
    isHovering: boolean;
    xPercent: number;
    yPercent: number;
    clientX: number;
    clientY: number;
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  // Clock Update
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleMandateValidation = async (chk: 'Y' | 'N') => {
    if (!chequeData || !chequeNumber) return;
    setValidationStatus('submitting');
    setValidationMessage('');
    try {
      const payerBban = chequeData.payerBban || '';
      const currency = chequeData.transCurrency || '010';
      const activeRelationNo = signatures[currentSigIndex]?.relation_no || signatures[0]?.relation_no || '';

      console.log(`[Validation API] Sending: chequeNo=${chequeNumber}, acctNo=${payerBban}, currency=${currency}, chk=${chk}, relationNo=${activeRelationNo}`);
      const response = await verifyChequeMandate(chequeNumber, payerBban, currency, chk, activeRelationNo);
      
      console.log(`[Validation API] Response:`, response);
      if (response.success) {
        setValidationStatus(chk === 'N' ? 'corresponds' : 'invalid');
        setValidationMessage(response.output_msg || `Mandate validated successfully (Code: ${response.output_code})`);
      } else {
        setValidationStatus('error');
        setValidationMessage(response.output_msg || 'Validation returned failure status.');
      }
    } catch (err) {
      const uiError = handleSystemError(err, 'ViewCheques.handleMandateValidation');
      setValidationStatus('error');
      setValidationMessage(`${uiError.alert} ${uiError.action}`);
    }
  };

  const fetchChequeData = useCallback(async () => {
    if (!chequeNumber) {
      setLoading(false);
      setError('Instrument ID missing.');
      return;
    }
    
    setLoading(true);
    setIsLoadingSignatures(true);
    setError(null);
    
    try {
      const result = await getChequeDetails(chequeNumber);
      if (result.status === 'success' && result.data) {
        setChequeData(result.data);
        
        // PIVOT: Strictly use Payer BBAN for signature protocol
        const testAccount = result.data.payerBban || "00111005972201"; 
        console.log(`[Protocol] Initiating signature fetch for account: ${testAccount}`);
        
        try {
            const sigData = await getAccountSignatures(testAccount);
            console.log("[Protocol] Raw Signature Data received:", sigData);
            
            if (sigData) {
               setAccountMandate(sigData.account_mandate || 'SOLE SIGNATORY');
            }

            if (sigData && sigData.enq_details) {
               const mappedSigs = sigData.enq_details.map(item => ({
                   photo: item.pix ? `data:image/jpeg;base64,${item.pix}` : '',
                   signature: item.signature ? `data:image/jpeg;base64,${item.signature}` : '',
                   relation_no: item.relation_no,
                   limit: item.limit,
                   sign_category: item.sign_category?.trim()
               })).filter(s => s.photo || s.signature);
               
               console.log(`[Protocol] Mapped ${mappedSigs.length} signatures.`);
               setSignatures(mappedSigs);
               
               // Auto-generate distinct zones for each signature so they don't compare the same region
               if (mappedSigs.length > 0) {
                   const autoZones = [];
                   for(let i=0; i<Math.min(mappedSigs.length, 4); i++) {
                       autoZones.push({
                           id: `zone_${i+1}`,
                           x: Math.max(0, 60 - (i * 26)), // Stagger them horizontally (e.g. 60%, 34%, etc)
                           y: 55,
                           w: 25,
                           h: 25
                       });
                   }
                   setRoiZones(autoZones);
               }
            } else {
               console.warn("[Protocol] No enq_details found in response.");
               // Fallback zone
               setRoiZones([{ id: 'zone_1', x: 60, y: 55, w: 25, h: 25 }]);
            }
        } catch (fetchErr) {
            handleSystemError(fetchErr, 'ViewCheques.fetchChequeData.getSignatures');
        } finally {
            setIsLoadingSignatures(false);
        }
      } else {
        setError(result.message || 'Failure to retrieve instrument metadata');
        setIsLoadingSignatures(false);
      }
    } catch (err) {
      const uiError = handleSystemError(err, 'ViewCheques.fetchChequeData');
      setError(`${uiError.alert} ${uiError.action}`);
      setIsLoadingSignatures(false);
    } finally {
      setLoading(false);
    }
  }, [chequeNumber]);

  useEffect(() => {
    fetchChequeData();
  }, [fetchChequeData]);

  const handleAiVerify = useCallback(async () => {
    if (!chequeData?.frontImage || signatures.length === 0 || roiZones.length === 0) return;
    
    setIsVerifying(true);
    
    try {
        const newResults: Record<number, Record<string, SignatureVerificationResponse>> = {...verificationMatrix};
        
        // Parallel Audit Strategy: Every Mandate vs Every Zone
        for (let mIdx = 0; mIdx < signatures.length; mIdx++) {
            if (!newResults[mIdx]) newResults[mIdx] = {};
            
            for (const zone of roiZones) {
                const result = await verifySignature(
                    chequeData.frontImage, 
                    signatures[mIdx].signature,
                    zone
                );
                
                if (result) {
                    newResults[mIdx][zone.id] = result;
                }
            }
        }
        
        setVerificationMatrix(newResults);
    } catch (err) {
        handleSystemError(err, 'ViewCheques.handleAiVerify');
    } finally {
        setIsVerifying(false);
    }
  }, [chequeData, signatures, roiZones, verificationMatrix]);

  // Auto-run verification once data is loaded
  useEffect(() => {
    if (chequeData?.frontImage && signatures.length > 0 && roiZones.length > 0 && Object.keys(verificationMatrix).length === 0 && !isVerifying) {
        handleAiVerify();
    }
  }, [chequeData, signatures, roiZones, verificationMatrix, isVerifying, handleAiVerify]);

  const clearAuditHistory = () => {
    setVerificationMatrix({});
    // Reset to auto-generated zones
    if (signatures.length > 0) {
        const autoZones = [];
        for(let i=0; i<Math.min(signatures.length, 4); i++) {
            autoZones.push({ id: `zone_${i+1}`, x: Math.max(0, 60 - (i * 26)), y: 55, w: 25, h: 25 });
        }
        setRoiZones(autoZones);
    } else {
        setRoiZones([{ id: 'zone_1', x: 60, y: 55, w: 25, h: 25 }]);
    }
  };

  const addRoiZone = () => {
    if (roiZones.length >= 4) return; // Limit to 4 zones to keep UI clean
    const newId = `zone_${roiZones.length + 1}`;
    setRoiZones([...roiZones, { id: newId, x: 10, y: 10, w: 20, h: 15 }]);
  };

  const handlePrint = () => window.print();

  const nextSignature = () => {
    setCurrentSigIndex((prev) => (prev + 1) % signatures.length);
  };

  const prevSignature = () => {
    setCurrentSigIndex((prev) => (prev - 1 + signatures.length) % signatures.length);
  };

  const formatGHS = (amountStr: string | undefined) => {
      if (!amountStr) return 'GH₵ 0.00';
      const num = parseFloat(amountStr.replace(/[^0-9.-]+/g, ""));
      return isNaN(num) ? amountStr : new Intl.NumberFormat('en-GH', { 
          style: 'currency', 
          currency: 'GHS'
      }).format(num);
  };

  // Timestamp Formatter: Tue, APR 14 2026 18:42
  const formatTimestamp = (date: Date) => {
    const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
    const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    const day = date.toLocaleDateString('en-US', { day: '2-digit' });
    const year = date.getFullYear();
    const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    return `${weekday}, ${month} ${day} ${year} ${time}`;
  };

  if (loading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center font-urbanist text-primary">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  if (error || !chequeData) {
    return (
      <div className="h-screen bg-background flex flex-col items-center justify-center p-8 font-urbanist text-center">
          <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
          <h2 className="text-2xl font-bold mb-2 text-primary">Access Protocol Error</h2>
          <p className="text-muted-foreground text-sm max-w-sm mb-8">{error}</p>
          <Button onClick={fetchChequeData} className="rounded-full px-8 bg-primary text-white">Retry Hub Protocol</Button>
      </div>
    );
  }

  const chequeAmountValue = parseFloat((chequeData.chequeAmount || '0').replace(/[^0-9.-]+/g, '')) || 0;

  return (
    <>
      <div id="main-app-container" className="h-screen flex flex-row bg-background text-foreground font-urbanist antialiased overflow-hidden selection:bg-primary/10">
      
      {/* 1. PREMIUM SIDEBAR (Collapsible with smooth transition) */}
      <aside className={`h-screen bg-sidebar border-r border-sidebar-border flex flex-col flex-shrink-0 z-50 rounded-tr-[1.5rem] rounded-br-[1.5rem] shadow-xl overflow-hidden transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'w-0 p-0 border-0' : 'w-[280px] lg:w-[320px] p-4'}`}>
          <div className={`flex items-center justify-between mt-2 px-1 mb-6 flex-shrink-0 transition-opacity duration-200 ${isSidebarCollapsed ? 'opacity-0' : 'opacity-100'}`}>
              <div className="space-y-0.5">
                  <h2 className="text-lg lg:text-xl font-bold tracking-tight text-sidebar-foreground">Verification</h2>
                  <p className="text-sidebar-foreground/75 text-[10px] uppercase font-black tracking-tighter">Cheque Metadata Core</p>
              </div>
              <div className="flex items-center gap-2">
                  <div className="flex flex-col items-end">
                      <span className="text-[9px] font-black uppercase tracking-widest text-sidebar-foreground/70 leading-none">Cheque No</span>
                      <span className="text-[14px] font-bold text-primary leading-none mt-1 tracking-tight">#{chequeNumber}</span>
                  </div>
                  <button 
                      onClick={() => setIsSidebarCollapsed(true)} 
                      className="p-1 rounded-lg hover:bg-sidebar-accent/30 text-sidebar-foreground/60 hover:text-sidebar-foreground transition-all"
                      title="Collapse sidebar"
                  >
                      <X className="w-4 h-4" />
                  </button>
              </div>
          </div>

          {/* DENSITY FIX: Using min-h-0 and stealth scroll to prevent clipping context */}
          <div className={`flex-1 space-y-4 overflow-y-auto scrollbar-hide min-h-0 transition-opacity duration-200 ${isSidebarCollapsed ? 'opacity-0' : 'opacity-100'}`}>
              <SidebarSection label="Transaction Attributes">
                  <SidebarTile label="Inst. Code" value={chequeData.instrumentCode} icon={Hash} />
                  <SidebarTile label="Value Amount" value={formatGHS(chequeData.chequeAmount)} highlight icon={Banknote} />
                  <SidebarTile label="Status" value={chequeData.chequeStatus} color="primary" icon={CheckCircle2} />
                  <SidebarTile label="Clearing" value={chequeData.clearingDate} icon={Calendar} />
                  <SidebarTile label="Currency" value={chequeData.transCurrency || '---'} icon={Hash} />
                  <SidebarTile label="Legacy Reason" value={chequeData.rejectionReason || 'None'} color={chequeData.rejectionReason ? 'red' : ''} icon={Info} span2 />
              </SidebarSection>

              <SidebarSection label="Entity Information">
                  <SidebarTile label="Payer (Drawer)" value={chequeData.payerName} highlight wrap icon={User} span2 />
                  <SidebarTile label="Payer BBAN" value={chequeData.payerBban} mono icon={CreditCard} span2 />
                  <SidebarTile label="Beneficiary" value={chequeData.beneficiaryName} highlight wrap icon={ Landmark} span2 />
                  <SidebarTile label="Beneficiary BBAN" value={chequeData.beneficiaryBban} mono icon={CreditCard} span2 />
              </SidebarSection>

              <SidebarSection label="Audit Integrity">
                  <SidebarTile label="Remitting" value={chequeData.remittingParticipant} wrap icon={Building} />
                  <SidebarTile label="Recipient" value={chequeData.recepientParticipant} wrap icon={Building} />
              </SidebarSection>
          </div>

          {/* SIDEBAR FOOTER: Show clearingDate from DB instead of live clock */}
          <div className={`mt-auto pt-4 border-t border-sidebar-border flex items-center justify-between flex-shrink-0 transition-opacity duration-200 ${isSidebarCollapsed ? 'opacity-0' : 'opacity-100'}`}>
              <div className="flex items-center gap-2">
                  <div className="relative flex h-2 w-2">
                      <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></div>
                      <div className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></div>
                  </div>
                  <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">Online</span>
              </div>
              <span className="text-[10px] font-bold text-primary uppercase tracking-tight font-mono">
                  {chequeData.clearingDate || formatTimestamp(currentTime)}
              </span>
          </div>
      </aside>

      {/* 2. MAIN RHS WORKSPACE (Vertical Scroll Enabled) */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        
        {/* TOP BAR: Hamburger + Validation Controls */}
        <div className="flex items-center justify-between px-4 lg:px-6 py-3 border-b border-border bg-background/95 backdrop-blur-sm flex-shrink-0 print:hidden z-30">
            {/* Hamburger to open sidebar */}
            <TooltipProvider delayDuration={200}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button 
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
                        className="p-2 rounded-xl border border-border hover:bg-accent/20 text-foreground/70 hover:text-foreground transition-all group"
                    >
                        <Menu className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-[10px] font-bold">
                    {isSidebarCollapsed ? 'Open sidebar' : 'Close sidebar'}
                </TooltipContent>
            </Tooltip>
            </TooltipProvider>

            {/* CENTRAL CHEQUE NUMBER DISPLAY */}
            <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <span className="text-sm md:text-base font-bold text-foreground">Cheque #{chequeNumber}</span>
            </div>

            {/* RIGHT SIDE VALIDATION CONTROLS */}
            <div className="flex items-center gap-3">
                {validationStatus === 'pending' && signatures.length > 0 && (
                    <TooltipProvider delayDuration={200}>
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-full p-1 shadow-sm">
                        <button 
                            onClick={() => setVerificationDecision('corresponds')}
                            className={`h-7 px-3.5 rounded-full text-xs font-bold transition-all ${
                                verificationDecision === 'corresponds' 
                                    ? 'bg-emerald-600 text-white shadow-sm' 
                                    : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                        >
                            Corresponds
                        </button>
                        <button 
                            onClick={() => setVerificationDecision('mismatch')}
                            className={`h-7 px-3.5 rounded-full text-xs font-bold transition-all ${
                                verificationDecision === 'mismatch' 
                                    ? 'bg-slate-800 text-white shadow-sm' 
                                    : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            Mismatch
                        </button>
                        {verificationDecision && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={() => handleMandateValidation(verificationDecision === 'corresponds' ? 'N' : 'Y')}
                                        className="h-7 w-7 rounded-full bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center transition-all shadow-md ml-0.5"
                                    >
                                        <Check className="w-4 h-4" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="text-[10px] font-bold">
                                    Submit verification
                                </TooltipContent>
                            </Tooltip>
                        )}
                    </div>
                    </TooltipProvider>
                )}
                {validationStatus === 'submitting' && (
                    <div className="flex items-center gap-2 text-primary bg-slate-50 border border-slate-200/80 rounded-full px-3 py-1">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span className="text-xs font-bold uppercase tracking-wider">Validating...</span>
                    </div>
                )}
                {validationStatus === 'corresponds' && (
                    <div className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-100 border border-slate-200 rounded-full">
                        <Check className="w-4 h-4 text-slate-700" />
                        <span className="text-xs font-bold text-slate-700">{validationMessage || 'Corresponds'}</span>
                        <button onClick={() => { setValidationStatus('pending'); setVerificationDecision(null); }} className="ml-1 text-slate-400 hover:text-slate-600"><X className="w-3.5 h-3.5" /></button>
                    </div>
                )}
                {validationStatus === 'invalid' && (
                    <div className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-100 border border-slate-200 rounded-full">
                        <AlertTriangle className="w-4 h-4 text-slate-700" />
                        <span className="text-xs font-bold text-slate-700">{validationMessage || 'Mismatch'}</span>
                        <button onClick={() => { setValidationStatus('pending'); setVerificationDecision(null); }} className="ml-1 text-slate-400 hover:text-slate-600"><X className="w-3.5 h-3.5" /></button>
                    </div>
                )}
                {validationStatus === 'error' && (
                    <div className="flex items-center gap-2 px-3.5 py-1.5 bg-amber-50 border border-amber-200 rounded-full">
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                        <span className="text-xs font-bold text-amber-700">{validationMessage || 'Error'}</span>
                        <button onClick={() => { setValidationStatus('pending'); setVerificationDecision(null); }} className="ml-1 text-amber-400 hover:text-amber-600"><X className="w-3.5 h-3.5" /></button>
                    </div>
                )}
            </div>
        </div>

        {/* PRINT ONLY HEADER */}
        <div className="hidden print:block w-full border-b-2 border-primary pb-6 mb-8">
            <div className="flex justify-between items-center">
                <img src="/legacy-imaging/images/logo.png" className="h-8 object-contain" alt="Bank Logo" />
                <div className="text-right">
                    <h1 className="text-xl font-black uppercase tracking-widest text-primary">Verification Audit Report</h1>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mt-1 tracking-tighter">Confidential Banking Document // #{chequeNumber}</p>
                </div>
            </div>
            <div className="mt-6 grid grid-cols-4 gap-4 text-[10px]">
                <div className="flex flex-col"><span className="font-bold uppercase text-muted-foreground">Officer</span><span>Administrator</span></div>
                <div className="flex flex-col"><span className="font-bold uppercase text-muted-foreground">Session Hub</span><span>Hub ID: CL-99</span></div>
                <div className="flex flex-col"><span className="font-bold uppercase text-muted-foreground">Report Date</span><span>{formatTimestamp(currentTime)}</span></div>
                <div className="flex flex-col"><span className="font-bold uppercase text-muted-foreground">Instrument</span><span>Cheque Component Scan</span></div>
            </div>
        </div>

        {/* ANALYSIS AREA (Scrollable, Responsive Grid — side-by-side on md+, stacked on mobile) */}
        <main className="flex-1 grid grid-cols-1 md:grid-cols-[1fr,380px] xl:grid-cols-[1fr,420px] gap-4 p-4 lg:p-6 overflow-y-auto bg-background scrollbar-hide">
            
            {/* COLUMN 1: STACKED INSTRUMENT SCAN CLUSTER */}
            <div className="flex flex-col gap-3 md:min-h-0">
                <div className="flex items-center gap-2 px-1 flex-shrink-0">
                    <ImageIcon className="w-4 h-4 text-primary" />
                    <h3 className="text-xs md:text-sm font-bold uppercase tracking-wider text-primary">Cheque Face</h3>
                </div>
                
                <div className="flex flex-col gap-3">
                    <ScanProofCard 
                        label="Cheque Face: Front Component" 
                        src={chequeData.frontImage} 
                        zones={roiZones}
                        onZonesChange={setRoiZones}
                        isCalibrating={isCalibrating}
                        onToggleCalibration={() => setIsCalibrating(!isCalibrating)}
                        onAddZone={addRoiZone}
                        onClear={clearAuditHistory}
                        onZoom={setZoomImageSrc}
                        isZoomed={isChequeZoomed}
                        onZoomChange={setIsChequeZoomed}
                        coords={chequeCoords}
                        onCoordsChange={setChequeCoords}
                        isLensModeActive={isLensModeActive}
                        onLensToggle={() => {
                            setIsLensModeActive(!isLensModeActive);
                            if (!isLensModeActive) {
                                // Turn off standard zoom when lens activates
                                setIsChequeZoomed(false);
                                setChequeCoords({ x: 0, y: 0 });
                            }
                        }}
                        lensData={lensData}
                        onLensDataChange={setLensData}
                    />
                    <ScanProofCard 
                        label="Cheque Face: Back Component" 
                        src={chequeData.backImage} 
                        zones={[]} 
                        onZonesChange={() => {}} 
                        isCalibrating={false} 
                        onToggleCalibration={() => {}}
                        onAddZone={() => {}}
                        onClear={() => {}}
                        onZoom={setZoomImageSrc}
                    />
                </div>
            </div>

            {/* COLUMN 2: MANDATE VERIFICATION AREA */}
            <div className="flex flex-col gap-3 md:min-h-0">
                <div className="flex items-center justify-between px-1 flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-primary" />
                        <h3 className="text-xs md:text-sm font-bold uppercase tracking-wider text-primary">Mandate Verification</h3>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        {accountMandate && (
                            <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/5 px-2.5 py-0.5 rounded-full border border-primary/10">
                                {accountMandate}
                            </span>
                        )}
                        <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                            {signatures.length} {signatures.length === 1 ? 'Mandate' : 'Mandates'}
                        </span>
                    </div>
                </div>
                <div className="flex-1 flex flex-col min-h-fit md:min-h-0 md:overflow-hidden">
                    <div className="flex-1 overflow-y-auto space-y-4 scrollbar-hide print:p-0">
                        {isLoadingSignatures ? (
                            <div className="opacity-30 py-20 flex flex-col items-center gap-2 bg-white border border-border rounded-xl">
                                <Shield className="w-12 h-12 text-muted-foreground animate-pulse" />
                                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Loading Mandate Signatures...</span>
                            </div>
                        ) : signatures.length > 0 ? (
                            signatures.map((sig, index) => (
                                <SignatoryCard 
                                    key={index} 
                                    sig={sig} 
                                    index={index} 
                                    chequeAmountValue={chequeAmountValue} 
                                    showRelation={signatures.length > 1 || accountMandate.toUpperCase() !== 'SOLE SIGNATORY'}
                                    onZoom={setZoomImageSrc}
                                    isActive={index === currentSigIndex}
                                    onClick={() => setCurrentSigIndex(index)}
                                    syncedZoom={isChequeZoomed}
                                    syncedCoords={chequeCoords}
                                />
                            ))
                        ) : (
                            <div className="opacity-40 py-20 flex flex-col items-center gap-2 text-center px-4 bg-white border border-border rounded-xl">
                                <AlertTriangle className="w-12 h-12 text-amber-500" />
                                <span className="text-xs font-bold uppercase tracking-wider text-amber-700">No Mandate Signatures Found</span>
                                <p className="text-xs text-muted-foreground max-w-[200px] mt-1">This account does not have any active signatures registered in the database.</p>
                            </div>
                        )}

                        {/* 
                          FUTURE UPGRADE COMPARISON COMPONENTS (COMMENTED FOR NOW)
                          
                          {signatures.length > 0 && (
                            <div className="space-y-4 pt-4 border-t border-border">
                              <Button 
                                  onClick={() => setShowPhoto(!showPhoto)}
                                  disabled={signatures.length === 0}
                                  className={`w-full h-9 rounded-full uppercase font-black text-[9px] tracking-widest transition-all ${showPhoto ? 'bg-primary text-white shadow-soft' : 'bg-white text-primary border border-primary hover:bg-primary/5 shadow-sm'}`}
                              >
                                  {showPhoto ? 'Return to Signature' : 'View Identity Portrait'}
                              </Button>

                              <div className="pt-4 border-t border-border">
                                  <div className="flex items-center justify-between mb-3">
                                      <div className="flex items-center gap-2">
                                          <Shield className="w-3 h-3 text-primary" />
                                          <span className="text-[10px] font-bold uppercase tracking-widest text-primary">AI Matrix Analysis</span>
                                      </div>
                                      <Button 
                                          onClick={clearAuditHistory}
                                          variant="ghost" 
                                          className="h-5 px-2 text-[7px] font-black uppercase text-muted-foreground hover:text-red-500 transition-colors"
                                      >
                                          Clear Results
                                      </Button>
                                  </div>

                                  <Button 
                                      onClick={handleAiVerify}
                                      disabled={isVerifying || signatures.length === 0 || roiZones.length === 0}
                                      className="w-full h-10 rounded-xl bg-primary text-white font-bold text-[10px] uppercase tracking-[0.15em] shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 group mb-4"
                                  >
                                      {isVerifying ? (
                                          <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                          <>
                                              <Eye className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                                              {roiZones.length > 1 ? `Run Full Matrix Audit` : `Verify Instrument Ink`}
                                          </>
                                      )}
                                  </Button>

                                  {Object.keys(verificationMatrix).length > 0 && (
                                      <div className="space-y-3">
                                          <div className="rounded-xl border border-border overflow-hidden bg-card shadow-sm">
                                              <table className="w-full text-left border-collapse">
                                                  <thead>
                                                      <tr className="bg-accent/10 border-b border-border">
                                                          <th className="p-2 text-[7px] font-black uppercase text-muted-foreground tracking-widest">Target</th>
                                                          {roiZones.map((z, idx) => (
                                                              <th key={z.id} className="p-2 text-[7px] font-black uppercase text-muted-foreground tracking-widest text-center">
                                                                  Zone {String.fromCharCode(65 + idx)}
                                                              </th>
                                                          ))}
                                                      </tr>
                                                  </thead>
                                                  <tbody>
                                                      {signatures.map((sig, sIdx) => (
                                                          <tr key={sIdx} className="border-b border-border/50 last:border-0 hover:bg-accent/5 transition-colors">
                                                              <td className="p-2">
                                                                  <div className="flex flex-col">
                                                                      <span className="text-[8px] font-bold text-foreground">Mandate {sIdx + 1}</span>
                                                                      <span className="text-[6px] text-muted-foreground uppercase">{sig.rank}</span>
                                                                  </div>
                                                              </td>
                                                              {roiZones.map((z) => {
                                                                  const result = verificationMatrix[sIdx]?.[z.id];
                                                                  return (
                                                                      <td key={z.id} className="p-2 text-center">
                                                                          {result ? (
                                                                              <div className="relative group/cell flex items-center justify-center">
                                                                                  <span 
                                                                                      title={`${result.score}% similarity`}
                                                                                      className={`text-[10px] font-black cursor-default select-none px-2 py-0.5 rounded-full ${
                                                                                          result.is_match 
                                                                                              ? 'bg-green-500/10 text-green-600 border border-green-500/20' 
                                                                                              : 'bg-red-500/10 text-red-600 border border-red-500/20'
                                                                                      }`}
                                                                                  >
                                                                                      {result.is_match ? 'Yes' : 'No'}
                                                                                  </span>
                                                                                  <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 opacity-0 group-hover/cell:opacity-100 transition-opacity pointer-events-none z-50">
                                                                                      <div className="bg-foreground text-background text-[9px] font-black px-2 py-1 rounded-lg whitespace-nowrap shadow-xl">
                                                                                          {result.score}% similarity
                                                                                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-foreground" />
                                                                                      </div>
                                                                                  </div>
                                                                              </div>
                                                                          ) : (
                                                                              <span className="text-[10px] text-muted-foreground/20 font-light italic">--</span>
                                                                          )}
                                                                      </td>
                                                                  );
                                                              })}
                                                          </tr>
                                                      ))}
                                                  </tbody>
                                              </table>
                                          </div>

                                          <div className="p-2.5 rounded-xl bg-accent/5 border border-border border-dashed">
                                              <div className="flex items-center gap-2 mb-1">
                                                  <Info className="w-3 h-3 text-muted-foreground" />
                                                  <span className="text-[8px] font-black uppercase text-muted-foreground tracking-[0.1em]">Audit Conclusion</span>
                                              </div>
                                              <p className="text-[8px] text-muted-foreground leading-tight font-medium">
                                                  {Object.values(verificationMatrix).some(m => Object.values(m).some(r => r.is_match))
                                                      ? "Cross-verification successful. At least one structural match confirmed at the 85% forensic threshold."
                                                      : "No structural matches found. All zones fell below the forensic threshold. Manual secondary audit required."}
                                              </p>
                                          </div>
                                      </div>
                                  )}
                              </div>
                            </div>
                          )}
                        */}
                    </div>
                </div>
            </div>

            {/* PRINT ONLY SIGNATURE BLOCK */}
            <div className="hidden print:block col-span-2 mt-12 border-t pt-8">
                <div className="grid grid-cols-2 gap-20">
                    <div className="border-b border-dashed flex flex-col h-24 justify-end">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground pb-1">Verifying Officer Signature</span>
                    </div>
                    <div className="border-b border-dashed flex flex-col h-24 justify-end">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground pb-1">Branch Manager Authorization</span>
                    </div>
                </div>
            </div>
        </main>

        {/* FLOATING ACTION BUTTONS */}
        <div className="fixed bottom-8 right-8 flex flex-col gap-3 z-50 print:hidden">
            {/* FUTURE SANDBOX UPGRADE (COMMENTED FOR NOW)
            <Button 
                onClick={() => setIsSandboxOpen(true)} 
                className="h-12 w-12 rounded-full bg-slate-800 text-white shadow-xl hover:bg-slate-900 transition-all hover:scale-110 active:scale-95 group relative"
                size="icon"
                title="AI Sandbox Test"
            >
                <Beaker className="w-5 h-5" />
                <span className="absolute right-full mr-3 px-2 py-1 bg-slate-800 text-[8px] font-black uppercase tracking-widest text-white rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    Forensic Sandbox
                </span>
            </Button>
            */}

            {/* PRINT BUTTON */}
            <Button 
                onClick={handlePrint} 
                className="h-12 w-12 rounded-full gradient-primary shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] transition-all group hover:scale-110 active:scale-95 relative"
                size="icon"
            >
                <Printer className="w-5 h-5 text-white" />
                <span className="absolute right-full mr-3 px-2 py-1 bg-primary text-[8px] font-black uppercase tracking-widest text-white rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    Print Instrument
                </span>
            </Button>
        </div>

        {/* FUTURE SANDBOX MODAL (COMMENTED FOR NOW)
        <SandboxVerifyModal 
            isOpen={isSandboxOpen} 
            onClose={() => setIsSandboxOpen(false)} 
        />
        */}

        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
              @page { size: portrait; margin: 1cm; }
              #main-app-container {
                  display: none !important;
              }
              body { 
                  background: white !important; 
                  color: black !important; 
                  font-family: sans-serif !important; 
                  height: auto !important; 
                  overflow: visible !important; 
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
              }
              #legacy-print-template {
                  display: block !important;
                  background: white !important;
                  color: black !important;
              }
              #legacy-print-template table {
                  display: table !important;
                  width: 100% !important;
              }
              #legacy-print-template tr {
                  display: table-row !important;
              }
              #legacy-print-template td {
                  display: table-cell !important;
              }
              #legacy-print-template img {
                  display: block !important;
                  max-width: 100% !important;
                  height: auto !important;
              }
          }
          .scrollbar-hide::-webkit-scrollbar { display: none; }
          .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
          
          .perspective-1000 {
              perspective: 1000px;
          }
          .transform-style-3d {
              transform-style: preserve-3d;
          }
          .backface-hidden {
              backface-visibility: hidden;
              -webkit-backface-visibility: hidden;
          }
          .rotate-y-180 {
              transform: rotateY(180deg);
          }
        `}} />

        {/* FLOATING GLASSMORPHIC LENS SIDE-BY-SIDE COMPARISON */}
        {isLensModeActive && lensData && lensData.isHovering && (
          <div 
            className="fixed pointer-events-none z-[9999] backdrop-blur-md bg-white/95 border border-slate-200/80 shadow-2xl rounded-2xl p-3 flex flex-row gap-3 transition-opacity duration-150"
            style={{
              left: `${lensData.clientX + 380 > window.innerWidth ? lensData.clientX - 380 : lensData.clientX + 20}px`,
              top: `${lensData.clientY + 220 > window.innerHeight ? lensData.clientY - 220 : lensData.clientY + 20}px`,
              width: '360px',
              height: '200px'
            }}
          >
            {/* Left Column: Cheque magnified Lens */}
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-[10px] font-bold uppercase text-primary tracking-wider mb-1">Cheque (Lens)</span>
              <div className="flex-1 bg-white border border-slate-200 rounded-lg overflow-hidden relative flex items-center justify-center">
                <img 
                  src={chequeData.frontImage} 
                  alt="Cheque Magnified" 
                  style={{
                    position: 'absolute',
                    width: `${lensData.width * 3}px`,
                    height: `${lensData.height * 3}px`,
                    left: `${-lensData.x * 3 + 160 / 2}px`,
                    top: `${-lensData.y * 3 + 160 / 2}px`,
                    transform: 'none',
                    filter: 'url(#sharpen-filter) contrast(1.8) grayscale(100%) brightness(1.05)',
                    maxWidth: 'none',
                    maxHeight: 'none',
                  }}
                />
              </div>
            </div>
            
            {/* Right Column: Current Mandate specimen */}
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-[10px] font-bold uppercase text-primary tracking-wider mb-1">Mandate Specimen</span>
              <div className="flex-1 bg-white border border-slate-200 rounded-lg overflow-hidden relative flex items-center justify-center p-1">
                {signatures[currentSigIndex]?.signature ? (
                  <img 
                    src={signatures[currentSigIndex].signature} 
                    alt="Mandate Signature Specimen" 
                    className="w-full h-full object-contain filter contrast-125 grayscale"
                  />
                ) : (
                  <div className="text-[10px] text-muted-foreground/50 italic text-center px-2">No active specimen</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MATH SHARPENING SVG FILTER DEFINITION */}
        <svg style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}>
          <defs>
            <filter id="sharpen-filter">
              <feConvolveMatrix order="3" kernelMatrix="0 -1 0 -1 5 -1 0 -1 0" />
            </filter>
          </defs>
        </svg>

        {/* ZOOM FULLSCREEN OVERLAY MODAL */}
        <AnimatePresence>
          {zoomImageSrc && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setZoomImageSrc(null)}
              className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center p-4 cursor-zoom-out"
            >
              <button 
                onClick={() => setZoomImageSrc(null)}
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"
              >
                <X className="w-6 h-6" />
              </button>
              <motion.img 
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
                src={zoomImageSrc} 
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl select-none"
                alt="Zoomed Component"
                onClick={(e) => e.stopPropagation()}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
      
      {/* 4. LEGACY PRINT TEMPLATE MAPPING FROM @imaging/view_cheques.php */}
      <div id="legacy-print-template" className="hidden print:block w-full text-black font-sans p-6 bg-white">
          <div className="flex justify-between items-center mb-6 border-b pb-4 border-slate-300">
              <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 text-primary flex items-center justify-center rounded-lg">
                      <Landmark className="w-6 h-6 text-primary" />
                  </div>
                  {/* <div>
                      <h2 className="text-base font-black uppercase tracking-wider text-black leading-none">SLCB</h2>
                      <p className="text-[8px] text-slate-500 uppercase tracking-widest font-black mt-1 leading-none">Sierra Leone Commercial Bank</p>
                  </div> */}
              </div>
              <div className="text-right text-[10px] space-y-0.5 font-bold text-slate-700">
                  <p>Displayed On: <span>{new Date().toLocaleDateString('en-GB')}</span></p>
                  <p>Time: <span>{new Date().toLocaleTimeString('en-GB')}</span></p>
                  <p>User: <span>ADMIN</span></p>
              </div>
          </div>

          <div className="text-center mb-6">
              <h1 className="text-xl font-black uppercase tracking-widest text-black border-b border-slate-300 pb-1.5 inline-block">Cheque Detail Report</h1>
          </div>

          <div className="border border-slate-300 rounded-lg p-4 mb-6 bg-slate-50/50">
              <table className="w-full text-xs border-collapse">
                  <tbody>
                      <tr className="border-b border-slate-200">
                          <td className="py-2.5 font-bold text-slate-500 w-[20%]">Instrument Code</td>
                          <td className="py-2.5 font-medium w-[30%]">: {chequeData?.instrumentCode || '---'}</td>
                          <td className="py-2.5 font-bold text-slate-500 w-[20%]">Rejection Reason</td>
                          <td className="py-2.5 font-medium w-[30%]">: {chequeData?.rejectionReason || '---'}</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                          <td className="py-2.5 font-bold text-slate-500">Cheque No</td>
                          <td className="py-2.5 font-medium">: {chequeData?.chequeNumber || '---'}</td>
                          <td className="py-2.5 font-bold text-slate-500">Cheque Status</td>
                          <td className="py-2.5 font-medium">: {chequeData?.chequeStatus || '---'}</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                          <td className="py-2.5 font-bold text-slate-500">Payer BBAN</td>
                          <td className="py-2.5 font-medium">: {chequeData?.payerBban || '---'}</td>
                          <td className="py-2.5 font-bold text-slate-500">Payer Name</td>
                          <td className="py-2.5 font-medium">: {chequeData?.payerName || '---'}</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                          <td className="py-2.5 font-bold text-slate-500">Beneficiary BBAN</td>
                          <td className="py-2.5 font-medium">: {chequeData?.beneficiaryBban || '---'}</td>
                          <td className="py-2.5 font-bold text-slate-500">Beneficiary Name</td>
                          <td className="py-2.5 font-medium">: {chequeData?.beneficiaryName || '---'}</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                          <td className="py-2.5 font-bold text-slate-500">Cheque Amount</td>
                          <td className="py-2.5 font-medium">: SLE {chequeData?.chequeAmount || '---'}</td>
                          <td className="py-2.5 font-bold text-slate-500">Clearing Date</td>
                          <td className="py-2.5 font-medium">: {chequeData?.postingDate || '---'}</td>
                      </tr>
                      <tr>
                          <td className="py-2.5 font-bold text-slate-500">Remitting Participant</td>
                          <td className="py-2.5 font-medium">: {chequeData?.remittingParticipant || '---'}</td>
                          <td className="py-2.5 font-bold text-slate-500">Recipient Participant</td>
                          <td className="py-2.5 font-medium">: {chequeData?.recepientParticipant || '---'}</td>
                      </tr>
                  </tbody>
              </table>
          </div>

          <div className="space-y-6">
              {chequeData?.frontImage && (
                  <div className="border border-slate-300 rounded-lg p-2 bg-white">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Cheque Face (Front Scan)</span>
                      <img src={chequeData.frontImage} className="w-full h-auto max-h-[350px] object-contain rounded" alt="Front Scan" />
                  </div>
              )}
              {chequeData?.backImage && (
                  <div className="border border-slate-300 rounded-lg p-2 bg-white page-break-before-always">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Cheque Face (Back Scan)</span>
                      <img src={chequeData.backImage} className="w-full h-auto max-h-[350px] object-contain rounded" alt="Back Scan" />
                  </div>
              )}
          </div>
      </div>
    </>
  );
};

/* --- FLOATING CONSOLE REFINED COMPONENTS --- */

const SidebarSection = ({ label, children }: { label: string, children: React.ReactNode }) => (
    <div className="space-y-1">
        <h4 className="text-[11.5px] font-black uppercase tracking-[0.2em] text-sidebar-foreground/70 border-b border-sidebar-border pb-0.5 mb-0.5">{label}</h4>
        <div className="grid grid-cols-2 gap-0.5">{children}</div>
    </div>
);

const SidebarTile = ({ label, value, highlight, mono, color, wrap, icon: Icon, span2 }: { 
    label: string, 
    value?: string, 
    highlight?: boolean, 
    mono?: boolean, 
    color?: string,
    wrap?: boolean,
    icon: LucideIcon,
    span2?: boolean
}) => (
    <div className={`p-2 rounded-md border border-transparent hover:border-sidebar-border hover:bg-sidebar-accent/20 transition-all flex items-start gap-1.5 ${span2 ? 'col-span-2' : ''}`}>
        <div className="mt-0.5 p-1 rounded-md bg-sidebar-background border border-sidebar-border text-primary flex-shrink-0">
            <Icon className="w-4 h-4" />
        </div>
        <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-bold text-sidebar-foreground/75 uppercase tracking-wide leading-none">{label}</span>
            <span className={`
                font-semibold tracking-tight leading-tight mt-0.5
                ${highlight ? 'text-sidebar-foreground' : 'text-sidebar-foreground/80'}
                ${mono ? 'font-mono text-[13px]' : 'text-[12.5px]'}
                ${color === 'red' ? 'text-red-500' : ''}
                ${color === 'primary' ? 'text-primary' : ''}
                ${wrap ? 'whitespace-normal' : 'truncate'}
            `}>
                {value || '---'}
            </span>
        </div>
    </div>
);

const ScanProofCard = ({ 
    label, 
    src, 
    zones, 
    onZonesChange, 
    isCalibrating, 
    onToggleCalibration,
    onAddZone,
    onClear,
    onZoom,
    isZoomed: controlledIsZoomed,
    onZoomChange,
    coords,
    onCoordsChange,
    isLensModeActive,
    onLensToggle,
    lensData,
    onLensDataChange
}: { 
    label: string, 
    src?: string,
    zones: Array<{id: string, x: number, y: number, w: number, h: number}>,
    onZonesChange: (zones: Array<{id: string, x: number, y: number, w: number, h: number}>) => void,
    isCalibrating: boolean,
    onToggleCalibration: () => void,
    onAddZone: () => void,
    onClear: () => void,
    onZoom?: (src: string) => void,
    isZoomed?: boolean,
    onZoomChange?: (zoomed: boolean) => void,
    coords?: { x: number, y: number },
    onCoordsChange?: (coords: { x: number, y: number }) => void,
    isLensModeActive?: boolean,
    onLensToggle?: () => void,
    lensData?: any,
    onLensDataChange?: (data: any) => void
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [localIsZoomed, setLocalIsZoomed] = useState(false);
    const isZoomed = controlledIsZoomed !== undefined ? controlledIsZoomed : localIsZoomed;
    const setIsZoomed = onZoomChange || setLocalIsZoomed;

    const [localCoords, setLocalCoords] = useState({ x: 0, y: 0 });
    const activeCoords = coords !== undefined ? coords : localCoords;
    const setActiveCoords = onCoordsChange || setLocalCoords;

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isLensModeActive) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const xPercent = (x / rect.width) * 100;
        const yPercent = (y / rect.height) * 100;
        
        onLensDataChange?.({
            isHovering: true,
            xPercent,
            yPercent,
            clientX: e.clientX,
            clientY: e.clientY,
            x,
            y,
            width: rect.width,
            height: rect.height
        });
    };

    const handleMouseEnter = () => {
        if (!isLensModeActive) return;
        onLensDataChange?.(prev => prev ? { ...prev, isHovering: true } : {
            isHovering: true,
            xPercent: 0,
            yPercent: 0,
            clientX: 0,
            clientY: 0,
            x: 0,
            y: 0,
            width: 0,
            height: 0
        });
    };

    const handleMouseLeave = () => {
        if (!isLensModeActive) return;
        onLensDataChange?.(null);
    };

    return (
        <TooltipProvider delayDuration={200}>
        <div className="bg-card border border-border rounded-xl overflow-hidden group transition-all hover:bg-accent/5 flex flex-col relative">
            {/* Header with label and action icons */}
            <div className="flex justify-between items-center px-3 py-2 flex-shrink-0">
                <span className="text-[10px] md:text-xs font-bold text-primary uppercase tracking-wider">{label}</span>
                <div className="flex items-center gap-1">
                    {src && (
                        <>
                            {onLensToggle && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onLensToggle(); }}
                                            className={`h-6 w-6 rounded-full flex items-center justify-center transition-all ${
                                                isLensModeActive 
                                                    ? 'bg-primary text-white hover:bg-primary/95 shadow-sm ring-2 ring-primary/20' 
                                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                                            }`}
                                        >
                                            <Eye className="w-3 h-3" />
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom" className="text-[10px] font-bold">
                                        {isLensModeActive ? 'Disable Comparison Lens' : 'Enable Comparison Lens'}
                                    </TooltipContent>
                                </Tooltip>
                            )}

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setIsZoomed(!isZoomed); }}
                                        disabled={isLensModeActive}
                                        className={`h-6 w-6 rounded-full flex items-center justify-center transition-all ${
                                            isLensModeActive
                                                ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400'
                                                : isZoomed 
                                                    ? 'bg-primary text-white hover:bg-primary/95 shadow-sm' 
                                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                                        }`}
                                    >
                                        <ZoomIn className="w-3 h-3" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="text-[10px] font-bold">
                                    {isZoomed ? 'Zoom out' : 'Zoom in'}
                                </TooltipContent>
                            </Tooltip>
                            {onZoom && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); if (src) onZoom(src); }}
                                            className="h-6 w-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all"
                                        >
                                            <Maximize2 className="w-3 h-3" />
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom" className="text-[10px] font-bold">
                                        View fullscreen
                                    </TooltipContent>
                                </Tooltip>
                            )}
                        </>
                    )}
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/20 ml-1"></div>
                </div>
            </div>
            {/* Image container — edge-to-edge, no padding */}
            <div 
                ref={containerRef}
                className="overflow-hidden relative select-none h-[250px] bg-white"
                onMouseMove={handleMouseMove}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {src ? (
                    <ZoomableImage 
                        src={src} 
                        alt={label} 
                        className="w-full h-full object-contain"
                        isZoomed={isZoomed}
                        onZoomChange={setIsZoomed}
                        coords={activeCoords}
                        onCoordsChange={setActiveCoords}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center py-8 gap-1 text-muted-foreground/30 h-full">
                        <ImageIcon className="w-6 h-6 opacity-10" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Signal Locked</span>
                    </div>
                )}

                {/* Reticle for the lens */}
                {isLensModeActive && lensData && lensData.isHovering && (
                    <div 
                        className="absolute pointer-events-none rounded-full border-2 border-primary bg-primary/10 shadow-lg"
                        style={{
                            width: '40px',
                            height: '40px',
                            left: `${lensData.x}px`,
                            top: `${lensData.y}px`,
                            transform: 'translate(-50%, -50%)',
                            zIndex: 10
                        }}
                    />
                )}
            </div>
        </div>
        </TooltipProvider>
    );
};

export default ViewCheques;
