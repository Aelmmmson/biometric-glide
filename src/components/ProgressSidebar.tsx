import { motion } from 'framer-motion';
import { Check, Camera, FileText, Fingerprint, CheckCircle } from 'lucide-react';

const steps = [
  {
    id: 1,
    title: 'Photo & Signature',
    description: 'Capture your photo and signature',
    icon: Camera,
  },
  {
    id: 2,
    title: 'Identification',
    description: 'Verify your ID document',
    icon: FileText,
  },
  {
    id: 3,
    title: 'Fingerprint',
    description: 'Capture your fingerprint',
    icon: Fingerprint,
  },
  // {
  //   id: 4,
  //   title: 'Confirmation',
  //   description: 'Review submitted data',
  //   icon: CheckCircle,
  // },
];

interface ProgressSidebarProps {
  currentStep: number;
  completedSteps: number[];
  mode?: 'capture' | 'update';
  relationNo?: string | null;
}

export function ProgressSidebar({ currentStep, completedSteps, mode = 'capture', relationNo }: ProgressSidebarProps) {
  const isUpdateMode = mode === 'update';
  const headerTitle = isUpdateMode ? 'Update Bio Data' : 'Biometric Capture';
  const headerDescription = isUpdateMode 
    ? 'Update all steps to refresh your identity.' 
    : 'Complete all steps to verify your identity.';

  return (
    <div className="bg-sidebar text-sidebar-foreground p-8 rounded-2xl shadow-card h-fit sticky top-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">{headerTitle}</h2>
        <p className="text-sidebar-foreground/70 text-sm">
          {headerDescription}
        </p>
        {/* {isUpdateMode && relationNo && (
          <p className="text-sm text-sidebar-primary mt-2">
            Relation No: {relationNo}
          </p>
        )} */}
      </div>

      <div className="space-y-6">
        {steps.map((step) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = currentStep === step.id;
          const Icon = step.icon;

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: step.id * 0.1 }}
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
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3
                  className={`font-semibold transition-colors duration-300 ${
                    isCompleted || isCurrent
                      ? 'text-sidebar-foreground'
                      : 'text-sidebar-foreground/50'
                  }`}
                >
                  {step.title}
                </h3>
                <p
                  className={`text-sm transition-colors duration-300 ${
                    isCompleted || isCurrent
                      ? 'text-sidebar-foreground/70'
                      : 'text-sidebar-foreground/40'
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
          <p className="text-sm text-sidebar-primary">
            Relation No: {relationNo}
          </p>
        )}
        <p className="text-sm text-sidebar-foreground/60">
          Your data is encrypted and secure.
        </p>
      </div>
    </div>
  );
}