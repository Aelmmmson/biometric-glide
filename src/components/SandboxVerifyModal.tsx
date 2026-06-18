import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, UploadCloud, X, Loader2, CheckCircle2, AlertTriangle, FileImage, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SignatureVerificationResponse {
  score: number;
  is_match: boolean;
  status: string;
  message?: string;
  phases?: {
    stroke_histogram: number;
    ssim: number;
    orb_keypoints: number;
    density: number;
    hu_moments: number;
  }
}

interface SandboxVerifyModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SandboxVerifyModal = ({ isOpen, onClose }: SandboxVerifyModalProps) => {
    const [imageA, setImageA] = useState<string | null>(null);
    const [imageB, setImageB] = useState<string | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [result, setResult] = useState<SignatureVerificationResponse | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string | null>>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                setter(event.target.result as string);
                setResult(null); // Reset results when a new image is loaded
            }
        };
        reader.readAsDataURL(file);
    };

    const triggerVerification = async () => {
        if (!imageA || !imageB) return;
        setIsVerifying(true);
        setResult(null);

        try {
            const res = await fetch('http://127.0.0.1:8130/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    cheque_image: imageA,
                    mandate_image: imageB,
                }),
            });

            if (!res.ok) {
                throw new Error(`AI Engine HTTP Error: ${res.status}`);
            }

            const data: SignatureVerificationResponse = await res.json();
            setResult(data);
        } catch (error) {
            console.error('Testing Verification failed:', error);
            setResult({
                score: 0,
                is_match: false,
                status: 'error',
                message: error instanceof Error ? error.message : 'Unknown connection error'
            });
        } finally {
            setIsVerifying(false);
        }
    };

    const clearAll = () => {
        setImageA(null);
        setImageB(null);
        setResult(null);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
            >
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    className="bg-card w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl border border-border flex flex-col"
                >
                    <div className="p-5 border-b border-border flex justify-between items-center sticky top-0 bg-card z-10 flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Cpu className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Sandbox Verification</h2>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">Isolated 1:1 Signature Testing Tool</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-destructive/10 hover:text-destructive">
                            <X className="w-5 h-5" />
                        </Button>
                    </div>

                    <div className="p-6 flex-1 space-y-6">
                        {/* 1:1 UPLOAD GRIDS */}
                        <div className="grid grid-cols-2 gap-6">
                            <UploadBox 
                                title="Signature A (Target)" 
                                image={imageA} 
                                onFileChange={(e) => handleFileChange(e, setImageA)} 
                                onClear={() => setImageA(null)}
                            />
                            <UploadBox 
                                title="Signature B (Reference)" 
                                image={imageB} 
                                onFileChange={(e) => handleFileChange(e, setImageB)} 
                                onClear={() => setImageB(null)}
                            />
                        </div>

                        {/* RUN AUDIT BUTTON */}
                        <div className="flex items-center justify-between border-t border-b border-border py-4">
                            <div className="text-[10px] text-muted-foreground uppercase tracking-widest max-w-sm">
                                Test the true 5-phase forensic engine directly against two user-uploaded files.
                            </div>
                            <div className="flex items-center gap-3">
                                {(imageA || imageB || result) && (
                                    <Button variant="outline" onClick={clearAll} className="h-10 text-[10px] font-bold uppercase tracking-widest">
                                        Clear Tool
                                    </Button>
                                )}
                                <Button 
                                    onClick={triggerVerification}
                                    disabled={!imageA || !imageB || isVerifying}
                                    className="h-10 min-w-[200px] text-[10px] font-black uppercase tracking-widest rounded-xl bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                                >
                                    {isVerifying ? (
                                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</>
                                    ) : (
                                        <><Shield className="w-4 h-4 mr-2" /> Run Forensic Sandbox</>
                                    )}
                                </Button>
                            </div>
                        </div>

                        {/* RESULTS PANEL */}
                        {result && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`p-6 rounded-2xl border ${result.is_match ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-14 h-14 rounded-full flex items-center justify-center border-4 ${result.is_match ? 'bg-green-500/20 border-green-500/30' : 'bg-red-500/20 border-red-500/30'}`}>
                                            {result.is_match ? <CheckCircle2 className="w-6 h-6 text-green-600" /> : <AlertTriangle className="w-6 h-6 text-red-600" />}
                                        </div>
                                        <div>
                                            <h3 className={`text-sm font-black uppercase tracking-widest ${result.is_match ? 'text-green-600' : 'text-red-600'}`}>
                                                {result.is_match ? 'Positive ID Confirmed' : 'Mismatch Detected'}
                                            </h3>
                                            <div className="flex items-baseline gap-2 mt-1">
                                                <span className="text-3xl font-black text-foreground">{result.score}%</span>
                                                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Total Similarity</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">Requirement Threshold</div>
                                        <div className="text-xs font-black text-foreground">82%</div>
                                    </div>
                                </div>

                                {result.phases && (
                                    <div className="grid grid-cols-5 gap-3 mt-4 pt-4 border-t border-black/5 dark:border-white/5">
                                        <PhaseScore label="PHASE 1: Stroke Direction" score={result.phases.stroke_histogram} weight="20%" />
                                        <PhaseScore label="PHASE 2: Structural SSIM" score={result.phases.ssim} weight="25%" />
                                        <PhaseScore label="PHASE 3: ORB Keypoints" score={result.phases.orb_keypoints} weight="35%" />
                                        <PhaseScore label="PHASE 4: Ink Density" score={result.phases.density} weight="5%" />
                                        <PhaseScore label="PHASE 5: Hu Shape Models" score={result.phases.hu_moments} weight="15%" />
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

// MINI SUB-COMPONENTS
const UploadBox = ({ title, image, onFileChange, onClear }: { title: string, image: string | null, onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void, onClear: () => void }) => {
    const fileRef = useRef<HTMLInputElement>(null);
    return (
        <div className="bg-accent/5 border border-dashed border-border rounded-2xl flex flex-col relative overflow-hidden h-[300px]">
             <div className="p-3 border-b border-border bg-card/50 flex justify-between items-center z-10 backdrop-blur-sm shadow-sm absolute top-0 w-full">
                 <span className="text-[10px] font-black tracking-widest uppercase text-foreground">{title}</span>
                 {image && (
                     <Button variant="ghost" size="sm" onClick={onClear} className="h-6 px-2 text-[8px] uppercase font-bold text-destructive hover:bg-destructive/10">Clear</Button>
                 )}
             </div>
             
             {image ? (
                 <div className="flex-1 w-full flex items-center justify-center p-4 pt-12">
                     <img src={image} alt="Uploaded" className="max-w-full max-h-full object-contain drop-shadow-md rounded" />
                 </div>
             ) : (
                 <div 
                    className="flex-1 w-full flex flex-col items-center justify-center cursor-pointer hover:bg-accent/10 transition-colors"
                    onClick={() => fileRef.current?.click()}
                 >
                     <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 border border-primary/20">
                         <UploadCloud className="w-7 h-7 text-primary" />
                     </div>
                     <span className="text-xs font-bold text-foreground">Click to upload image</span>
                     <span className="text-[10px] text-muted-foreground mt-2 uppercase tracking-wide">JPG, PNG, GIF files supported</span>
                 </div>
             )}
             <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={onFileChange} />
        </div>
    );
};

const PhaseScore = ({ label, score, weight }: { label: string, score: number, weight: string }) => (
    <div className="bg-card border border-border p-3 rounded-xl flex flex-col">
        <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest h-8">{label}</span>
        <div className="mt-auto">
            <div className="flex items-end gap-1.5 mb-2">
                <span className={`text-lg font-black leading-none ${score >= 82 ? 'text-green-500' : score > 50 ? 'text-amber-500' : 'text-red-500'}`}>{score}%</span>
            </div>
            <div className="w-full bg-accent/50 h-1.5 rounded-full overflow-hidden">
                <div 
                    className={`h-full rounded-full transition-all duration-1000 ${score >= 82 ? 'bg-green-500' : score > 50 ? 'bg-amber-500' : 'bg-red-500'}`} 
                    style={{ width: `${score}%` }} 
                />
            </div>
            <div className="text-[8px] text-muted-foreground mt-2 text-right opacity-50">Wt: {weight}</div>
        </div>
    </div>
);
