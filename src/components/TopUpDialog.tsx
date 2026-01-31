import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import CreditBadge from "@/components/ui/CreditBadge";

const CREDIT_PACKS = [
  { credits: 5, price: 50, label: "5 Credits" },
  { credits: 10, price: 90, label: "10 Credits (10% off)" },
  { credits: 20, price: 160, label: "20 Credits (20% off)" },
];

const UPI_ID = "skillsharecircle@upi";
const UPI_NAME = "Skill Share Circle";

type TopUpDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const TopUpDialog = ({ open, onOpenChange }: TopUpDialogProps) => {
  const [selected, setSelected] = useState<typeof CREDIT_PACKS[0] | null>(null);

  const handlePay = () => {
    if (!selected) return;
    const amount = selected.price;
    const note = `${selected.credits} credits - Skill Share Circle`;
    const upiUrl = `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(UPI_NAME)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;
    window.open(upiUrl, "_blank");
    onOpenChange(false);
    setSelected(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Top up credits</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Choose a pack. You’ll be redirected to UPI to complete payment.
        </p>
        <div className="grid gap-2 py-2">
          {CREDIT_PACKS.map((pack) => (
            <button
              key={pack.credits}
              type="button"
              onClick={() => setSelected(pack)}
              className={`flex items-center justify-between p-4 rounded-xl border text-left transition-colors ${
                selected?.credits === pack.credits
                  ? "border-primary bg-primary/10"
                  : "border-border/50 bg-card hover:bg-secondary"
              }`}
            >
              <div className="flex items-center gap-2">
                <CreditBadge credits={pack.credits} size="sm" />
                <span className="font-medium text-foreground">{pack.label}</span>
              </div>
              <span className="font-semibold text-foreground">₹{pack.price}</span>
            </button>
          ))}
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
            Cancel
          </Button>
          <Button
            onClick={handlePay}
            disabled={!selected}
            className="rounded-xl"
          >
            Pay via UPI — {selected ? `₹${selected.price}` : "Select pack"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TopUpDialog;
