import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, Plus, Trash2, Edit, User, Camera, 
  Signature, Fingerprint, Search, Landmark, 
  ArrowRight, ShieldAlert, Calendar, DollarSign, 
  ChevronRight, Check, CheckCircle2, ChevronLeft, Eye, RefreshCw, AlertCircle, Info, FileText, X,
  PenTool, ScanFace, BadgeCheck, ShieldCheck
} from 'lucide-react';
import { BackgroundPaths } from '@/components/ui/background-paths';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { 
  type StandaloneAccount, 
  type StandaloneRelation,
  type ActivityConfig,
  fetchActivityConfig,
  getImagesByAccount,
  searchImages
} from '@/services/api';

const ACCOUNT_MANDATES = [
  'Sole Signatory',
  'Any two to sign',
  'All Three to sign',
  'Either to Sign',
  'Both to Sign'
];

const SIGNATORY_LEVELS = [
  'Category A',
  'Category B',
  'Category C',
  'Category D'
];

const getInitialsColor = (name: string) => {
  const colors = [
    'bg-blue-50 text-blue-700 border-blue-200',
    'bg-emerald-50 text-emerald-700 border-emerald-200',
    'bg-violet-50 text-violet-700 border-violet-200',
    'bg-amber-50 text-amber-700 border-amber-200',
    'bg-rose-50 text-rose-700 border-rose-200',
    'bg-cyan-50 text-cyan-700 border-cyan-200',
    'bg-indigo-50 text-indigo-700 border-indigo-200'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

type ModuleSpec = {
  icon: typeof PenTool;
  label: string;
  x: number;
  y: number;
  delay: number;
};

const modules: ModuleSpec[] = [
  { icon: PenTool, label: "Signature", x: 4, y: 10, delay: 0 },
  { icon: Fingerprint, label: "Fingerprint", x: 78, y: 6, delay: 0.4 },
  { icon: ScanFace, label: "Face", x: 82, y: 60, delay: 0.8 },
  { icon: BadgeCheck, label: "ID Document", x: 2, y: 62, delay: 1.2 },
  { icon: Camera, label: "Camera", x: 42, y: 84, delay: 1.6 },
];

function CaptureVisual() {
  return (
    <div className="relative mx-auto h-[380px] w-full max-w-[520px] sm:h-[440px] md:h-[520px]">
      {/* Centered glassmorphic circular backdrop */}
      <motion.div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        animate={{ scale: [1, 1.03, 0.97, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      >
        <div
          className="absolute left-1/2 top-1/2 h-[75%] w-[75%] -translate-x-1/2 -translate-y-1/2 backdrop-blur-2xl"
          style={{
            borderRadius: "50%",
            background:
              "linear-gradient(135deg, oklch(1 0 0 / 0.15), oklch(0.95 0.04 240 / 0.1))",
            border: "1px solid oklch(1 0 0 / 0.2)",
            boxShadow: "var(--shadow-glass), var(--shadow-glow)",
          }}
        />
        <div
          className="absolute left-1/2 top-1/2 h-[60%] w-[60%] -translate-x-1/2 -translate-y-1/2 opacity-50"
          style={{
            borderRadius: "50%",
            background:
              "radial-gradient(circle at 30% 30%, oklch(0.72 0.14 235 / 0.4), transparent 70%)",
          }}
        />
      </motion.div>

      {/* Pulsing glow rings */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          aria-hidden
          className="absolute left-1/2 top-1/2 rounded-full border border-primary/20 pointer-events-none"
          style={{ width: 140 + i * 70, height: 140 + i * 70 }}
          initial={{ opacity: 0.4, x: "-50%", y: "-50%", scale: 0.9 }}
          animate={{ opacity: [0.35, 0.1, 0.35], scale: [0.95, 1.05, 0.95] }}
          transition={{
            duration: 5 + i,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.4,
          }}
        />
      ))}

      {/* Central identity subject */}
      <motion.div
        className="absolute left-[36%] top-[36%] z-10 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <div
          className="relative flex h-28 w-28 items-center justify-center rounded-full sm:h-32 sm:w-32 md:h-36 md:w-36"
          style={{
            background:
              "linear-gradient(160deg, oklch(1 0 0 / 0.9), oklch(0.94 0.03 240 / 0.7))",
            border: "1px solid oklch(1 0 0 / 0.8)",
            boxShadow: "var(--shadow-glass), 0 30px 80px -20px oklch(0.45 0.17 255 / 0.45)",
          }}
        >
          <div
            className="flex h-20 w-20 items-center justify-center rounded-full sm:h-22 sm:w-22 md:h-24 md:w-24"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.45 0.17 255), oklch(0.62 0.16 225))",
              boxShadow: "inset 0 1px 0 oklch(1 0 0 / 0.3)",
            }}
          >
            <svg
              viewBox="0 0 100 60"
              className="h-12 w-56 md:h-14 md:w-14"
              fill="none"
            >
              <motion.path
                d="M 10 40 C 15 10, 22 10, 25 42 C 27 20, 32 20, 35 38 C 38 28, 41 28, 44 36 C 47 30, 50 30, 53 36 C 56 12, 63 12, 65 40 C 67 44, 70 40, 73 32 C 78 15, 75 48, 55 50 C 35 52, 20 50, 15 46 C 35 46, 65 46, 90 42"
                stroke="white"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1, 1, 0], opacity: [0, 1, 1, 0] }}
                transition={{
                  duration: 4.5,
                  times: [0, 0.45, 0.85, 1],
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <motion.circle
                r="2.5"
                fill="white"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: [0, 1, 1, 0],
                  offsetDistance: ["0%", "100%", "100%", "100%"],
                }}
                transition={{
                  duration: 4.5,
                  times: [0, 0.45, 0.85, 1],
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                style={{
                  offsetPath:
                    "path('M 10 40 C 15 10, 22 10, 25 42 C 27 20, 32 20, 35 38 C 38 28, 41 28, 44 36 C 47 30, 50 30, 53 36 C 56 12, 63 12, 65 40 C 67 44, 70 40, 73 32 C 78 15, 75 48, 55 50 C 35 52, 20 50, 15 46 C 35 46, 65 46, 90 42')",
                }}
              />
            </svg>
          </div>
        </div>
        <div className="mt-3 -ml-5 text-center text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground md:text-[11px] whitespace-nowrap">
          Create · Capture · Onboard
        </div>
      </motion.div>

      {/* Floating modules */}
      {modules.map((m) => (
        <FloatingModule key={m.label} {...m} />
      ))}

      {/* Connection lines */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {modules.map((m, i) => (
          <line
            key={i}
            x1="50"
            y1="50"
            x2={m.x + 8}
            y2={m.y + 8}
            stroke="oklch(0.55 0.16 255 / 0.18)"
            strokeWidth="0.15"
            strokeDasharray="0.6 0.8"
          />
        ))}
      </svg>
    </div>
  );
}

function FloatingModule({ icon: Icon, label, x, y, delay }: ModuleSpec) {
  return (
    <motion.div
      className="absolute z-20"
      style={{ left: `${x}%`, top: `${y}%` }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{
        opacity: 1,
        scale: 1,
        y: [0, -12, 0],
        x: [0, 8, 0],
      }}
      transition={{
        opacity: { duration: 0.6, delay: delay * 0.3 },
        scale: { duration: 0.6, delay: delay * 0.3 },
        y: {
          duration: 6 + (delay % 2),
          repeat: Infinity,
          ease: "easeInOut",
          delay,
        },
        x: {
          duration: 8 + (delay % 2),
          repeat: Infinity,
          ease: "easeInOut",
          delay,
        },
      }}
    >
      <div className="group flex flex-col items-center gap-1">
        <div className="relative flex h-12 w-12 items-center justify-center transition-transform duration-500 group-hover:scale-110 sm:h-14 sm:w-14 md:h-16 md:w-16">
          <Icon
            className="h-6 w-6 text-primary sm:h-7 sm:w-7 md:h-8 md:w-8 drop-shadow-[0_4px_6px_rgba(59,130,246,0.3)]"
            strokeWidth={1.6}
          />
        </div>
        <span className="text-[9px] font-medium tracking-wide text-foreground/80 md:text-[10px] bg-slate-900/5 px-2 py-0.5 rounded-[7px]">
          {label}
        </span>
      </div>
    </motion.div>
  );
}

const openCenteredWindow = (url: string, title = '_blank', w = 1200, h = 800) => {
  const dualScreenLeft = window.screenLeft !== undefined ? window.screenLeft : window.screenX;
  const dualScreenTop = window.screenTop !== undefined ? window.screenTop : window.screenY;

  const width = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
  const height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;

  const systemZoom = width / window.screen.width;
  const left = (width - w) / 2 / systemZoom + dualScreenLeft;
  const top = (height - h) / 2 / systemZoom + dualScreenTop;
  const newWindow = window.open(
    url,
    title,
    `scrollbars=yes,width=${w / systemZoom},height=${h / systemZoom},top=${top},left=${left},resizable=yes`
  );

  if (window.focus && newWindow) newWindow.focus();
  return newWindow;
};

export default function StandaloneSetup() {
  const navigate = useNavigate();

  // --- STATE ---
  // Stepper State: 1 = Account Identification (Landing), 3 = Signatory Relations
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [landingView, setLandingView] = useState<'home' | 'search' | 'create'>('home');
  const [navStack, setNavStack] = useState<string[]>(['home']);

  // Helper function to navigate and push history stack
  const navigateTo = (target: 'home' | 'search' | 'create' | 'step3') => {
    setNavStack(prev => [...prev, target]);
    if (target === 'step3') {
      setCurrentStep(3);
    } else {
      setCurrentStep(1);
      setLandingView(target);
      if (target === 'search') {
        setSearchAccNo('');
        setActiveAccNo('');
        setFoundExistingAccount(false);
        setAccName('');
      } else if (target === 'create') {
        setActiveAccNo('');
        setAccName('');
        setFoundExistingAccount(false);
      }
    }
  };

  // Helper function to go back by popping history stack
  const navigateBack = () => {
    if (navStack.length > 1) {
      const newStack = [...navStack];
      newStack.pop();
      const prev = newStack[newStack.length - 1];
      setNavStack(newStack);
      if (prev === 'step3') {
        setCurrentStep(3);
      } else {
        setCurrentStep(1);
        setLandingView(prev as 'home' | 'search' | 'create');
        if (prev === 'search' && !activeAccNo) {
          setFoundExistingAccount(false);
        }
      }
    }
  };

  // Global Settings (Collapsed on page load)
  const [teller, setTeller] = useState(() => localStorage.getItem('teller') || 'teller_admin');
  const [supervisor, setSupervisor] = useState(() => localStorage.getItem('supervisor') || 'supervisor_admin');
  const [batch, setBatch] = useState(() => localStorage.getItem('batch') || 'B001');
  const [hostname, setHostname] = useState(() => localStorage.getItem('hostname') || 'STANDALONE-PC');
  const [terminalIp, setTerminalIp] = useState(() => localStorage.getItem('terminalIp') || '127.0.0.1');
  const [showConfig, setShowConfig] = useState(false);

  // Local Accounts & Relations Cache
  const [accounts, setAccounts] = useState<Record<string, StandaloneAccount>>({});
  const [relations, setRelations] = useState<Record<string, StandaloneRelation>>({});
  
  // Account Form / Search state
  const [searchAccNo, setSearchAccNo] = useState('');
  const [activeAccNo, setActiveAccNo] = useState('');
  const [accName, setAccName] = useState('');
  const [accMandate, setAccMandate] = useState(ACCOUNT_MANDATES[0]);

  // Relation Form State
  const [tempRelNo, setTempRelNo] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [otherName, setOtherName] = useState('');
  const [surname, setSurname] = useState('');
  const [amtLimit, setAmtLimit] = useState('50000');
  const [sigLevel, setSigLevel] = useState(SIGNATORY_LEVELS[0]);
  const [editingRelNo, setEditingRelNo] = useState<string | null>(null);
  const [currentOnboardingRelNo, setCurrentOnboardingRelNo] = useState<string | null>(null);
  const [subStep, setSubStep] = useState<1 | 2 | 3>(1);
  const [existingCustomer, setExistingCustomer] = useState<StandaloneRelation | null>(null);
  const [viewingBiometric, setViewingBiometric] = useState<{
    relationNo: string;
    type: 'photo' | 'signature' | 'id' | 'fingerprint';
    name: string;
  } | null>(null);
  const [viewingBiometricsData, setViewingBiometricsData] = useState<any>(null);

  // Activity config and search result tracking
  const [activityConfig, setActivityConfig] = useState<ActivityConfig | null>(null);

  // Track if searched account already exists (vs. new)
  const [foundExistingAccount, setFoundExistingAccount] = useState(false);

  // Step 3: toggle Add Signatory form panel
  const [showAddSignatory, setShowAddSignatory] = useState(false);
  const [showModifyModal, setShowModifyModal] = useState(false);

  // Quick cheque launcher state
  const [chequeNo, setChequeNo] = useState('');

  // Top Center Alert Notification System
  const [alertBanner, setAlertBanner] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    variant: 'success' | 'destructive' | 'info';
  }>({
    isOpen: false,
    title: '',
    description: '',
    variant: 'info'
  });

  // Custom Confirmation Modal Overlay (No browser confirm popups)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    variant: 'blue' | 'rose';
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
    variant: 'blue'
  });

  const triggerAlert = (title: string, description: string, variant: 'success' | 'destructive' | 'info' = 'info') => {
    setAlertBanner({ isOpen: true, title, description, variant });
    setTimeout(() => {
      setAlertBanner(prev => ({ ...prev, isOpen: false }));
    }, 4500);
  };

  const triggerConfirm = (title: string, description: string, onConfirm: () => void, variant: 'blue' | 'rose' = 'blue') => {
    setConfirmModal({
      isOpen: true,
      title,
      description,
      onConfirm: () => {
        onConfirm();
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      },
      variant
    });
  };

  // Load accounts and relations from local storage on load (NO MOCK DATA SEEDING)
  useEffect(() => {
    const storedAccs = localStorage.getItem('standalone_accounts');
    const storedRels = localStorage.getItem('standalone_relations');

    if (storedAccs) {
      setAccounts(JSON.parse(storedAccs));
    }
    if (storedRels) {
      setRelations(JSON.parse(storedRels));
    }

    // Fetch biometric activity configuration
    fetchActivityConfig().then(res => {
      if (res.success && res.data) {
        setActivityConfig(res.data);
      }
    });
  }, []);

  // Load and merge biometrics for preview modal when viewingBiometric changes
  useEffect(() => {
    if (!viewingBiometric) {
      setViewingBiometricsData(null);
      return;
    }

    const relNo = viewingBiometric.relationNo;
    // 1. Initial load from local storage
    const localJson = localStorage.getItem(`standalone_biometrics_${relNo}`);
    const localData = localJson ? JSON.parse(localJson) : {};
    
    // Set initial data immediately so the UI is responsive
    setViewingBiometricsData(localData);

    // 2. Fetch from API as a fallback and merge
    searchImages(relNo)
      .then((res) => {
        if (res.status === 'success' && res.data) {
          // Merge API data. Standard fields from api: photo, accsign, thumbprint1, thumbprint2, and documents
          const apiPhoto = res.data.unapproved?.photo || res.data.approved?.photo;
          const apiSig = res.data.unapproved?.accsign || res.data.approved?.accsign;
          const apiDocFront = res.data.unapproved?.documents?.[0]?.sides?.front || res.data.approved?.documents?.[0]?.sides?.front;
          const apiDocBack = res.data.unapproved?.documents?.[0]?.sides?.back || res.data.approved?.documents?.[0]?.sides?.back;
          const apiFp1 = res.data.unapproved?.thumbprint1 || res.data.approved?.thumbprint1;
          const apiFp2 = res.data.unapproved?.thumbprint2 || res.data.approved?.thumbprint2;

          const merged = {
            photo: localData.photo || apiPhoto || null,
            signature: localData.signature || apiSig || null,
            idFront: localData.idFront || apiDocFront || null,
            idBack: localData.idBack || apiDocBack || null,
            thumbprint1: localData.thumbprint1 || apiFp1 || null,
            thumbprint2: localData.thumbprint2 || apiFp2 || null,
          };
          setViewingBiometricsData(merged);
        }
      })
      .catch((err) => {
        console.error('Failed to fallback fetch images from API:', err);
      });
  }, [viewingBiometric]);

  // Sync all relations of active account with the API
  const syncAccountBiometrics = useCallback(async (accNo: string) => {
    try {
      const storedRels = localStorage.getItem('standalone_relations');
      const currentRels: Record<string, StandaloneRelation> = storedRels ? JSON.parse(storedRels) : relations;
      const accRelations = Object.values(currentRels).filter((r: StandaloneRelation) => r.accountNumber === accNo);
      if (accRelations.length === 0) return;
      
      const updatedRels = { ...currentRels };
      let hasChanges = false;
      
      await Promise.all(accRelations.map(async (rel: StandaloneRelation) => {
        try {
          const res = await searchImages(rel.relationNo);
          if (res.status === 'success' && res.data) {
            const approved = res.data.approved || {};
            const unapproved = res.data.unapproved || {};
            
            const hasPhoto = !!(approved.photo || unapproved.photo);
            const hasSig = !!(approved.accsign || unapproved.accsign);
            const hasId = !!((approved.documents && approved.documents.length > 0) || 
                             (unapproved.documents && unapproved.documents.length > 0));
            const hasFp = !!(approved.thumbprint1 || approved.thumbprint2 || unapproved.thumbprint1 || unapproved.thumbprint2);
            
            if (hasPhoto && !rel.photoCaptured) { updatedRels[rel.relationNo].photoCaptured = true; hasChanges = true; }
            if (hasSig && !rel.signatureCaptured) { updatedRels[rel.relationNo].signatureCaptured = true; hasChanges = true; }
            if (hasId && !rel.idCaptured) { updatedRels[rel.relationNo].idCaptured = true; hasChanges = true; }
            if (hasFp && !rel.fingerprintCaptured) { updatedRels[rel.relationNo].fingerprintCaptured = true; hasChanges = true; }
          }
        } catch (e) {
          console.warn(`Failed to sync relation ${rel.relationNo}:`, e);
        }
      }));
      
      if (hasChanges) {
        localStorage.setItem('standalone_relations', JSON.stringify(updatedRels));
        setRelations(updatedRels);
      }
    } catch (e) {
      console.warn('syncAccountBiometrics error:', e);
    }
  }, [relations]);   

  // Sync biometrics when active account changes
  useEffect(() => {
    if (activeAccNo) {
      syncAccountBiometrics(activeAccNo);
    }
  }, [activeAccNo, syncAccountBiometrics]);

  // Keep foundExistingAccount in sync with activeAccNo
  useEffect(() => {
    if (!activeAccNo) {
      setFoundExistingAccount(false);
    }
  }, [activeAccNo]);

  // Save configurations when global settings change
  useEffect(() => {
    localStorage.setItem('teller', teller);
    localStorage.setItem('supervisor', supervisor);
    localStorage.setItem('batch', batch);
    localStorage.setItem('hostname', hostname);
    localStorage.setItem('terminalIp', terminalIp);
  }, [teller, supervisor, batch, hostname, terminalIp]);

  // Sync relation capture status automatically on window focus
  useEffect(() => {
    const handleFocus = () => {
      const storedRels = localStorage.getItem('standalone_relations');
      if (storedRels) {
        setRelations(JSON.parse(storedRels));
      }
      if (activeAccNo) {
        syncAccountBiometrics(activeAccNo);
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [activeAccNo, syncAccountBiometrics]);

  // Account search handling
  const handleSearchAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNo = searchAccNo.trim();
    if (!cleanNo) {
      triggerAlert('Validation Error', 'Please enter an account number.', 'destructive');
      return;
    }

    if (accounts[cleanNo]) {
      // Existing account — stay on Step 1 and show inline account details panel
      setActiveAccNo(cleanNo);
      setAccMandate(accounts[cleanNo].mandate);
      setAccName(accounts[cleanNo].accountName || '');
      setFoundExistingAccount(true);
      triggerAlert('Account Located', `Account #${cleanNo} found. Review details below.`, 'success');
      // Do NOT change step — stay on Step 1
    } else {
      setActiveAccNo(cleanNo);
      setAccName('');
      setFoundExistingAccount(false);
      triggerAlert('Account Not Found', `Configure mandate rules to create account #${cleanNo}.`, 'info');
      setCurrentStep(2);
    }
  };

  // Create/Save Account configuration
  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAccNo.trim()) {
      triggerAlert('Validation Error', 'Account number is missing.', 'destructive');
      return;
    }
    if (!accName.trim()) {
      triggerAlert('Validation Error', 'Account Name is required.', 'destructive');
      return;
    }

    triggerAlert('Account Details Initialized', `Configure signatories for Account #${activeAccNo}.`, 'success');
    setCurrentStep(3);
  };

  const handleNationalIdChange = (val: string) => {
    setNationalId(val);
    const matched = Object.values(relations).find(r => r.nationalId === val.trim() && !r.isTemp);
    if (matched) {
      if (matched.accountNumber !== activeAccNo) {
        setExistingCustomer(matched);
        setFirstName(matched.firstName);
        setSurname(matched.surname);
        setOtherName(matched.otherName || '');
      } else {
        setExistingCustomer(null);
      }
    } else {
      if (existingCustomer) {
        setFirstName('');
        setSurname('');
        setOtherName('');
      }
      setExistingCustomer(null);
    }
  };

  const resetRelationForm = () => {
    setTempRelNo('');
    setNationalId('');
    setFirstName('');
    setOtherName('');
    setSurname('');
    setAmtLimit('50000');
    setSigLevel(SIGNATORY_LEVELS[0]);
    setEditingRelNo(null);
    setCurrentOnboardingRelNo(null);
    setExistingCustomer(null);
    setShowAddSignatory(false);
  };

  const resetToHome = () => {
    setCurrentStep(1);
    setLandingView('home');
    setNavStack(['home']);
    setActiveAccNo('');
    setSearchAccNo('');
    setAccName('');
    setFoundExistingAccount(false);
    setAccMandate(ACCOUNT_MANDATES[0]);
    resetRelationForm();
  };

  const handleCancelOnboarding = () => {
    const finalRelNo = editingRelNo || tempRelNo;
    if (!finalRelNo) {
      resetRelationForm();
      return;
    }

    const biometricsJson = localStorage.getItem(`standalone_biometrics_${finalRelNo}`);
    const localBio = biometricsJson ? JSON.parse(biometricsJson) : {};
    const hasCaptured = !!(localBio.photo || localBio.signature || localBio.idFront || localBio.idBack || localBio.thumbprint1 || localBio.thumbprint2);

    if (!hasCaptured) {
      if (!editingRelNo) {
        const updatedRels = { ...relations };
        delete updatedRels[finalRelNo];
        localStorage.setItem('standalone_relations', JSON.stringify(updatedRels));
        setRelations(updatedRels);
      }
      resetRelationForm();
      return;
    }

    triggerConfirm(
      'Discard Signatory Data',
      'Are you sure you want to discard this signatory profile? Any biometrics captured during this session will be lost.',
      () => {
        if (!editingRelNo) {
          const updatedRels = { ...relations };
          delete updatedRels[finalRelNo];
          localStorage.setItem('standalone_relations', JSON.stringify(updatedRels));
          setRelations(updatedRels);
          localStorage.removeItem(`standalone_biometrics_${finalRelNo}`);
        }
        resetRelationForm();
        triggerAlert('Session Cancelled', 'Signatory onboarding has been cancelled.', 'info');
      },
      'rose'
    );
  };

  const handleSyncCaptureStatus = () => {
    const storedRels = localStorage.getItem('standalone_relations');
    if (storedRels) {
      setRelations(JSON.parse(storedRels));
    }
    if (activeAccNo) {
      syncAccountBiometrics(activeAccNo);
    }
    triggerAlert('Sync Completed', 'Biometric status synchronized with local database and backend API.', 'success');
  };

  // Save signatory relation (Complete Onboarding / Apply changes)
  const handleSaveRelation = (e: React.FormEvent) => {
    e.preventDefault();
    const finalRelNo = editingRelNo || tempRelNo;
    if (!finalRelNo) return;

    if (!nationalId.trim()) {
      triggerAlert('Validation Error', 'National ID is required.', 'destructive');
      return;
    }

    const isDuplicate = Object.values(relations).some(
      r => r.accountNumber === activeAccNo && 
           !r.isTemp && 
           r.nationalId.trim().toLowerCase() === nationalId.trim().toLowerCase() && 
           r.relationNo !== editingRelNo
    );

    if (isDuplicate) {
      triggerAlert('Duplicate Error', 'A signatory with the same National ID is already registered under this account.', 'destructive');
      return;
    }

    if (!firstName.trim() || !surname.trim()) {
      triggerAlert('Validation Error', 'First Name and Surname are required.', 'destructive');
      return;
    }

    // Copy/merge existingCustomer biometrics if applicable
    let mergedBio = {};
    if (existingCustomer) {
      const srcBiometricsJson = localStorage.getItem(`standalone_biometrics_${existingCustomer.relationNo}`);
      if (srcBiometricsJson) {
        try {
          mergedBio = JSON.parse(srcBiometricsJson);
        } catch (e) {
          console.error('Failed to parse existing customer biometrics', e);
        }
      }
    }

    // Check if we have captured biometrics for this relation in localStorage or if it is from existingCustomer
    const biometricsJson = localStorage.getItem(`standalone_biometrics_${finalRelNo}`);
    const localBio = biometricsJson ? JSON.parse(biometricsJson) : {};
    
    const finalBio = { ...mergedBio, ...localBio };
    if (Object.keys(finalBio).length > 0) {
      localStorage.setItem(`standalone_biometrics_${finalRelNo}`, JSON.stringify(finalBio));
    }
    
    const hasPhoto = !!(finalBio.photo || existingCustomer?.photoCaptured);
    const hasSig = !!(finalBio.signature || existingCustomer?.signatureCaptured);
    const hasId = !!(finalBio.idFront || finalBio.idBack || existingCustomer?.idCaptured);
    const hasFp = !!(finalBio.thumbprint1 || finalBio.thumbprint2 || existingCustomer?.fingerprintCaptured);

    const updatedRels = { ...relations };
    updatedRels[finalRelNo] = {
      accountNumber: activeAccNo,
      relationNo: finalRelNo,
      nationalId: nationalId.trim(),
      firstName: firstName.trim(),
      otherName: otherName.trim() || undefined,
      surname: surname.trim(),
      amtlimit: parseFloat(amtLimit) || 0,
      signatoryLevel: sigLevel,
      photoCaptured: hasPhoto,
      signatureCaptured: hasSig,
      idCaptured: hasId,
      fingerprintCaptured: hasFp,
      isApproved: editingRelNo ? (relations[editingRelNo]?.isApproved || false) : false
    };

    // Ensure account details are persisted to localStorage when a relation is saved
    const storedAccs = localStorage.getItem('standalone_accounts');
    const accs = storedAccs ? JSON.parse(storedAccs) : {};
    const newAccs = {
      ...accs,
      [activeAccNo]: {
        accountNumber: activeAccNo,
        mandate: accMandate,
        accountName: accName.trim()
      }
    };
    localStorage.setItem('standalone_accounts', JSON.stringify(newAccs));
    setAccounts(newAccs);

    localStorage.setItem('standalone_relations', JSON.stringify(updatedRels));
    setRelations(updatedRels);
    triggerAlert('Relation Registered', `Signatory saved under account #${activeAccNo}.`, 'success');
    resetRelationForm();
  };

  // Delete signatory relation (Custom Confirm)
  const handleDeleteRelation = (relationNo: string) => {
    triggerConfirm(
      'Remove Signatory Relation',
      `Are you sure you want to permanently remove relation #${relationNo} and delete their capture records?`,
      () => {
        const updatedRels = { ...relations };
        delete updatedRels[relationNo];
        localStorage.removeItem(`standalone_biometrics_${relationNo}`);
        localStorage.setItem('standalone_relations', JSON.stringify(updatedRels));
        setRelations(updatedRels);
        triggerAlert('Relation Removed', `Signatory relation #${relationNo} deleted.`, 'info');
      },
      'rose'
    );
  };

  // Delete account completely (Custom Confirm)
  const handleDeleteAccount = (accNo: string) => {
    triggerConfirm(
      'Delete Account Profile',
      `Are you sure you want to permanently delete account #${accNo} and remove all its signatories and their biometric records?`,
      () => {
        const updatedAccs = { ...accounts };
        delete updatedAccs[accNo];

        const updatedRels = { ...relations };
        Object.keys(updatedRels).forEach(key => {
          if (updatedRels[key].accountNumber === accNo) {
            delete updatedRels[key];
            localStorage.removeItem(`standalone_biometrics_${key}`);
          }
        });

        localStorage.setItem('standalone_accounts', JSON.stringify(updatedAccs));
        localStorage.setItem('standalone_relations', JSON.stringify(updatedRels));
        setAccounts(updatedAccs);
        setRelations(updatedRels);

        if (activeAccNo === accNo) {
          setActiveAccNo('');
          setSearchAccNo('');
          setCurrentStep(1);
          setLandingView('home');
          setNavStack(['home']);
        }
        triggerAlert('Account Profile Deleted', `Account #${accNo} has been removed.`, 'info');
      },
      'rose'
    );
  };

  // Toggle biometric status manually for UAT testing
  const toggleBiometricStatus = (relationNo: string, field: 'photo' | 'signature' | 'id' | 'fingerprint') => {
    const updatedRels = { ...relations };
    const rel = updatedRels[relationNo];
    if (!rel) return;

    if (field === 'photo') rel.photoCaptured = !rel.photoCaptured;
    if (field === 'signature') rel.signatureCaptured = !rel.signatureCaptured;
    if (field === 'id') rel.idCaptured = !rel.idCaptured;
    if (field === 'fingerprint') rel.fingerprintCaptured = !rel.fingerprintCaptured;

    rel.isApproved = false; // reset approval flag on status changes

    localStorage.setItem('standalone_relations', JSON.stringify(updatedRels));
    setRelations(updatedRels);
  };

  // Toggle approval flag
  const toggleApprovalStatus = (relationNo: string) => {
    const updatedRels = { ...relations };
    const rel = updatedRels[relationNo];
    if (rel) {
      rel.isApproved = !rel.isApproved;
      localStorage.setItem('standalone_relations', JSON.stringify(updatedRels));
      setRelations(updatedRels);
      triggerAlert('Status Changed', `Relation #${relationNo} approval flag is now ${rel.isApproved ? 'Approved' : 'Pending'}.`, 'success');
    }
  };

  // Maps text mandates to integer codes for routing update URL compatibility
  const getMandateCode = (mandateName: string): number => {
    switch (mandateName) {
      case 'Sole Signatory': return 1;
      case 'Any two to sign': return 2;
      case 'All Three to sign': return 3;
      case 'Either to Sign': return 4;
      case 'Both to Sign': return 5;
      default: return 1;
    }
  };

  const handleOpenCaptureWindow = () => {
    const finalRelNo = tempRelNo || 'R' + Math.floor(100000 + Math.random() * 900000).toString();
    if (!tempRelNo) {
      setTempRelNo(finalRelNo);
      setCurrentOnboardingRelNo(finalRelNo);
    }
    
    // Save temporary details to standalone_relations so that the capture screen has the metadata
    const updatedRels = { ...relations };
    updatedRels[finalRelNo] = {
      accountNumber: activeAccNo,
      relationNo: finalRelNo,
      nationalId: nationalId.trim(),
      firstName: firstName.trim(),
      otherName: otherName.trim() || undefined,
      surname: surname.trim(),
      amtlimit: parseFloat(amtLimit) || 0,
      signatoryLevel: sigLevel,
      photoCaptured: relations[finalRelNo]?.photoCaptured || false,
      signatureCaptured: relations[finalRelNo]?.signatureCaptured || false,
      idCaptured: relations[finalRelNo]?.idCaptured || false,
      fingerprintCaptured: relations[finalRelNo]?.fingerprintCaptured || false,
      isApproved: false,
      isTemp: true // Flag as temporary to prevent table leakage
    };

    localStorage.setItem('standalone_relations', JSON.stringify(updatedRels));
    setRelations(updatedRels);

    const today = new Date().toISOString().split('T')[0];
    openCenteredWindow(
      `${window.location.origin}/imaging/capture-${finalRelNo}-${teller}-${today}`
    );
  };

  // Launcher actions
  const handleLaunchCapture = (relationNo: string) => {
    const today = new Date().toISOString().split('T')[0];
    navigate(`/imaging/capture-${relationNo}-${teller}-${today}`);
  };

  const handleLaunchUpdate = (rel: StandaloneRelation) => {
    const today = new Date().toISOString().split('T')[0];
    const mandateCode = getMandateCode(accMandate);
    openCenteredWindow(
      `${window.location.origin}/imaging/update-${rel.relationNo}-${batch}-${mandateCode}-${rel.amtlimit}-${teller}-${today}`
    );
  };

  const handleLaunchApproval = (relationNo: string) => {
    openCenteredWindow(
      `${window.location.origin}/imaging/image_approval_screen-${relationNo}-${batch}-${activeAccNo}-${supervisor}-${hostname}-${terminalIp}`
    );
  };

  const handleLaunchAccountApproval = () => {
    openCenteredWindow(
      `${window.location.origin}/imaging/account_image_approval_screen-${batch}-${activeAccNo}-${supervisor}-${hostname}-${terminalIp}`
    );
  };

  const handleLaunchEnquiryRelation = (relationNo: string) => {
    openCenteredWindow(
      `${window.location.origin}/imaging/viewimage-${relationNo}`
    );
  };

  const handleLaunchEnquiryAccount = () => {
    openCenteredWindow(
      `${window.location.origin}/imaging/getimages-${activeAccNo}`
    );
  };

  const handleLaunchCheques = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chequeNo.trim()) {
      triggerAlert('Validation Error', 'Enter a cheque number to load specimen.', 'destructive');
      return;
    }
    navigate(`/imaging/view_cheques-${chequeNo}`);
  };

  const startEditRelation = (rel: StandaloneRelation) => {
    setEditingRelNo(rel.relationNo);
    setTempRelNo(rel.relationNo);
    setNationalId(rel.nationalId || '');
    setFirstName(rel.firstName);
    setOtherName(rel.otherName || '');
    setSurname(rel.surname);
    setAmtLimit(rel.amtlimit?.toString() || '0');
    setSigLevel(rel.signatoryLevel);
    const existing = Object.values(relations).find(r => r.nationalId === rel.nationalId && r.relationNo !== rel.relationNo && r.accountNumber !== activeAccNo && !r.isTemp);
    setExistingCustomer(existing || null);
    setShowAddSignatory(true);
  };

  const startAddRelation = () => {
    resetRelationForm();
    const newRelNo = 'R' + Math.floor(100000 + Math.random() * 900000).toString();
    setTempRelNo(newRelNo);
    setShowAddSignatory(true);
  };

  const validateMandateAndSignatories = (mandate: string, signatoryCount: number): { valid: boolean; errorMsg?: string } => {
    if (signatoryCount === 0) {
      return { valid: false, errorMsg: 'Please add at least one signatory.' };
    }
    switch (mandate) {
      case 'Sole Signatory':
        if (signatoryCount < 1) {
          return { valid: false, errorMsg: 'Sole Signatory mandate requires at least 1 signatory.' };
        }
        break;
      case 'Any two to sign':
        if (signatoryCount < 2) {
          return { valid: false, errorMsg: 'Any two to sign mandate requires at least 2 signatories.' };
        }
        break;
      case 'All Three to sign':
        if (signatoryCount < 3) {
          return { valid: false, errorMsg: 'All Three to sign mandate requires at least 3 signatories.' };
        }
        break;
      case 'Either to Sign':
        if (signatoryCount < 2) {
          return { valid: false, errorMsg: 'Either to Sign mandate requires more than one signatory (at least 2 signatories).' };
        }
        break;
      case 'Both to Sign':
        if (signatoryCount < 2) {
          return { valid: false, errorMsg: 'Both to Sign mandate requires at least 2 signatories.' };
        }
        break;
    }
    return { valid: true };
  };

  const handleCompleteAndReset = () => {
    const validation = validateMandateAndSignatories(accMandate, activeRelations.length);
    if (!validation.valid) {
      triggerAlert('Mandate Conflict', validation.errorMsg || 'The number of signatories does not match the account mandate.', 'destructive');
      return;
    }

    triggerConfirm(
      'Finish Account Setup',
      'This will complete the setup for current account and reset your workspace to Step 1.',
      () => {
        setCurrentStep(1);
        setLandingView('home');
        setNavStack(['home']);
        setActiveAccNo('');
        setSearchAccNo('');
        setAccName('');
        setAccMandate(ACCOUNT_MANDATES[0]);
        resetRelationForm();
        triggerAlert('Session Complete', 'Account setup finished. You can now load or create another account.', 'success');
      },
      'blue'
    );
  };

  const activeRelations = Object.values(relations).filter(r => r.accountNumber === activeAccNo && !r.isTemp);

  const isDuplicateNationalId = nationalId.trim() !== '' && Object.values(relations).some(
    r => r.accountNumber === activeAccNo && 
         !r.isTemp && 
         r.nationalId.trim().toLowerCase() === nationalId.trim().toLowerCase() && 
         r.relationNo !== editingRelNo
  );

  const steps = landingView === 'search'
    ? [
        { number: 1, label: 'Account Enquiry', desc: 'Locate profile & specimens', icon: Search },
        { number: 3, label: 'Modify Signatories', desc: 'Update, approve or modify', icon: User }
      ]
    : [
        { number: 1, label: 'Create Account', desc: 'Configure account details', icon: Landmark },
        { number: 3, label: 'Signatory Onboarding', desc: 'Capture & manage relations', icon: User }
      ];

  const isFormComplete = nationalId.trim() !== '' && firstName.trim() !== '' && surname.trim() !== '';

  // Helper to filter active biometrics based on API activity config settings
  const getActiveBiometrics = (rel: StandaloneRelation) => {
    const list = [];
    const showPhoto = activityConfig ? activityConfig.image.status : true;
    const showSig = activityConfig ? activityConfig.image.status : true;
    const showId = activityConfig ? activityConfig.identification.status : true;
    const showFp = activityConfig ? activityConfig.fingerprint.status : true;

    if (showPhoto) {
      list.push({
        type: 'photo' as const,
        label: 'Photo',
        icon: Camera,
        isCaptured: !!rel.photoCaptured
      });
    }
    if (showSig) {
      list.push({
        type: 'signature' as const,
        label: 'Signature',
        icon: Signature,
        isCaptured: !!rel.signatureCaptured
      });
    }
    if (showId) {
      list.push({
        type: 'id' as const,
        label: 'ID Documents',
        icon: FileText,
        isCaptured: !!rel.idCaptured
      });
    }
    if (showFp) {
      list.push({
        type: 'fingerprint' as const,
        label: 'Fingerprints',
        icon: Fingerprint,
        isCaptured: !!rel.fingerprintCaptured
      });
    }
    return list;
  };

  // True if at least one biometric specimen has been captured for the signatory currently being onboarded
  const checkAnyCaptureConfirmed = useCallback(() => {
    const finalRelNo = editingRelNo || tempRelNo || currentOnboardingRelNo;
    if (!finalRelNo) return false;

    const rel = relations[finalRelNo];
    if (rel && (rel.photoCaptured || rel.signatureCaptured || rel.idCaptured || rel.fingerprintCaptured)) {
      return true;
    }

    try {
      const biometricsJson = localStorage.getItem(`standalone_biometrics_${finalRelNo}`);
      if (biometricsJson) {
        const localBio = JSON.parse(biometricsJson);
        return !!(
          localBio.photo || 
          localBio.signature || 
          localBio.idFront || 
          localBio.idBack || 
          localBio.thumbprint1 || 
          localBio.thumbprint2
        );
      }
    } catch (e) {
      // ignore
    }
    return false;
  }, [relations, editingRelNo, tempRelNo, currentOnboardingRelNo]);

  const anyCaptureConfirmed = checkAnyCaptureConfirmed();

  const renderLandingHome = () => {
    return (
      <div className="relative flex flex-col items-center justify-center min-h-[55vh] max-w-2xl mx-auto space-y-10 px-4 py-8 animate-in fade-in duration-500">
        {/* Cinematic Backdrop Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-blue-500/5 to-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="text-center space-y-4 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50/80 border border-blue-100/50 text-blue-600 text-xs font-semibold tracking-wide backdrop-blur-sm shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-505 bg-blue-500 animate-pulse" />
            Secure Onboarding
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Signatory Biometrics Capture Portal
          </h1>
          <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            Register new accounts, configure multi-signature mandate protocols, and capture secure biometric specimens.
          </p>
        </div>

        <div className="w-full space-y-6 relative z-10">
          {/* Main Call to Action: Create New Account */}
          <div 
            onClick={() => navigateTo('create')}
            className="group relative p-8 rounded-2xl border border-slate-200/80 bg-white hover:border-blue-400 hover:shadow-[0_20px_40px_-15px_rgba(59,130,246,0.12)] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer shadow-sm overflow-hidden"
          >
            {/* Subtle light leak effect on hover */}
            <div className="absolute -inset-px bg-gradient-to-r from-blue-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 shadow-sm">
                <Plus className="w-7 h-7" />
              </div>
              <div className="space-y-1.5 flex-1">
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Create New Account</h3>
                <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
                  Initialize a new profile, establish mandate instructions, and register new signatory records.
                </p>
              </div>
              <div className="self-end sm:self-center shrink-0 text-blue-600 opacity-80 group-hover:opacity-100 transition-opacity flex items-center gap-1 font-bold text-xs">
                Get Started <ArrowRight className="w-4 h-4 ml-0.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          {/* Secondary Action: Search & Manage Accounts */}
          <div 
            onClick={() => navigateTo('search')}
            className="group p-5 rounded-2xl border border-slate-200/50 bg-slate-50/40 hover:bg-slate-50/80 hover:border-slate-300 hover:shadow-md transition-all duration-300 cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 border border-slate-200/50 flex items-center justify-center transition-colors group-hover:bg-white">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">Search &amp; Manage Existing Accounts</h4>
                <p className="text-[11px] text-slate-400">View specimen cards, run approval workflows, or update signatures.</p>
              </div>
            </div>
            <div className="text-slate-400 group-hover:text-slate-700 transition-colors">
              <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderLandingCreate = () => {
    const isAccountExist = !!activeAccNo.trim() && !!accounts[activeAccNo.trim()];

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const cleanAcc = activeAccNo.trim();
      if (!cleanAcc) {
        triggerAlert('Validation Error', 'Account number is required.', 'destructive');
        return;
      }
      if (accounts[cleanAcc]) {
        triggerAlert('Duplicate Error', 'This account number already exists and cannot be used.', 'destructive');
        return;
      }
      if (!accName.trim()) {
        triggerAlert('Validation Error', 'Account Name is required.', 'destructive');
        return;
      }

      // Initialize account details in state (do not write to localStorage yet)
      const updatedAccs = {
        ...accounts,
        [cleanAcc]: {
          accountNumber: cleanAcc,
          mandate: accMandate,
          accountName: accName.trim()
        }
      };

      setAccounts(updatedAccs);
      triggerAlert('Account Details Initialized', `Account #${cleanAcc} details registered.`, 'success');
      
      navigateTo('step3');
    };

    return (
      <div className="max-w-md mx-auto py-2 space-y-6 animate-in fade-in duration-300">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center mx-auto shadow-sm">
            <Landmark className="w-5 h-5" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Create Account</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Establish a new account profile and define mandate protocols.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="create-acc-no" className="text-[10px] uppercase font-bold text-slate-500">Account Number</Label>
            <Input
              id="create-acc-no"
              placeholder="e.g. 0011223344"
              value={activeAccNo}
              onChange={(e) => {
                setActiveAccNo(e.target.value.replace(/\D/g, ''));
              }}
              className="border-slate-200 focus-visible:ring-blue-500 h-10 text-slate-800 text-sm bg-white font-mono rounded-[7px]"
            />
            {isAccountExist && (
              <p className="text-xs text-rose-500 font-semibold mt-1 animate-in fade-in">
                Account number already exists. If you want to modify this account, please do so from the enquiry page.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="create-acc-name" className="text-[10px] uppercase font-bold text-slate-500">Account Name</Label>
            <Input
              id="create-acc-name"
              placeholder="e.g. John Doe Enterprises"
              value={accName}
              onChange={(e) => setAccName(e.target.value)}
              className="border-slate-200 focus-visible:ring-blue-500 h-10 text-slate-800 text-sm bg-white rounded-[7px]"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="create-acc-mandate" className="text-[10px] uppercase font-bold text-slate-500">Signing Mandate Instruction</Label>
            <Select value={accMandate} onValueChange={setAccMandate}>
              <SelectTrigger className="border-slate-200 h-10 text-xs bg-white focus:ring-blue-500 rounded-[7px]">
                <SelectValue placeholder="Choose mandate..." />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 text-slate-800">
                {ACCOUNT_MANDATES.map(mand => (
                  <SelectItem key={mand} value={mand} className="text-xs focus:bg-slate-50">{mand}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              onClick={navigateBack}
              variant="outline"
              className="flex-1 border-slate-200 hover:bg-slate-50 text-slate-600 font-bold h-10 text-xs rounded-[7px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!activeAccNo.trim() || !accName.trim() || isAccountExist}
              className="flex-1 bg-blue-600 text-white hover:bg-blue-700 font-bold h-10 text-xs rounded-[7px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save &amp; Continue
            </Button>
          </div>
        </form>
      </div>
    );
  };

  const renderLandingSearch = () => {
    const handleSearchSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const cleanNo = searchAccNo.trim();
      if (!cleanNo) {
        triggerAlert('Validation Error', 'Please enter an account number.', 'destructive');
        return;
      }

      if (accounts[cleanNo]) {
        setActiveAccNo(cleanNo);
        setAccMandate(accounts[cleanNo].mandate);
        setAccName(accounts[cleanNo].accountName || '');
        setFoundExistingAccount(true);
        triggerAlert('Account Located', `Account #${cleanNo} found. Review details below.`, 'success');
      } else {
        triggerAlert('Account Not Found', `Account #${cleanNo} does not exist in the database. Use 'Initialize Profile' to register it.`, 'info');
        setFoundExistingAccount(false);
      }
    };

    return (
      <div className="space-y-6 max-w-4xl mx-auto py-4 animate-in fade-in duration-300">
        <div className="max-w-md mx-auto space-y-4">
          {!foundExistingAccount && (
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center mx-auto shadow-sm">
                <Search className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Search Accounts</h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Enter an existing account number to enquire or perform actions on it.
              </p>
            </div>
          )}

          <form onSubmit={handleSearchSubmit} className="space-y-3">
            <div className="relative">
              <Input
                placeholder="Account Number (e.g. 0011223344)"
                value={searchAccNo}
                onChange={(e) => {
                  setSearchAccNo(e.target.value.replace(/\D/g, ''));
                  setActiveAccNo('');
                  setFoundExistingAccount(false);
                  setAccName('');
                }}
                className="border-slate-200 focus-visible:ring-blue-500 h-11 pl-10 text-slate-800 font-mono text-sm tracking-wide bg-white rounded-[7px]"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            </div>
            {!foundExistingAccount && (
              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={navigateBack}
                  variant="outline"
                  className="flex-1 border-slate-200 hover:bg-slate-50 text-slate-600 font-bold h-10 text-xs rounded-[7px]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white hover:bg-blue-700 font-bold h-10 text-xs rounded-[7px] flex items-center justify-center gap-2 shadow-sm"
                >
                  Launch Search
                </Button>
              </div>
            )}
          </form>
        </div>

        {foundExistingAccount && activeAccNo && (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeAccNo}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-6"
            >
              {/* Account Summary Banner */}
              <div className="max-w-md mx-auto p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-blue-50/50 border border-emerald-200/80 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-600 uppercase tracking-widest mb-1">
                      <CheckCircle2 className="w-3 h-3 shrink-0" /> Existing Account Found
                    </div>
                    <div className="flex flex-col">
                      <h3 className="text-sm font-bold text-slate-900 font-mono truncate" title="Account Number">#{activeAccNo}</h3>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <p className="text-xs font-semibold text-slate-700 truncate">{accName}</p>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="inline-flex items-center gap-1 text-[9px] bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold shadow-sm whitespace-nowrap">
                            <Landmark className="w-2.5 h-2.5" /> {accMandate}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[9px] bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold shadow-sm whitespace-nowrap">
                            <User className="w-2.5 h-2.5" /> {activeRelations.length} Signator{activeRelations.length !== 1 ? 'ies' : 'y'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setActiveAccNo('');
                      setSearchAccNo('');
                      setFoundExistingAccount(false);
                      setAccName('');
                      resetRelationForm();
                    }}
                    className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-[7px] hover:bg-white/70"
                    title="Clear search"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Two cards side by side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* LEFT: Account Enquiry Specimen Card */}
                <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between gap-4">
                  <div className="space-y-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center animate-in fade-in">
                      <Eye className="w-4.5 h-4.5 text-blue-600" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">Account Enquiry Specimen</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      View all approved biometric specimens on file for this account — including portraits, signatures, fingerprints, and documents for all signatories.
                    </p>
                  </div>
                  <div className="pt-3 border-t border-slate-100">
                    <Button
                      onClick={handleLaunchEnquiryAccount}
                      className="w-full bg-slate-800 hover:bg-slate-900 text-white text-xs h-9 px-4 rounded-[7px] font-bold flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Eye className="w-3.5 h-3.5" /> Launch Enquiry Specimen
                    </Button>
                  </div>
                </div>

                {/* RIGHT: Account Actions Card */}
                <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between gap-4">
                  <div className="space-y-3">
                    <div className="w-9 h-9 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center animate-in fade-in">
                      <Settings className="w-4.5 h-4.5 text-violet-600" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">Account Actions</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Choose an operation to perform on this account — update biometric data, run the approval workflow, or manage signatory profiles.
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    <Button
                      onClick={() => setShowModifyModal(true)}
                      className="w-full bg-slate-800 hover:bg-slate-900 text-white text-xs h-10 px-4 rounded-[7px] font-bold flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Edit className="w-3.5 h-3.5" /> Modify Signatories
                    </Button>
                    <Button
                      onClick={handleLaunchAccountApproval}
                      disabled={activeRelations.length === 0}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs h-10 px-4 rounded-[7px] font-bold flex items-center justify-center gap-2 shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approve Signatories
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    );
  };

  if (currentStep === 1 && landingView === 'home') {
    return (
      <TooltipProvider delayDuration={150}>
        <div className="h-screen w-full overflow-hidden bg-background text-foreground antialiased selection:bg-blue-100">
          
          {createPortal(
            <AnimatePresence>
              {alertBanner.isOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: -50, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="fixed top-6 right-6 z-50 w-full max-w-md px-4"
                >
                  <div className={`flex items-start gap-3 p-4 rounded-[7px] shadow-2xl border backdrop-blur-md ${
                    alertBanner.variant === 'success' 
                      ? 'bg-emerald-50/95 border-emerald-200 text-emerald-800' 
                      : alertBanner.variant === 'destructive' 
                      ? 'bg-rose-50/95 border-rose-200 text-rose-800' 
                      : 'bg-blue-50/95 border-blue-200 text-blue-800'
                  }`}>
                    <AlertCircle className={`w-5 h-5 mt-0.5 shrink-0 ${
                      alertBanner.variant === 'success' 
                        ? 'text-emerald-500' 
                        : alertBanner.variant === 'destructive' 
                        ? 'text-rose-500' 
                        : 'text-blue-500'
                    }`} />
                    <div>
                      <h4 className="font-bold text-sm leading-snug">{alertBanner.title}</h4>
                      <p className="text-xs mt-0.5 leading-normal opacity-90">{alertBanner.description}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>,
            document.body
          )}

          {/* CUSTOM CONFIRMATION MODAL OVERLAY */}
          <AnimatePresence>
            {confirmModal.isOpen && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 10 }}
                  className="w-full max-w-sm bg-white rounded-[7px] border border-slate-200 p-6 shadow-2xl space-y-4"
                >
                  <div className="flex gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${
                      confirmModal.variant === 'rose'
                        ? 'bg-rose-50 border-rose-100 text-rose-500'
                        : 'bg-blue-50 border-blue-100 text-blue-500'
                    }`}>
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{confirmModal.title}</h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{confirmModal.description}</p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2.5 pt-1">
                    <Button 
                      onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} 
                      variant="outline"
                      size="sm"
                      className="h-8.5 px-4 font-bold border-slate-200 text-slate-600 hover:bg-slate-50 text-xs rounded-[7px]"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={confirmModal.onConfirm}
                      variant={confirmModal.variant === 'rose' ? 'destructive' : 'default'}
                      size="sm"
                      className={`h-8.5 px-4 py-1 font-bold text-white text-xs rounded-[7px] ${
                        confirmModal.variant === 'rose'
                          ? 'bg-rose-600 hover:bg-rose-700'
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      Yes, Proceed
                    </Button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <main
            className="relative min-h-screen w-full overflow-x-hidden bg-background text-foreground md:h-screen md:overflow-hidden select-none"
            style={{ backgroundImage: "var(--gradient-hero)" }}
          >
            {/* Animated background paths */}
            <BackgroundPaths />

            {/* Ambient grid */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-[0.25]"
              style={{
                backgroundImage:
                  "linear-gradient(to right, oklch(0.45 0.17 255 / 0.06) 1px, transparent 1px), linear-gradient(to bottom, oklch(0.45 0.17 255 / 0.06) 1px, transparent 1px)",
                backgroundSize: "56px 56px",
                maskImage:
                  "radial-gradient(ellipse at center, black 40%, transparent 80%)",
              }}
            />

            {/* Top bar */}
            <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-4 py-4 sm:px-6 md:px-10 md:py-6">
              <div 
                onClick={resetToHome}
                className="flex min-w-0 items-center gap-2.5 cursor-pointer hover:opacity-85 transition-opacity"
              >
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[7px] bg-primary text-primary-foreground"
                  style={{ boxShadow: "var(--shadow-glow)" }}
                >
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <span className="text-[20px] font-semibold tracking-tight">
                  xIC
                </span>
                <span className="ml-1 hidden text-[12px] text-muted-foreground md:inline">
                  Identity Capture System
                </span>
              </div>
            </header>

            {/* Content grid */}
            <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-[1400px] grid-cols-1 items-center gap-8 px-4 pt-24 pb-10 sm:px-6 md:h-full md:min-h-0 md:grid-cols-[1.05fr_1fr] md:px-10 md:pt-28">
              {/* LEFT */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col justify-center"
              >
                <h1 className="text-[clamp(2.25rem,6vw,5.25rem)] font-semibold leading-[0.95] tracking-[-0.035em] text-foreground">
                  Capture Identity.
                  <br />
                  <span
                    className="bg-clip-text text-transparent"
                    style={{
                      backgroundImage:
                        "linear-gradient(120deg, oklch(0.45 0.17 255), oklch(0.62 0.16 230))",
                    }}
                  >
                    Instantly.
                  </span>
                </h1>

                <div className="mt-9 flex flex-wrap items-center gap-3 sm:gap-4">
                  <Button
                    onClick={() => navigateTo('create')}
                    size="lg"
                    className="group h-12 rounded-[7px] px-7 text-[15px] font-medium md:h-13"
                    style={{
                      background:
                        "linear-gradient(135deg, oklch(0.45 0.17 255), oklch(0.38 0.16 260))",
                      boxShadow: "var(--shadow-glow)",
                    }}
                  >
                    Create Account
                    <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Button>
                  <Button
                    onClick={() => navigateTo('search')}
                    variant="outline"
                    size="lg"
                    className="h-12 rounded-[7px] border-border/70 bg-card/70 px-7 text-[15px] font-medium backdrop-blur-xl md:h-13"
                  >
                    Enquiry
                  </Button>
                </div>
              </motion.section>

              {/* RIGHT */}
              <CaptureVisual />
            </div>
          </main>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider delayDuration={150}>
      <div className="h-screen bg-[#f8fafc] text-slate-800 flex items-center justify-center p-4 selection:bg-blue-100 antialiased overflow-hidden">
        
        {createPortal(
          <AnimatePresence>
            {alertBanner.isOpen && (
              <motion.div 
                initial={{ opacity: 0, y: -50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="fixed top-6 right-6 z-50 w-full max-w-md px-4"
              >
                <div className={`flex items-start gap-3 p-4 rounded-xl shadow-2xl border backdrop-blur-md ${
                  alertBanner.variant === 'success' 
                    ? 'bg-emerald-50/95 border-emerald-200 text-emerald-800' 
                    : alertBanner.variant === 'destructive' 
                    ? 'bg-rose-50/95 border-rose-200 text-rose-800' 
                    : 'bg-blue-50/95 border-blue-200 text-blue-800'
                }`}>
                  <AlertCircle className={`w-5 h-5 mt-0.5 shrink-0 ${
                    alertBanner.variant === 'success' 
                      ? 'text-emerald-500' 
                      : alertBanner.variant === 'destructive' 
                      ? 'text-rose-500' 
                      : 'text-blue-500'
                  }`} />
                  <div>
                    <h4 className="font-bold text-sm leading-snug">{alertBanner.title}</h4>
                    <p className="text-xs mt-0.5 leading-normal opacity-90">{alertBanner.description}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}

        {/* CUSTOM CONFIRMATION MODAL OVERLAY */}
        <AnimatePresence>
          {confirmModal.isOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 p-6 shadow-2xl space-y-4"
              >
                <div className="flex gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${
                    confirmModal.variant === 'rose'
                      ? 'bg-rose-50 border-rose-100 text-rose-500'
                      : 'bg-blue-50 border-blue-100 text-blue-500'
                  }`}>
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{confirmModal.title}</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{confirmModal.description}</p>
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-1">
                  <Button 
                    onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} 
                    variant="outline"
                    size="sm"
                    className="h-8.5 px-4 font-bold border-slate-200 text-slate-600 hover:bg-slate-50 text-xs rounded-[7px]"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={confirmModal.onConfirm}
                    variant={confirmModal.variant === 'rose' ? 'destructive' : 'default'}
                    size="sm"
                    className={`h-8.5 px-4 py-1 font-bold text-white text-xs rounded-[7px] ${
                      confirmModal.variant === 'rose'
                        ? 'bg-rose-600 hover:bg-rose-700'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    Yes, Proceed
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* BIOMETRIC SPECIMEN PREVIEW MODAL */}
        <AnimatePresence>
          {viewingBiometric && (() => {
            const name = viewingBiometric.name;
            const type = viewingBiometric.type;
            
            const isDataLoading = !viewingBiometricsData;
            const biometrics = viewingBiometricsData || {};

            let content = null;
            let title = '';

            const formatSrc = (base64?: string) => {
              if (!base64) return '';
              return base64.startsWith('data:image') ? base64 : `data:image/jpeg;base64,${base64}`;
            };

            if (isDataLoading) {
              title = 'Loading Specimen';
              content = (
                <div className="flex flex-col items-center justify-center py-8 text-center space-y-2">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-slate-500 font-medium">Fetching specimen data...</p>
                </div>
              );
            } else {
              if (type === 'photo') {
                title = 'Portrait Specimen';
                content = biometrics.photo ? (
                  <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-100 animate-in fade-in duration-200">
                    <img src={formatSrc(biometrics.photo)} alt="Portrait" className="max-w-full max-h-[280px] rounded-xl shadow-md border object-cover" />
                    <span className="text-[10px] text-slate-400 mt-2 font-mono">Portrait photo specimen</span>
                  </div>
                ) : null;
              } else if (type === 'signature') {
                title = 'Signature Specimen';
                content = biometrics.signature ? (
                  <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-slate-100 animate-in fade-in duration-200">
                    <img src={formatSrc(biometrics.signature)} alt="Signature" className="max-w-full max-h-[160px] object-contain" />
                    <span className="text-[10px] text-slate-400 mt-2 font-mono">Signature specimen</span>
                  </div>
                ) : null;
              } else if (type === 'id') {
                title = 'ID Document Specimen';
                content = (biometrics.idFront || biometrics.idBack) ? (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    {biometrics.idFront && (
                      <div className="flex flex-col items-center p-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="text-[10px] uppercase font-bold text-slate-400 mb-1.5">Front Side</span>
                        <img src={formatSrc(biometrics.idFront)} alt="ID Front" className="max-w-full max-h-[180px] rounded-lg shadow-sm object-contain" />
                      </div>
                    )}
                    {biometrics.idBack && (
                      <div className="flex flex-col items-center p-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="text-[10px] uppercase font-bold text-slate-400 mb-1.5">Back Side</span>
                        <img src={formatSrc(biometrics.idBack)} alt="ID Back" className="max-w-full max-h-[180px] rounded-lg shadow-sm object-contain" />
                      </div>
                    )}
                  </div>
                ) : null;
              } else if (type === 'fingerprint') {
                title = 'Fingerprint Specimen';
                content = (biometrics.thumbprint1 || biometrics.thumbprint2) ? (
                  <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-200">
                    {biometrics.thumbprint1 && (
                      <div className="flex flex-col items-center p-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="text-[10px] uppercase font-bold text-slate-400 mb-1.5">Right Thumb</span>
                        <img src={formatSrc(biometrics.thumbprint1)} alt="Right Thumb" className="w-24 h-24 object-contain rounded-lg border bg-white p-2" />
                      </div>
                    )}
                    {biometrics.thumbprint2 && (
                      <div className="flex flex-col items-center p-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="text-[10px] uppercase font-bold text-slate-400 mb-1.5">Left Thumb</span>
                        <img src={formatSrc(biometrics.thumbprint2)} alt="Left Thumb" className="w-24 h-24 object-contain rounded-lg border bg-white p-2" />
                      </div>
                    )}
                  </div>
                ) : null;
              }
            }

            return (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 10 }}
                  className="w-full max-w-md bg-white rounded-2xl border border-slate-200 p-6 shadow-2xl space-y-4"
                >
                  <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{title}</h3>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        For <strong className="text-slate-700">{name}</strong> (Rel No: {viewingBiometric.relationNo})
                      </p>
                    </div>
                    <button
                      onClick={() => setViewingBiometric(null)}
                      className="text-slate-400 hover:text-slate-600 transition-colors text-xs font-semibold p-1 rounded-[7px]"
                    >
                      Close
                    </button>
                  </div>

                  <div className="py-2">
                    {content ? content : (
                      <div className="flex flex-col items-center justify-center py-8 text-center space-y-2.5">
                        <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 animate-bounce">
                          <AlertCircle className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">No Biometric Captured</p>
                          <p className="text-[10px] text-slate-500 mt-0.5 max-w-[240px]">
                            Biometric data for this specimen has not been captured for this signatory yet.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end pt-1 border-t border-slate-100">
                    <Button
                      onClick={() => setViewingBiometric(null)}
                      size="sm"
                      className="h-8 px-4 font-bold bg-slate-800 text-white hover:bg-slate-900 text-xs rounded-[7px] shadow-sm"
                    >
                      Dismiss
                    </Button>
                  </div>
                </motion.div>
              </motion.div>
            );
          })()}
        </AnimatePresence>

        {/* MODIFY SIGNATORIES DIALOG MODAL */}
        <AnimatePresence>
          {showModifyModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200 p-6 shadow-2xl space-y-4 flex flex-col max-h-[85vh]"
              >
                <div className="flex items-start justify-between border-b border-slate-100 pb-3 shrink-0">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Modify Signatories</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Account Number: <strong className="text-slate-700">#{activeAccNo}</strong>
                    </p>
                  </div>
                  <button
                    onClick={() => setShowModifyModal(false)}
                    className="text-slate-400 hover:text-slate-600 transition-colors text-xs font-semibold p-1 rounded-[7px] hover:bg-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-1 py-1">
                  {activeRelations.length > 0 ? (
                    activeRelations.map(rel => {
                      const name = `${rel.firstName} ${rel.otherName || ''} ${rel.surname}`.trim();
                      const firstInitial = rel.firstName ? rel.firstName.charAt(0).toUpperCase() : '';
                      const lastInitial = rel.surname ? rel.surname.charAt(0).toUpperCase() : '';
                      const initials = `${firstInitial}${lastInitial}` || '??';
                      const colorClass = getInitialsColor(name);
                      const activeBios = getActiveBiometrics(rel);

                      return (
                        <div key={rel.relationNo} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:bg-white hover:border-blue-200">
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div className={`w-9 h-9 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 ${colorClass}`}>
                              {initials}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-slate-800 text-xs sm:text-sm truncate">{name}</div>
                              <div className="text-[10px] text-slate-500 font-mono mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                                <span>Rel: {rel.relationNo}</span>
                                <span>•</span>
                                <span>National ID: {rel.nationalId}</span>
                                <span>•</span>
                                <span>Limit: ${new Intl.NumberFormat('en-US').format(rel.amtlimit || 0)} ({rel.signatoryLevel})</span>
                              </div>
                              <div className="flex gap-1.5 mt-2">
                                {activeBios.map(item => (
                                  <Tooltip key={item.type}>
                                    <TooltipTrigger asChild>
                                      <div>
                                        <BiometricIndicator 
                                          isCaptured={item.isCaptured} 
                                          icon={item.icon} 
                                          onClick={() => {
                                            if (item.isCaptured) {
                                              setViewingBiometric({
                                                relationNo: rel.relationNo,
                                                type: item.type,
                                                name
                                              });
                                            }
                                          }}
                                        />
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-slate-800 text-white text-xs px-2 py-1 rounded">
                                      {item.label}: {item.isCaptured ? 'Captured (Click to view)' : 'Pending'}
                                    </TooltipContent>
                                  </Tooltip>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            <Button
                              onClick={() => {
                                handleLaunchUpdate(rel);
                              }}
                              className="bg-amber-500 hover:bg-amber-600 text-white text-xs h-8 px-3 rounded-[7px] font-bold flex items-center gap-1 shadow-sm"
                            >
                              <Camera className="w-3.5 h-3.5" /> Update Biometrics
                            </Button>
                            <Button
                              onClick={() => {
                                startEditRelation(rel);
                                navigateTo('step3');
                                setShowModifyModal(false);
                              }}
                              variant="outline"
                              className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs h-8 px-3 rounded-[7px] font-bold flex items-center gap-1"
                            >
                              <Edit className="w-3.5 h-3.5" /> Modify Details
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-12 border border-dashed rounded-xl bg-slate-50">
                      <User className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-slate-500">No Signatories Onboarded</p>
                      <p className="text-[10px] text-slate-400 mt-1 max-w-[280px] mx-auto">
                        Please navigate to onboarding setup to register signatory profiles for this account.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-100 shrink-0">
                  <Button
                    onClick={() => setShowModifyModal(false)}
                    className="bg-slate-800 text-white hover:bg-slate-900 text-xs h-9 px-5 rounded-[7px] font-bold shadow-sm"
                  >
                    Close
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* WIZARD CONTAINER CARD */}
        <div className={`w-full bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden h-[90vh] ${
          (currentStep === 1 && landingView === 'home')
            ? 'flex flex-col' 
            : 'grid grid-cols-1 lg:grid-cols-[360px,1fr]'
        }`}>
          
          {/* LEFT WIZARD SIDEBAR (Fading Dot Pattern & Stepper Icons) */}
          {!(currentStep === 1 && landingView === 'home') && (
            <div className="bg-[#1e293b] text-white p-6 flex flex-col justify-between relative overflow-hidden shrink-0">
              {/* Grid Pattern Background overlay (Fading from top to bottom) */}
              <div 
                className="absolute inset-0 opacity-10 pointer-events-none" 
                style={{
                  backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)',
                  backgroundSize: '16px 16px',
                  maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%)',
                  WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%)'
                }}
              ></div>
              
              {/* Header / Logo */}
              <div className="relative z-10">
                <div 
                  onClick={resetToHome}
                  className="flex items-center gap-2.5 mb-11 cursor-pointer hover:opacity-85 transition-opacity"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center font-bold text-white text-xl shadow-md shadow-blue-500/20">
                    X
                  </div>
                  <div>
                    <span className="font-bold text-xl tracking-tight">Biometric Glide</span>
                    <span className="text-blue-400 font-extrabold text-xl">.</span>
                  </div>
                </div>
   
                {/* Stepper Progress (With custom Lucide icons) */}
                <div className="space-y-4">
                  {steps.map((step, idx) => {
                    const isCompleted = currentStep > step.number;
                    const isActive = currentStep === step.number;
                    const StepIcon = step.icon;
                    return (
                      <div key={step.number} className="flex items-start gap-4 group">
                        <div className="flex flex-col items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center border font-bold text-sm transition-all duration-300 ${
                            isCompleted 
                              ? 'bg-blue-500 border-blue-500 text-white shadow-md shadow-blue-500/25' 
                              : isActive 
                              ? 'bg-white border-white text-[#1e293b] scale-105 shadow-lg shadow-white/10' 
                              : 'border-slate-700 text-slate-400 bg-transparent'
                          }`}>
                            {isCompleted ? <Check className="w-5 h-5" /> : <StepIcon className="w-4.5 h-4.5" />}
                          </div>
                          {idx < steps.length - 1 && (
                            <div className={`w-[2px] h-8 my-1 transition-colors duration-300 ${
                              isCompleted ? 'bg-blue-500' : 'bg-slate-700'
                            }`} />
                          )}
                        </div>
                        <div className="pt-1">
                          <h4 className={`text-sm font-semibold leading-snug transition-colors ${
                            isActive ? 'text-white font-extrabold' : isCompleted ? 'text-slate-300' : 'text-slate-500'
                          }`}>
                            {step.label}
                          </h4>
                          <p className={`text-xs mt-1 transition-colors ${
                            isActive ? 'text-blue-300' : 'text-slate-400'
                          }`}>
                            {step.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
   
              {/* Bottom Panel Branding */}
              <div className="relative z-10 mt-4 pt-4 border-t border-slate-800/80">
                <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-widest leading-none">Biometric Glide Suite</h5>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  {landingView === 'search'
                    ? "Enquire, verify, approve, and manage active account signatories."
                    : "Configure account profiles & register signatory biometrics."}
                </p>
              </div>
            </div>
          )}

          {/* RIGHT WORKSPACE (Elegant Light Theme) */}
          <div className="p-6 md:p-8 flex flex-col bg-white overflow-hidden relative flex-1">
            
            {/* Header controls inside Workspace */}
            {currentStep !== 1 && (
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
                
                {/* Back Button */}
                {navStack.length > 1 ? (
                  <button
                    onClick={navigateBack}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] border border-slate-200 hover:bg-slate-50 text-xs text-slate-600 font-bold transition-all"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Go Back
                  </button>
                ) : (
                  <div className="text-xs text-slate-400 font-semibold tracking-wide">Terminal</div>
                )}

                {/* Global Settings & Utilities */}
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setShowConfig(!showConfig)}
                    variant="outline"
                    size="sm"
                    className={`h-8 px-3 rounded-[7px] border-slate-200 text-slate-500 hover:text-slate-800 flex items-center gap-1.5 text-xs font-bold ${
                      showConfig ? 'bg-slate-50 text-slate-800' : ''
                    }`}
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )}

            {/* EXPANDABLE GLOBAL SETTINGS (Collapsed on Load) */}
            {showConfig && (
              <div className="my-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 grid grid-cols-2 md:grid-cols-4 gap-3 transition-all duration-300 shrink-0">
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-slate-500">Captured by</Label>
                  <Input value={teller} onChange={(e) => setTeller(e.target.value)} className="bg-white border-slate-200 h-8 text-xs text-slate-700 rounded-[7px]" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-slate-500">Approved By</Label>
                  <Input value={supervisor} onChange={(e) => setSupervisor(e.target.value)} className="bg-white border-slate-200 h-8 text-xs text-slate-700 rounded-[7px]" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-slate-500">Hostname</Label>
                  <Input value={hostname} onChange={(e) => setHostname(e.target.value)} className="bg-white border-slate-200 h-8 text-xs text-slate-700 rounded-[7px]" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-slate-500">Terminal IP</Label>
                  <Input value={terminalIp} onChange={(e) => setTerminalIp(e.target.value)} className="bg-white border-slate-200 h-8 text-xs text-slate-700 rounded-[7px]" />
                </div>
              </div>
            )}

            {/* DYNAMIC STEPS DISPLAY */}
            <div className="flex-1 overflow-y-auto py-4 pr-1">
              
              {/* STEP 1: PORTAL LANDING PAGE */}
              {currentStep === 1 && (
                <div className="flex-1 flex flex-col justify-center">
                  {landingView === 'home' && renderLandingHome()}
                  {landingView === 'create' && renderLandingCreate()}
                  {landingView === 'search' && renderLandingSearch()}
                </div>
              )}

              {/* STEP 3: MANAGE SIGNATORY RELATIONS */}
              {currentStep === 3 && (
                <div className="space-y-5">
                  
                  {/* Account Header info */}
                  <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-1.5 text-[9px] font-bold text-blue-600 uppercase tracking-wide">
                        <Landmark className="w-3 h-3" /> Account Profile Active
                      </div>
                      <h3 className="text-base font-bold text-slate-800 font-mono mt-0.5">#{activeAccNo} {accName ? `- ${accName}` : ''}</h3>
                      <p className="text-[10px] text-slate-500 mt-0.5">Mandate: <strong className="text-slate-700">{accMandate}</strong></p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={() => navigateTo('create')}
                        variant="outline"
                        size="sm"
                        className="h-8 px-3.5 text-xs font-bold border-slate-200 text-slate-600 hover:bg-slate-50 rounded-[7px]"
                      >
                        Edit Mandate
                      </Button>
                      <Button
                        onClick={() => handleDeleteAccount(activeAccNo)}
                        variant="ghost"
                        size="sm"
                        className="h-8 px-3 text-xs font-bold text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-[7px] flex items-center gap-1"
                        title="Delete current account configuration"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete Account
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5 items-stretch">
                    
                    {/* Unified Add/Edit Signatory Form (collapsible, hides table) */}
                    {showAddSignatory && (
                      <form onSubmit={handleSaveRelation} className="max-w-2xl mx-auto w-full p-6 rounded-2xl border-2 border-blue-500/30 bg-white space-y-6 shadow-md shadow-blue-500/5 animate-in fade-in duration-300">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                          <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <Plus className="w-5 h-5 text-blue-600" />
                            <span>{editingRelNo ? 'Edit Signatory Profile' : 'Onboard New Signatory'}</span>
                          </h4>
                          <button
                            type="button"
                            onClick={handleCancelOnboarding}
                            className="text-slate-400 hover:text-slate-600 transition-colors text-xs font-semibold p-1"
                          >
                            Close
                          </button>
                        </div>

                        {/* Form Fields Grid */}
                        <div className="space-y-4">
                          {/* Row 1: National ID (Full Width) */}
                          <div className="space-y-1.5">
                            <Label htmlFor="national-id" className="text-[10px] uppercase font-bold text-slate-500">National ID Number</Label>
                            <Input
                              id="national-id"
                              placeholder="e.g. ID12345"
                              value={nationalId}
                              onChange={(e) => handleNationalIdChange(e.target.value)}
                              className="border-slate-200 h-10 text-xs font-mono text-slate-800 bg-white rounded-[7px] w-full"
                            />
                            {isDuplicateNationalId && (
                              <p className="text-red-500 text-[10px] mt-1 font-semibold flex items-center gap-1 animate-in fade-in">
                                <AlertCircle className="w-3.5 h-3.5" />
                                This signatory is already registered to this account. Duplicate National ID check failed.
                              </p>
                            )}
                          </div>

                          {/* Row 2: First Name, Surname, Other Names (3 columns on same row) */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                              <Label htmlFor="first-name" className="text-[10px] uppercase font-bold text-slate-500">First Name</Label>
                              <Input
                                id="first-name"
                                placeholder="e.g. John"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="border-slate-200 h-10 text-xs text-slate-800 bg-white rounded-[7px]"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <Label htmlFor="surname" className="text-[10px] uppercase font-bold text-slate-500">Surname</Label>
                              <Input
                                id="surname"
                                placeholder="e.g. Doe"
                                value={surname}
                                onChange={(e) => setSurname(e.target.value)}
                                className="border-slate-200 h-10 text-xs text-slate-800 bg-white rounded-[7px]"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <Label htmlFor="other-name" className="text-[10px] uppercase font-bold text-slate-500">Other Names</Label>
                              <Input
                                id="other-name"
                                placeholder="Optional"
                                value={otherName}
                                onChange={(e) => setOtherName(e.target.value)}
                                className="border-slate-200 h-10 text-xs text-slate-800 bg-white rounded-[7px]"
                              />
                            </div>
                          </div>

                          {/* Row 3: Signatory Level & Daily Amount Limit (paired on the next row with distinct background.) */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/60">
                            <div className="space-y-1.5">
                              <Label htmlFor="sig-level" className="text-[10px] uppercase font-bold text-slate-500">Signatory Level</Label>
                              <Select value={sigLevel} onValueChange={setSigLevel}>
                                <SelectTrigger className="border-slate-200 h-10 text-xs bg-white focus:ring-blue-500 rounded-[7px]">
                                  <SelectValue placeholder="Select level" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-slate-200 text-slate-800">
                                  {SIGNATORY_LEVELS.map(lvl => (
                                    <SelectItem key={lvl} value={lvl} className="text-xs focus:bg-slate-50">{lvl}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-1.5">
                              <Label htmlFor="amt-limit" className="text-[10px] uppercase font-bold text-slate-500">Daily Amount Limit ($)</Label>
                              <Input
                                id="amt-limit"
                                type="number"
                                value={amtLimit}
                                onChange={(e) => setAmtLimit(e.target.value)}
                                className="border-slate-200 h-10 text-xs font-mono text-slate-800 bg-white rounded-[7px]"
                              />
                            </div>
                          </div>
                        </div>

                        {existingCustomer && (
                          <div className="p-3 bg-emerald-50 border border-emerald-200/60 text-emerald-800 rounded-xl text-xs space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
                            <div className="font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>Existing Customer Profile Detected</span>
                            </div>
                            <p className="opacity-90 leading-tight">Biometrics captured in another account profile will be associated automatically:</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-emerald-200/30">
                              {getActiveBiometrics(existingCustomer).map(item => (
                                <div key={item.type} className="flex items-center gap-1.5 bg-white/60 p-1.5 rounded-lg border border-emerald-100">
                                  <div className={`w-2 h-2 rounded-full ${item.isCaptured ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                  <span className={`text-[10px] ${item.isCaptured ? 'font-bold text-emerald-900' : 'text-slate-400'}`}>{item.label}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Capture/Update Console Section */}
                        {tempRelNo && (() => {
                          const relObjForStatus = relations[tempRelNo] || existingCustomer;
                          const isUpdateMode = !!editingRelNo || !!existingCustomer || anyCaptureConfirmed;
                          const consoleHeader = isUpdateMode ? "Biometric Update Console" : "Biometric Capture Console";
                          const consoleButtonText = isUpdateMode ? "Open Update Console" : "Open Capture Console";

                          const handleConsoleClick = () => {
                            if (isUpdateMode) {
                              const currentRelObj = relations[tempRelNo] || existingCustomer || {
                                relationNo: tempRelNo,
                                amtlimit: parseFloat(amtLimit) || 0
                              };
                              handleLaunchUpdate(currentRelObj as StandaloneRelation);
                            } else {
                              handleOpenCaptureWindow();
                            }
                          };

                          return (
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 space-y-4">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div className="space-y-0.5">
                                  <h5 className="text-xs font-bold text-slate-900">{consoleHeader}</h5>
                                  <p className="text-[10px] text-slate-500">Launch capture screen to register or update biometric specimens.</p>
                                </div>

                                {relObjForStatus && (() => {
                                  const activeBios = getActiveBiometrics(relObjForStatus);
                                  return (
                                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-100 shadow-sm shrink-0">
                                      <div className="flex items-center gap-1">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Status:</span>
                                        <button
                                          type="button"
                                          onClick={handleSyncCaptureStatus}
                                          className="text-blue-600 hover:text-blue-700 p-0.5 rounded-[7px] hover:bg-slate-100"
                                          title="Sync status with server"
                                        >
                                          <RefreshCw className="w-3 h-3" />
                                        </button>
                                      </div>
                                      <div className="flex gap-1.5">
                                        {activeBios.map(item => (
                                          <Tooltip key={item.type}>
                                            <TooltipTrigger asChild>
                                              <div>
                                                <BiometricIndicator
                                                  isCaptured={item.isCaptured}
                                                  icon={item.icon}
                                                  onClick={() => setViewingBiometric({
                                                    relationNo: tempRelNo,
                                                    type: item.type,
                                                    name: `${firstName} ${surname}`.trim()
                                                  })}
                                                />
                                              </div>
                                            </TooltipTrigger>
                                            <TooltipContent className="bg-slate-800 text-white text-xs px-2 py-1 rounded">
                                              {item.label}: {item.isCaptured ? 'Captured (Click to view)' : 'Pending (Click to view)'}
                                            </TooltipContent>
                                          </Tooltip>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>

                              <Button
                                type="button"
                                onClick={handleConsoleClick}
                                disabled={!firstName.trim() || !surname.trim() || !nationalId.trim() || isDuplicateNationalId}
                                className="w-full bg-blue-600 text-white hover:bg-blue-700 font-bold h-10 text-xs rounded-[7px] flex items-center justify-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Camera className="w-4 h-4 animate-pulse" /> {consoleButtonText}
                              </Button>
                            </div>
                          );
                        })()}

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-4 border-t border-slate-100 justify-end">
                          <Button
                            type="button"
                            onClick={handleCancelOnboarding}
                            variant="outline"
                            className="px-5 border-slate-200 hover:bg-slate-50 text-slate-600 font-bold h-10 text-xs rounded-[7px]"
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            disabled={!isFormComplete || isDuplicateNationalId || (!anyCaptureConfirmed && !existingCustomer)}
                            className="px-6 bg-blue-600 text-white hover:bg-blue-700 font-bold h-10 text-xs rounded-[7px] shadow-sm"
                          >
                            {editingRelNo ? 'Apply Changes' : 'Complete Onboarding'}
                          </Button>
                        </div>
                      </form>
                    )}

                    {/* Table View (visible when form is closed) */}
                    {!showAddSignatory && (
                      <div className="flex flex-col justify-between space-y-4">
                        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm max-h-[380px] overflow-y-auto bg-white">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead className="sticky top-0 z-10">
                              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase text-[9px] tracking-wider">
                                <th className="py-2.5 px-4">Signatory Details</th>
                                <th className="py-2.5 px-2">Level / Limit</th>
                                <th className="py-2.5 px-4">Bio Data Captured</th>
                                <th className="py-2.5 px-4 text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {activeRelations.map(rel => {
                                const name = `${rel.firstName} ${rel.otherName || ''} ${rel.surname}`.trim();
                                const isRowOnboarding = rel.relationNo === currentOnboardingRelNo;
                                const firstInitial = rel.firstName ? rel.firstName.charAt(0).toUpperCase() : '';
                                const lastInitial = rel.surname ? rel.surname.charAt(0).toUpperCase() : '';
                                const initials = `${firstInitial}${lastInitial}` || '??';
                                const colorClass = getInitialsColor(name);
                                
                                return (
                                  <tr key={rel.relationNo} className="hover:bg-slate-50/50 bg-white transition-colors duration-200">
                                    <td className="py-3 px-4">
                                      <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 ${colorClass}`}>
                                          {initials}
                                        </div>
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <div className="font-bold text-slate-800 leading-tight">{name}</div>
                                            {isRowOnboarding && (
                                              <span className="text-[8px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                                                Onboarding
                                              </span>
                                            )}
                                          </div>
                                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">National ID: {rel.nationalId}</div>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="py-3 px-2">
                                      <span className="text-[9px] bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-full font-bold text-slate-600">
                                        {rel.signatoryLevel}
                                      </span>
                                      <div className="text-[10px] text-slate-600 mt-1 font-mono font-bold px-2">
                                        ${new Intl.NumberFormat('en-US').format(rel.amtlimit || 0)}
                                      </div>
                                    </td>
                                    <td className="py-3 px-2">
                                      <div className="flex gap-1.5">
                                        {getActiveBiometrics(rel).map(item => (
                                          <Tooltip key={item.type}>
                                            <TooltipTrigger asChild>
                                              <div>
                                                <BiometricIndicator 
                                                  isCaptured={item.isCaptured} 
                                                  icon={item.icon} 
                                                  onClick={() => setViewingBiometric({
                                                    relationNo: rel.relationNo,
                                                    type: item.type,
                                                    name
                                                  })}
                                                />
                                              </div>
                                            </TooltipTrigger>
                                            <TooltipContent className="bg-slate-800 text-white text-xs px-2 py-1 rounded">
                                              {item.label}: {item.isCaptured ? 'Captured (Click to view)' : 'Pending (Click to view)'}
                                            </TooltipContent>
                                          </Tooltip>
                                        ))}
                                      </div>
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                      <div className="flex items-center justify-end gap-1">
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              onClick={() => handleLaunchEnquiryRelation(rel.relationNo)}
                                              variant="ghost"
                                              size="icon"
                                              className="w-7 h-7 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-[7px]"
                                            >
                                              <Eye className="w-3.5 h-3.5" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent className="bg-slate-800 text-white text-xs px-2 py-1 rounded-[7px]">
                                            View Signatory Profile Specimen
                                          </TooltipContent>
                                        </Tooltip>

                                        <Button
                                          onClick={() => startEditRelation(rel)}
                                          variant="ghost"
                                          size="icon"
                                          className="w-7 h-7 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-[7px]"
                                        >
                                          <Edit className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button
                                          onClick={() => handleDeleteRelation(rel.relationNo)}
                                          variant="ghost"
                                          size="icon"
                                          className="w-7 h-7 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-[7px]"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                              {activeRelations.length === 0 && (
                                <tr>
                                  <td colSpan={4} className="py-8 text-center text-slate-400">
                                    No signatory relations configured yet. Please onboard signatory relations to display here.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <Button
                            onClick={startAddRelation}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 px-4 rounded-[7px] flex items-center gap-2 shadow-sm"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add Signatory
                          </Button>

                          {activeRelations.length > 0 && (
                            <Button
                              onClick={handleCompleteAndReset}
                              variant="outline"
                              className="border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-bold text-xs h-9 px-5 rounded-[7px] flex items-center gap-2 shadow-sm"
                            >
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              Finish &amp; Start New Account
                            </Button>
                          )}
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              )}

            </div>

            {/* Bottom Stepper Actions wrapper */}
            {currentStep !== 1 && (
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 shrink-0">
                <div>
                  Account Active: <strong className="font-mono text-slate-600">{activeAccNo || 'None'}</strong>
                </div>
                <div>
                  Step {currentStep} of 3
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </TooltipProvider>
  );
}

function BiometricIndicator({ 
  isCaptured, 
  icon: Icon,
  onClick
}: { 
  isCaptured?: boolean; 
  icon: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-7 h-7 rounded-[7px] border flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
        isCaptured 
          ? 'bg-blue-50 text-blue-600 border-blue-200 scale-100 shadow-sm hover:bg-blue-100' 
          : 'bg-slate-50 text-slate-400 border-slate-100 scale-95 opacity-60 hover:opacity-100 hover:bg-slate-100'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
    </button>
  );
}