import { useContext } from 'react';
import { BiometricContext } from '../contexts/BiometricContext';

export function useBiometric() {
  const context = useContext(BiometricContext);
  if (!context) throw new Error('useBiometric must be used within BiometricProvider');
  return context;
}
