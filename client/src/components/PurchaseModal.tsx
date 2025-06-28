import { useState } from "react";
import { X, Lock, CreditCard, Sparkles, Star, Gift, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PurchaseModal({ isOpen, onClose }: PurchaseModalProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [personalMessage, setPersonalMessage] = useState("");
  const { toast } = useToast();

  const createGiftCardMutation = useMutation({
    mutationFn: async (data: {
      merchantId: string;
      amount: number;
      recipientEmail?: string;
      personalMessage?: string;
    }) => {
      const response = await apiRequest("POST", "/api/giftcards/create", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Gift Card Created!",
        description: `Successfully created gift card for $${(data.giftCard.amount / 100).toFixed(2)}`,
      });
      onClose();
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create gift card. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setSelectedAmount(null);
    setCustomAmount("");
    setRecipientEmail("");
    setPersonalMessage("");
  };

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount(amount.toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = selectedAmount || parseInt(customAmount) || 0;
    if (amount < 1) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount of at least $1.",
        variant: "destructive",
      });
      return;
    }

    if (!recipientEmail) {
      toast({
        title: "Missing Email",
        description: "Please enter the recipient's email address.",
        variant: "destructive",
      });
      return;
    }

    // For demo purposes, using a placeholder merchant ID
    // In production, this would come from authenticated user context
    createGiftCardMutation.mutate({
      merchantId: "demo-merchant",
      amount: amount * 100, // Convert to cents
      recipientEmail,
      personalMessage: personalMessage || undefined,
    });
  };

  const amountOptions = [
    { value: 25, label: "$25", popular: false, icon: Gift },
    { value: 50, label: "$50", popular: true, icon: Star },
    { value: 100, label: "$100", popular: false, icon: Sparkles },
    { value: 200, label: "$200", popular: false, icon: Zap },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl glass-premium border-cyan-400/20 shadow-2xl">
        {/* Enhanced Modal Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-indigo-900/20 rounded-lg" />
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5 rounded-lg" />
        
        <DialogHeader className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center space-x-4 mb-6"
          >
            <div className="w-16 h-16 gradient-premium-3 rounded-3xl flex items-center justify-center shadow-2xl">
              <Gift className="text-white" size={24} />
            </div>
            <div>
              <DialogTitle className="font-display text-3xl font-bold text-white">
                Purchase Gift Card
              </DialogTitle>
              <p className="text-cyan-300 text-lg">Choose your perfect gift amount</p>
            </div>
          </motion.div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label className="text-sm font-medium text-slate-700 mb-2">Amount</Label>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[25, 50, 100].map((amount) => (
                <Button
                  key={amount}
                  type="button"
                  variant={selectedAmount === amount ? "default" : "outline"}
                  className={`py-3 ${
                    selectedAmount === amount 
                      ? "bg-square-blue text-white hover:bg-square-blue-dark" 
                      : "bg-slate-100 hover:bg-square-blue hover:text-white"
                  }`}
                  onClick={() => handleAmountSelect(amount)}
                >
                  ${amount}
                </Button>
              ))}
            </div>
            <Input
              type="number"
              placeholder="Custom amount"
              value={customAmount}
              onChange={(e) => {
                setCustomAmount(e.target.value);
                setSelectedAmount(null);
              }}
              className="w-full"
            />
          </div>

          <div>
            <Label htmlFor="recipientEmail" className="text-sm font-medium text-slate-700 mb-2">
              Recipient Email
            </Label>
            <Input
              id="recipientEmail"
              type="email"
              placeholder="Enter recipient's email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="personalMessage" className="text-sm font-medium text-slate-700 mb-2">
              Personal Message (Optional)
            </Label>
            <Textarea
              id="personalMessage"
              placeholder="Add a personal message..."
              rows={3}
              value={personalMessage}
              onChange={(e) => setPersonalMessage(e.target.value)}
              className="resize-none"
            />
          </div>

          <div className="bg-slate-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center text-slate-500">
              <CreditCard className="mr-2" size={20} />
              <span>Square Payment Form integration required</span>
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={createGiftCardMutation.isPending}
            className="w-full bg-square-blue text-white py-4 font-semibold hover:bg-square-blue-dark"
          >
            <Lock className="mr-2" size={16} />
            {createGiftCardMutation.isPending ? "Processing..." : "Complete Purchase"}
          </Button>
        </form>

        <div className="text-center">
          <p className="text-xs text-slate-500">
            <Lock className="inline mr-1" size={12} />
            Secured by Square Payment Processing
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
