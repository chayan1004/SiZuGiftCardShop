import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import EmotionGiftingWorkflow from '@/components/EmotionGiftingWorkflow';
import LoadingAnimation from '@/components/ui/LoadingAnimation';
import { 
  Heart, 
  Sparkles, 
  Gift, 
  ArrowLeft,
  Star,
  Zap
} from 'lucide-react';

interface AmountOption {
  value: number;
  label: string;
  popular?: boolean;
  description?: string;
}

const amountOptions: AmountOption[] = [
  { value: 2500, label: '$25', description: 'Perfect for coffee & treats' },
  { value: 5000, label: '$50', description: 'Great for dinner or shopping', popular: true },
  { value: 10000, label: '$100', description: 'Ideal for special occasions' },
  { value: 15000, label: '$150', description: 'Premium gift experience' },
  { value: 20000, label: '$200', description: 'Luxury gift choice' },
  { value: 25000, label: '$250', description: 'Ultimate gift card' }
];

export default function EmotionalGiftCardStore() {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [showWorkflow, setShowWorkflow] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const purchaseMutation = useMutation({
    mutationFn: async (giftData: any) => {
      const response = await apiRequest('POST', '/api/public/emotional-checkout', giftData);
      return response;
    },
    onSuccess: async (response) => {
      const data = await response.json();
      toast({
        title: "Gift Card Created Successfully!",
        description: "Your emotional gift card has been created and will be delivered.",
      });
      setLocation(`/gift-success/${data.orderId}`);
    },
    onError: (error: any) => {
      toast({
        title: "Gift Creation Failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  });

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    const numValue = parseFloat(value) * 100;
    if (numValue >= 500 && numValue <= 50000) {
      setSelectedAmount(numValue);
    } else {
      setSelectedAmount(null);
    }
  };

  const handleStartWorkflow = () => {
    if (!selectedAmount) {
      toast({
        title: "Please select an amount",
        description: "Choose a gift card amount to continue",
        variant: "destructive",
      });
      return;
    }
    setShowWorkflow(true);
  };

  const handleWorkflowComplete = async (giftData: any) => {
    setIsProcessing(true);
    await purchaseMutation.mutateAsync({
      ...giftData,
      isGift: true
    });
  };

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto flex items-center justify-center min-h-[60vh]">
            <LoadingAnimation 
              size="xl" 
              message="Creating your emotional gift card..." 
              className="scale-110"
            />
          </div>
        </div>
      </div>
    );
  }

  if (showWorkflow) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Button 
              variant="outline" 
              onClick={() => setShowWorkflow(false)}
              className="flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              Back to Amount Selection
            </Button>
          </div>
          <EmotionGiftingWorkflow
            selectedAmount={selectedAmount!}
            onComplete={handleWorkflowComplete}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-6xl mx-auto"
        >
          {/* Hero Section */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative mb-8"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-blue-600/20 blur-3xl rounded-full"></div>
              <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20">
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <Gift className="w-16 h-16 text-purple-600" />
                    <motion.div
                      className="absolute -top-2 -right-2"
                      animate={{ 
                        rotate: [0, 15, -15, 0],
                        scale: [1, 1.2, 1]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <Sparkles className="w-6 h-6 text-yellow-400" />
                    </motion.div>
                  </div>
                </div>
                <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-4">
                  Emotional Gifting
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                  Create meaningful gift cards that express your true emotions. 
                  Choose themes, occasions, and personal touches that make every gift unforgettable.
                </p>
                <div className="flex justify-center gap-4 mt-6">
                  <Badge className="bg-purple-100 text-purple-700 px-4 py-2">
                    <Heart size={16} className="mr-2" />
                    6 Emotion Themes
                  </Badge>
                  <Badge className="bg-pink-100 text-pink-700 px-4 py-2">
                    <Star size={16} className="mr-2" />
                    Personalized Messages
                  </Badge>
                  <Badge className="bg-blue-100 text-blue-700 px-4 py-2">
                    <Zap size={16} className="mr-2" />
                    Instant Delivery
                  </Badge>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Amount Selection */}
          <Card className="bg-white/20 backdrop-blur-xl border-white/20 shadow-2xl">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Choose Your Gift Amount
              </CardTitle>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Select the perfect amount for your emotional gift card
              </p>
            </CardHeader>
            <CardContent className="p-8">
              {/* Preset Amounts */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                {amountOptions.map((option, index) => (
                  <motion.div
                    key={option.value}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative"
                  >
                    <Button
                      variant="outline"
                      className={`w-full h-32 flex flex-col items-center justify-center relative overflow-hidden transition-all duration-300 ${
                        selectedAmount === option.value
                          ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300"
                          : "border-gray-200 hover:border-purple-300 bg-white/50 dark:bg-gray-800/50"
                      }`}
                      onClick={() => handleAmountSelect(option.value)}
                    >
                      {/* Background gradient effect */}
                      <div className={`absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 transition-opacity duration-300 ${
                        selectedAmount === option.value ? 'opacity-100' : 'group-hover:opacity-50'
                      }`} />
                      
                      {/* Popular badge */}
                      {option.popular && (
                        <div className="absolute -top-2 -right-2">
                          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-lg">
                            <Star size={12} className="mr-1" />
                            Popular
                          </Badge>
                        </div>
                      )}
                      
                      <div className="relative z-10 text-center">
                        <div className="text-2xl font-bold mb-1">{option.label}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                          {option.description}
                        </div>
                      </div>
                    </Button>
                  </motion.div>
                ))}
              </div>

              {/* Custom Amount */}
              <div className="mb-8">
                <div className="bg-white/30 dark:bg-gray-800/30 rounded-xl p-6 border border-white/20">
                  <h3 className="text-lg font-semibold mb-4 text-center">Custom Amount</h3>
                  <div className="flex items-center justify-center gap-4">
                    <div className="text-2xl font-bold">$</div>
                    <input
                      type="number"
                      value={customAmount}
                      onChange={(e) => handleCustomAmountChange(e.target.value)}
                      placeholder="Enter amount"
                      min="5"
                      max="500"
                      step="0.01"
                      className="text-2xl font-bold bg-transparent border-b-2 border-purple-300 focus:border-purple-500 outline-none text-center w-32 placeholder-gray-400"
                    />
                  </div>
                  <p className="text-sm text-gray-500 text-center mt-2">
                    Minimum $5.00, Maximum $500.00
                  </p>
                </div>
              </div>

              {/* Continue Button */}
              <div className="text-center">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={handleStartWorkflow}
                    disabled={!selectedAmount}
                    className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 text-white px-12 py-4 text-lg font-semibold rounded-2xl shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Gift className="mr-3" size={20} />
                    Start Emotional Journey
                    <Sparkles className="ml-3" size={20} />
                  </Button>
                </motion.div>
                
                {selectedAmount && (
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-gray-600 dark:text-gray-400 mt-4"
                  >
                    Selected: ${(selectedAmount / 100).toFixed(2)} gift card
                  </motion.p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Features Preview */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Emotion-Based Themes</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Choose from 6 carefully crafted emotional themes that perfectly express your feelings
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Personalized Design</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Customize gift wrap styles, add personal messages, and schedule delivery dates
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Instant Magic</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Create and deliver beautiful emotional gift cards instantly or schedule for special moments
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}