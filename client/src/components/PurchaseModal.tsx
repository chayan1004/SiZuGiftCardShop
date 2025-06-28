import { useState, useEffect } from "react";
import { X, Lock, CreditCard, Sparkles, Star, Gift, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { squarePaymentClient } from "@/lib/squarePaymentClient";
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

  const [isPaymentReady, setIsPaymentReady] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  useEffect(() => {
    if (isOpen) {
      initializeSquarePayment();
    }
    return () => {
      squarePaymentClient.destroy();
    };
  }, [isOpen]);

  const initializeSquarePayment = async () => {
    try {
      await squarePaymentClient.createCardPayment('square-card-container');
      setIsPaymentReady(true);
    } catch (error) {
      console.error('Failed to initialize Square payment:', error);
      toast({
        title: "Payment System Error",
        description: "Unable to initialize payment system. Please try again.",
        variant: "destructive",
      });
    }
  };

  const createGiftCardMutation = useMutation({
    mutationFn: async (data: {
      merchantId: string;
      amount: number;
      recipientEmail?: string;
      personalMessage?: string;
    }) => {
      setIsProcessingPayment(true);
      
      try {
        const result = await squarePaymentClient.processGiftCardPayment(data);
        
        if (!result.success) {
          throw new Error(result.error || 'Payment failed');
        }
        
        return result;
      } finally {
        setIsProcessingPayment(false);
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Gift Card Created Successfully!",
        description: `Gift card for $${(data.giftCard.amount / 100).toFixed(2)} has been created and activated.`,
      });
      onClose();
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "Failed to process payment. Please try again.",
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

        <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
          {/* Premium Amount Selection */}
          <div>
            <Label className="text-lg font-semibold text-white mb-6 block">Choose Amount</Label>
            <div className="grid grid-cols-2 gap-4 mb-6">
              {amountOptions.map((option, index) => (
                <motion.div
                  key={option.value}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    type="button"
                    variant="ghost"
                    className={`relative w-full h-20 glass-premium-button rounded-2xl p-4 transition-all duration-300 group ${
                      selectedAmount === option.value 
                        ? "border-cyan-400/60 bg-cyan-500/20" 
                        : "border-cyan-400/20 hover:border-cyan-400/40"
                    }`}
                    onClick={() => handleAmountSelect(option.value)}
                  >
                    {/* Popular badge */}
                    {option.popular && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center"
                      >
                        <Star size={12} className="text-white" />
                      </motion.div>
                    )}
                    
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        selectedAmount === option.value 
                          ? "bg-cyan-500/30" 
                          : "bg-gray-700/50"
                      }`}>
                        <option.icon size={20} className="text-white" />
                      </div>
                      <div className="text-left">
                        <div className="font-display text-xl font-bold text-white">{option.label}</div>
                        <div className="text-sm text-gray-400">Perfect gift</div>
                      </div>
                    </div>
                    
                    {/* Selection indicator */}
                    {selectedAmount === option.value && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute bottom-2 right-2 w-4 h-4 bg-cyan-400 rounded-full"
                      />
                    )}
                  </Button>
                </motion.div>
              ))}
            </div>
            
            {/* Custom Amount Input */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Label className="text-gray-300 mb-2 block">Or enter custom amount</Label>
              <Input
                type="number"
                placeholder="Enter amount ($5 minimum)"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setSelectedAmount(null);
                }}
                className="glass-premium-button text-white placeholder-gray-400 border-cyan-400/30 focus:border-cyan-400/60 rounded-xl h-12"
              />
            </motion.div>
          </div>

          {/* Recipient Email Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Label htmlFor="recipientEmail" className="text-lg font-semibold text-white mb-3 block">
              Recipient Email
            </Label>
            <Input
              id="recipientEmail"
              type="email"
              placeholder="Enter recipient's email address"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              required
              className="glass-premium-button text-white placeholder-gray-400 border-cyan-400/30 focus:border-cyan-400/60 rounded-xl h-12"
            />
          </motion.div>

          {/* Personal Message Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Label htmlFor="personalMessage" className="text-lg font-semibold text-white mb-3 block">
              Personal Message (Optional)
            </Label>
            <Textarea
              id="personalMessage"
              placeholder="Add a heartfelt message..."
              rows={4}
              value={personalMessage}
              onChange={(e) => setPersonalMessage(e.target.value)}
              className="glass-premium-button text-white placeholder-gray-400 border-cyan-400/30 focus:border-cyan-400/60 rounded-xl resize-none"
            />
          </motion.div>

          {/* Payment Security Notice */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 }}
            className="glass-card rounded-2xl p-6 border border-cyan-400/20"
          >
            <div className="flex items-center justify-center space-x-3 text-cyan-300">
              <Shield className="w-6 h-6" />
              <span className="font-semibold">Secured by Square Payment System</span>
              <CreditCard className="w-6 h-6" />
            </div>
            <p className="text-center text-gray-400 text-sm mt-2">
              Your payment is encrypted and processed securely through Square's enterprise platform
            </p>
          </motion.div>

          {/* Submit Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button 
              type="submit" 
              disabled={createGiftCardMutation.isPending}
              className="relative w-full h-14 gradient-premium-3 text-white font-bold rounded-2xl shadow-2xl hover:shadow-cyan-500/25 transition-all duration-300 group overflow-hidden"
            >
              {/* Animated background */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-purple-600 via-cyan-500 to-blue-600 opacity-0 group-hover:opacity-100"
                animate={{
                  x: ['-100%', '100%'],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 1
                }}
              />
              
              <span className="relative z-10 flex items-center justify-center space-x-3">
                {createGiftCardMutation.isPending ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Lock size={20} />
                    <span>Purchase Gift Card</span>
                    <Sparkles size={20} />
                  </>
                )}
              </span>
            </Button>
          </motion.div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
