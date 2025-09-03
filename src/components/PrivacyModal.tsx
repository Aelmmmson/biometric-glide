import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface PrivacyModalProps {
  children: React.ReactNode;
}

export function PrivacyModal({ children }: PrivacyModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Privacy & Data Protection</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm text-muted-foreground">
          <div>
            <h3 className="font-semibold text-foreground mb-2">Data Collection</h3>
            <p>We collect biometric data including photos, signatures, passport information, and fingerprints solely for identity verification purposes.</p>
          </div>
          
          <div>
            <h3 className="font-semibold text-foreground mb-2">Data Security</h3>
            <p>All biometric data is encrypted using AES-256 encryption and stored in secure, compliant data centers with multi-layer security protocols.</p>
          </div>
          
          <div>
            <h3 className="font-semibold text-foreground mb-2">Data Usage</h3>
            <p>Your information is used exclusively for identity verification and will not be shared with third parties without your explicit consent.</p>
          </div>
          
          <div>
            <h3 className="font-semibold text-foreground mb-2">Data Retention</h3>
            <p>Biometric data is retained for the minimum period required by law and can be deleted upon request.</p>
          </div>
          
          <div>
            <h3 className="font-semibold text-foreground mb-2">Your Rights</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Right to access your data</li>
              <li>Right to rectification</li>
              <li>Right to erasure</li>
              <li>Right to data portability</li>
              <li>Right to withdraw consent</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-foreground mb-2">Contact</h3>
            <p>For privacy concerns, contact our Data Protection Officer at privacy@company.com</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}