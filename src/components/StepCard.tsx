import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface StepCardProps {
  children: ReactNode;
  className?: string;
}

export function StepCard({ children, className = '' }: StepCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`bg-card rounded-2xl shadow-card p-8 border border-border/50 ${className}`}
    >
      {children}
    </motion.div>
  );
}