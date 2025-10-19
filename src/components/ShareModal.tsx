import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import QRCode from "react-qr-code";

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  calculatorId?: string;
}

export const ShareModal = ({ open, onClose, calculatorId }: ShareModalProps) => {
  const [copied, setCopied] = useState(false);
  
  const shareUrl = calculatorId 
    ? `${window.location.origin}/calculator/${calculatorId}`
    : window.location.href;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Calculator</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Input value={shareUrl} readOnly className="flex-1" />
            <Button onClick={handleCopy} size="icon" variant="outline">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>

          <div className="flex justify-center p-4 bg-muted rounded-lg">
            <QRCode value={shareUrl} size={200} />
          </div>

          <p className="text-sm text-muted-foreground text-center">
            Scan QR code to open calculator
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};