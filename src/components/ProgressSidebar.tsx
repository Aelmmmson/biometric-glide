import { motion } from 'framer-motion';
import { Check, Camera, FileText, Fingerprint, CheckCircle } from 'lucide-react';
import { useBiometric } from '@/contexts/BiometricContext';

const steps = [
  {
    id: 1,
    title: 'Photo & Signature',
    description: 'Capture your photo and signature',
    icon: Camera,
  },
  {
    id: 2,
    title: 'Passport Upload',
    description: 'Upload or scan your passport',
    icon: FileText,
  },
  {
    id: 3,
    title: 'Fingerprint',
    description: 'Capture your fingerprint',
    icon: Fingerprint,
  },
  {
    id: 4,
    title: 'Confirmation',
    description: 'Review and submit your data',
    icon: CheckCircle,
  },
];


export function ProgressSidebar() {
  const { state } = useBiometric();
  
  // Determine completed steps based on submitted data
  const getCompletedSteps = () => {
    const completed = [];
    
    // Step 1 is completed if both photo and signature are captured
    if (state.data.photo && state.data.signature) {
      completed.push(1);
    }
    
    // Step 2 is completed if identification is captured based on type
    const id = state.data.identification;
    if (id.type && id.front && (id.type === 'passport' || id.type === 'voter_id' || id.back)) {
      completed.push(2);
    }
    
    // Step 3 is completed if fingerprint is captured
    if (state.data.fingerprint) {
      completed.push(3);
    }
    
    return completed;
  };

  const completedSteps = getCompletedSteps();
  const currentStep = state.currentStep;

  return (
    <div className="bg-sidebar text-sidebar-foreground p-8 rounded-2xl shadow-card h-fit sticky top-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Biometric Capture</h2>
        <p className="text-sidebar-foreground/70">
          Complete all steps to verify your identity.
        </p>
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

      <div className="mt-8 pt-6 border-t border-sidebar-border">
        <p className="text-sm text-sidebar-foreground/60">
          Your data is encrypted and secure.
        </p>
      </div>
    </div>
  );
}

interface MobileStepIndicatorProps {
  step: number;
  title: string;
  isActive: boolean;
  isCompleted: boolean;
  hasData?: boolean;
}

function MobileStepIndicator({ step, title, isActive, isCompleted, hasData }: MobileStepIndicatorProps) {
  return (
    <div className="flex flex-col items-center space-y-1 flex-1">
      <div className={`
        w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300
        ${isCompleted 
          ? 'bg-green-500 text-white' 
          : isActive 
            ? 'bg-primary text-white animate-pulse' 
            : hasData 
              ? 'bg-primary/20 text-primary' 
              : 'bg-muted text-muted-foreground'
        }
      `}>
        {isCompleted ? '✓' : step}
      </div>
      <span className={`text-xs font-medium text-center ${
        isActive ? 'text-primary' : isCompleted ? 'text-green-600' : 'text-muted-foreground'
      }`}>
        {title}
      </span>
    </div>
  );
}