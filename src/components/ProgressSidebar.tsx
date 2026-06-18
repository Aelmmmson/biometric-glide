import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Camera, FileText, Fingerprint, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useBiometric } from '@/hooks/useBiometric';

interface StepConfig {
  id: number;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  enabled: boolean; // Controlled by backend
}

interface ProgressSidebarProps {
  currentStep: number;        // Logical step (1 = Photo, 2 = ID, 3 = FP, 4 = Review)
  completedSteps: number[];  // Logical step IDs that are completed
  visibleSteps?: number[];   // Which logical steps are visible (e.g., [1,2,4] if FP skipped)
  mode?: 'capture' | 'update';
  relationNo?: string | null;
}

export function ProgressSidebar({
  currentStep,
  completedSteps,
  visibleSteps = [1, 2, 3, 4], // Default: all enabled
  mode = 'capture',
  relationNo,
}: ProgressSidebarProps) {
  const [isSessionDetailsOpen, setIsSessionDetailsOpen] = useState(true);
  const { state } = useBiometric();
  const { params } = state;
  const isUpdateMode = mode === 'update';
  const isApprovalMode = window.location.pathname.includes('approval') || !!params.approvedBy;

  const headerTitle = isApprovalMode 
    ? 'Approval Review' 
    : isUpdateMode 
    ? 'Update Bio Data' 
    : 'Biometric Capture';

  const headerDescription = isApprovalMode
    ? 'Review and verify customer data.'
    : isUpdateMode
    ? 'Update all steps to refresh your identity.'
    : 'Complete all steps to verify your identity.';

  // Map logical step → config
  const allSteps: StepConfig[] = [
    {
      id: 1,
      title: 'Photo & Signature',
      description: 'Capture your photo and signature',
      icon: Camera,
      enabled: visibleSteps.includes(1),
    },
    {
      id: 2,
      title: 'Identification',
      description: 'Verify your ID document',
      icon: FileText,
      enabled: visibleSteps.includes(2),
    },
    {
      id: 3,
      title: 'Fingerprint',
      description: 'Capture your fingerprint',
      icon: Fingerprint,
      enabled: visibleSteps.includes(3),
    },
    {
      id: 4,
      title: 'Review & Submit',
      description: 'Review and confirm all data',
      icon: CheckCircle,
      enabled: true, // Review is always enabled
    },
  ];

  // Filter only enabled steps
  const steps = allSteps.filter(step => step.enabled);

  // Map logical currentStep → visible index (for highlighting correct bubble)
  const visibleCurrentIndex = steps.findIndex(s => s.id === currentStep);

  const ParameterRow = ({ label, value }: { label: string, value?: string }) => {
    if (!value) return null;
    return (
      <div className="flex justify-between items-center py-1 border-b border-sidebar-border/30 last:border-0">
        <span className="text-[10px] uppercase tracking-wider text-sidebar-foreground/50">{label}</span>
        <span className="text-xs font-mono font-medium text-sidebar-primary truncate ml-2" title={value}>{value}</span>
      </div>
    );
  };

  return (
    <div className="bg-sidebar text-sidebar-foreground p-8 rounded-2xl shadow-card h-fit sticky top-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">{headerTitle}</h2>
        <p className="text-sidebar-foreground/70 text-sm">{headerDescription}</p>
      </div>

      <div className="space-y-6">
        {steps.map((step, index) => {
          const logicalId = step.id;
          const isCompleted = completedSteps.includes(logicalId);
          const isCurrent = currentStep === logicalId;
          const Icon = step.icon;

          return (
            <motion.div
              key={logicalId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-4"
            >
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  isCompleted
                    ? 'bg-sidebar-primary border-sidebar-primary text-sidebar-primary-foreground'
                    : isCurrent
                    ? 'border-sidebar-primary text-sidebar-primary bg-sidebar-accent'
                    : 'border-sidebar-border text-sidebar-foreground/50'
                }`}
              >
                {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
              </div>

              <div className="flex-1 min-w-0">
                <h3
                  className={`font-semibold transition-colors duration-300 ${
                    isCompleted || isCurrent ? 'text-sidebar-foreground' : 'text-sidebar-foreground/50'
                  }`}
                >
                  {step.title}
                </h3>
                <p
                  className={`text-sm transition-colors duration-300 ${
                    isCompleted || isCurrent ? 'text-sidebar-foreground/70' : 'text-sidebar-foreground/40'
                  }`}
                >
                  {step.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-12 pt-6 border-t border-sidebar-border/50">
        <button 
          onClick={() => setIsSessionDetailsOpen(!isSessionDetailsOpen)}
          className="w-full flex items-center justify-between mb-3 group transition-colors"
        >
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/30 group-hover:text-sidebar-foreground/50">Session Details</h4>
          {isSessionDetailsOpen ? (
            <ChevronUp className="w-3 h-3 text-sidebar-foreground/30 group-hover:text-sidebar-foreground/50" />
          ) : (
            <ChevronDown className="w-3 h-3 text-sidebar-foreground/30 group-hover:text-sidebar-foreground/50" />
          )}
        </button>
        
        <AnimatePresence initial={false}>
          {isSessionDetailsOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="space-y-1">
                {isApprovalMode ? (
                  <>
                    <ParameterRow label="Batch" value={params.batch} />
                    <ParameterRow label="Cust No" value={params.custNo} />
                    <ParameterRow label="Approved By" value={params.approvedBy} />
                    <ParameterRow label="Hostname" value={params.hostname} />
                    <ParameterRow label="Terminal IP" value={params.terminalIp} />
                  </>
                ) : isUpdateMode ? (
                  <>
                    <ParameterRow label="Batch" value={params.batch} />
                    <ParameterRow label="Mandate" value={params.mandate} />
                    <ParameterRow label="Limit" value={params.limit} />
                    <ParameterRow label="Captured By" value={params.capturedBy} />
                    <ParameterRow label="Captured Date" value={params.capturedDate} />
                  </>
                ) : (
                  <>
                    <ParameterRow label="Captured By" value={params.capturedBy} />
                    <ParameterRow label="Captured Date" value={params.capturedDate} />
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-6 flex items-center gap-2 text-[10px] text-sidebar-foreground/40">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          Secure Session Active
        </div>
      </div>
    </div>
  );
}