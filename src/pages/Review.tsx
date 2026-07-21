import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  Camera,
  FileText,
  Fingerprint as FingerprintIcon,
  RefreshCw,
} from 'lucide-react';
import { StepCard } from '@/components/StepCard';
import { Button } from '@/components/ui/button';
import { useBiometric } from '@/hooks/useBiometric';

export function Review() {
  const { state, dispatch } = useBiometric();
  const [viewingImage, setViewingImage] = useState<{ src: string; title: string } | null>(null);

  const config = state?.activityConfig;

  const hasPhotoSignature = !!(state?.data?.photo || state?.data?.signature);
  const hasIdentification =
    !!(config?.identification?.status && (state?.data?.idFront || state?.data?.idBack));
  const hasFingerprint =
    !!(config?.fingerprint?.status && (state?.data?.thumbprint1 || state?.data?.thumbprint2));

  const submittedCount =
    Number(hasPhotoSignature) +
    Number(hasIdentification) +
    Number(hasFingerprint);

  const isOnlyPhotoSignature = submittedCount === 1 && hasPhotoSignature;

  const startNewCapture = () => {
    if (window.confirm('Start a new biometric capture session?')) {
      dispatch({ type: 'RESET' });
      window.location.reload();
    }
  };

  const closeTab = () => {
    window.close();
  };

  return (
    <StepCard>
      {/* Large Image View Modal */}
      {viewingImage && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 cursor-pointer backdrop-blur-xs"
          onClick={() => setViewingImage(null)}
        >
          <div className="relative max-w-4xl max-h-[85vh] bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-2xl flex flex-col items-center">
            <div className="w-full flex justify-between items-center mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{viewingImage.title}</span>
              <button 
                onClick={() => setViewingImage(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm flex items-center justify-center"
              >
                ✕
              </button>
            </div>
            <img 
              src={viewingImage.src} 
              alt={viewingImage.title} 
              className="max-h-[75vh] max-w-full object-contain rounded-xl border border-slate-200"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`max-w-5xl mx-auto ${
          isOnlyPhotoSignature ? 'max-w-2xl' : ''
        }`}
      >
        {/* Dynamic Header */}
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="inline-block"
          >
            <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-1" />
          </motion.div>
          <h5 className="text-xl font-bold text-foreground mb-1">
            {window.location.pathname.includes('update')
              ? 'Biometric Update Complete!'
              : 'Biometric Capture Complete!'}
          </h5>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {window.location.pathname.includes('update')
              ? 'All biometrics have been successfully updated and saved.'
              : 'All required information has been successfully captured and saved.'}
          </p>
        </div>

        {/* Final Actions */}
        <div className="text-center space-y-8">
          <div className="bg-gray-50 rounded-2xl p-8 max-w-3xl mx-auto border border-gray-200 text-center">
            <p className="text-lg font-bold text-foreground mb-1">
              Your session is complete.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              The following biometric and verification data was submitted (click any image to view large size):
            </p>

            <div className="flex flex-wrap justify-center gap-4 mb-6">
              {state?.data?.photo && (
                <div 
                  onClick={() => setViewingImage({ src: state.data.photo!, title: 'Portrait Photo' })}
                  className="bg-white rounded-xl border border-slate-200/60 p-3 shadow-sm flex flex-col items-center w-full max-w-[160px] shrink-0 cursor-pointer hover:border-primary transition-all group"
                >
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide mb-2 block text-center">Portrait Photo</span>
                  <div className="h-24 w-full rounded-lg bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100 p-1 group-hover:scale-105 transition-transform">
                    <img src={state.data.photo} alt="Portrait" className="max-h-full max-w-full object-contain rounded" />
                  </div>
                </div>
              )}

              {state?.data?.signature && (
                <div 
                  onClick={() => setViewingImage({ src: state.data.signature!, title: 'Signature' })}
                  className="bg-white rounded-xl border border-slate-200/60 p-3 shadow-sm flex flex-col items-center w-full max-w-[160px] shrink-0 cursor-pointer hover:border-primary transition-all group"
                >
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide mb-2 block text-center">Signature</span>
                  <div className="h-24 w-full rounded-lg bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100 p-1 group-hover:scale-105 transition-transform">
                    <img src={state.data.signature} alt="Signature" className="max-h-full max-w-full object-contain rounded" />
                  </div>
                </div>
              )}

              {state?.data?.idFront && (
                <div 
                  onClick={() => setViewingImage({ src: state.data.idFront!, title: 'ID Front' })}
                  className="bg-white rounded-xl border border-slate-200/60 p-3 shadow-sm flex flex-col items-center w-full max-w-[160px] shrink-0 cursor-pointer hover:border-primary transition-all group"
                >
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide mb-2 block text-center">ID Front</span>
                  <div className="h-24 w-full rounded-lg bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100 p-1 group-hover:scale-105 transition-transform">
                    <img src={state.data.idFront} alt="ID Front" className="max-h-full max-w-full object-contain rounded" />
                  </div>
                </div>
              )}

              {state?.data?.idBack && (
                <div 
                  onClick={() => setViewingImage({ src: state.data.idBack!, title: 'ID Back' })}
                  className="bg-white rounded-xl border border-slate-200/60 p-3 shadow-sm flex flex-col items-center w-full max-w-[160px] shrink-0 cursor-pointer hover:border-primary transition-all group"
                >
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide mb-2 block text-center">ID Back</span>
                  <div className="h-24 w-full rounded-lg bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100 p-1 group-hover:scale-105 transition-transform">
                    <img src={state.data.idBack} alt="ID Back" className="max-h-full max-w-full object-contain rounded" />
                  </div>
                </div>
              )}

              {state?.data?.thumbprint1 && (
                <div 
                  onClick={() => setViewingImage({ src: state.data.thumbprint1!, title: 'Primary Fingerprint' })}
                  className="bg-white rounded-xl border border-slate-200/60 p-3 shadow-sm flex flex-col items-center w-full max-w-[160px] shrink-0 cursor-pointer hover:border-primary transition-all group"
                >
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide mb-2 block text-center">Primary Fingerprint</span>
                  <div className="h-24 w-full rounded-lg bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100 p-1 group-hover:scale-105 transition-transform">
                    <img src={state.data.thumbprint1} alt="Primary Fingerprint" className="max-h-full max-w-full object-contain rounded" />
                  </div>
                </div>
              )}

              {state?.data?.thumbprint2 && (
                <div 
                  onClick={() => setViewingImage({ src: state.data.thumbprint2!, title: 'Secondary Fingerprint' })}
                  className="bg-white rounded-xl border border-slate-200/60 p-3 shadow-sm flex flex-col items-center w-full max-w-[160px] shrink-0 cursor-pointer hover:border-primary transition-all group"
                >
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide mb-2 block text-center">Secondary Fingerprint</span>
                  <div className="h-24 w-full rounded-lg bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100 p-1 group-hover:scale-105 transition-transform">
                    <img src={state.data.thumbprint2} alt="Secondary Fingerprint" className="max-h-full max-w-full object-contain rounded" />
                  </div>
                </div>
              )}
            </div>

            <p className="text-muted-foreground text-sm">
              You may now safely close this tab or window.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {/* <Button
              onClick={startNewCapture}
              size="lg"
              className="rounded-full px-10 py-6 gradient-primary shadow-button text-lg font-semibold flex items-center gap-3"
            >
              <RefreshCw className="w-5 h-5" />
              Start New Capture
            </Button> */}

            <Button
              onClick={closeTab}
              variant="outline"
              size="lg"
              className="rounded-full px-10 py-6 text-lg"
            >
              Close This Tab
            </Button>
          </div>

          <p className="text-sm text-blue-400 mt-8 animate-pulse italic">
            {/* Need help? Contact support at support@bank.com */}
            Powered by x100
          </p>
        </div>
      </motion.div>
    </StepCard>
  );
}