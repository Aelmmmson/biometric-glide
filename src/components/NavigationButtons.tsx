import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface NavigationButtonsProps {
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  isNextDisabled?: boolean;
  showNext?: boolean;
  nextLabel?: string;
}

export function NavigationButtons({
  currentStep,
  totalSteps,
  onBack,
  onNext,
  isNextDisabled = false,
  showNext = true,
  nextLabel = 'Next'
}: NavigationButtonsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="flex justify-between items-center pt-6"
    >
      <Button
        variant="outline"
        onClick={onBack}
        disabled={currentStep === 1}
        className="rounded-full px-6 py-3 font-medium transition-all duration-300 hover:shadow-button"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <div className="text-sm text-muted-foreground">
        Step {currentStep} of {totalSteps}
      </div>

      {showNext && (
        <Button
          onClick={onNext}
          disabled={isNextDisabled}
          className="rounded-full px-6 py-3 font-medium gradient-primary hover:shadow-button transition-all duration-300 disabled:opacity-50"
        >
          {nextLabel}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      )}
    </motion.div>
  );
}