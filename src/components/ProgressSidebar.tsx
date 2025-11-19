import { motion } from 'framer-motion';
import { Check, Camera, FileText, Fingerprint, CheckCircle } from 'lucide-react';

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
  const isUpdateMode = mode === 'update';
  const headerTitle = isUpdateMode ? 'Update Bio Data' : 'Biometric Capture';
  const headerDescription = isUpdateMode
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

      <div className="mt-20 pt-5 border-t border-sidebar-border">
        {isUpdateMode && relationNo && (
          <p className="text-sm text-sidebar-primary">Relation No: {relationNo}</p>
        )}
        <p className="text-sm text-sidebar-foreground/60">
          Your data is encrypted and secure.
        </p>
      </div>
    </div>
  );
}