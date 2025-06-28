import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { 
  Gift, 
  Calendar, 
  Mail, 
  User, 
  MessageSquare, 
  DollarSign,
  Clock,
  CheckCircle,
  Loader2,
  CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const checkoutSchema = z.object({
  amount: z.number().min(10, "Minimum amount is $10").max(1000, "Maximum amount is $1,000"),
  recipientName: z.string().min(2, "Recipient name is required"),
  recipientEmail: z.string().email("Valid email is required"),
  senderName: z.string().min(2, "Your name is required"),
  personalMessage: z.string().max(500, "Message must be 500 characters or less").optional(),
  deliveryTime: z.enum(["now", "scheduled"]),
  scheduledDate: z.string().optional(),
  scheduledTime: z.string().optional()
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

export default function Checkout() {
  const [location] = useLocation();
  const [step, setStep] = useState(1);
  const [purchaseResult, setPurchaseResult] = useState<any>(null);
  const { toast } = useToast();

  // Parse URL parameters
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const presetAmount = urlParams.get('amount');
  const isCustom = urlParams.get('custom') === 'true';
  const cardType = urlParams.get('type');

  const form = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      amount: presetAmount ? parseInt(presetAmount) : 50,
      deliveryTime: "now",
      personalMessage: ""
    }
  });

  const purchaseMutation = useMutation({
    mutationFn: async (data: CheckoutForm) => {
      const response = await fetch('/api/giftcards/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: data.amount * 100, // Convert to cents
          recipientName: data.recipientName,
          recipientEmail: data.recipientEmail,
          senderName: data.senderName,
          personalMessage: data.personalMessage,
          deliveryTime: data.deliveryTime,
          scheduledDate: data.scheduledDate,
          scheduledTime: data.scheduledTime
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to process purchase');
      }
      
      return response.json();
    },
    onSuccess: (result) => {
      setPurchaseResult(result);
      setStep(3);
      toast({
        title: "Gift card created successfully!",
        description: "The recipient will receive their gift card via email."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Purchase failed",
        description: error.message || "Unable to process your gift card purchase.",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: CheckoutForm) => {
    setStep(2);
    purchaseMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/5 via-purple-500/3 to-indigo-500/5" />
          <div className="absolute top-20 right-20 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl animate-pulse" />
        </div>

        <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <div className="flex items-center justify-center space-x-4 mb-6">
                <div className="w-12 h-12 gradient-premium rounded-xl flex items-center justify-center shadow-xl">
                  <Gift className="text-white" size={20} />
                </div>
                <span className="font-display text-2xl font-bold bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                  SiZu Gift Card Checkout
                </span>
              </div>

              {/* Progress Steps */}
              <div className="flex items-center justify-center space-x-4 mb-8">
                {[1, 2, 3].map((stepNum) => (
                  <div key={stepNum} className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      stepNum <= step 
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white' 
                        : 'bg-gray-600 text-gray-300'
                    }`}>
                      {stepNum < step ? <CheckCircle className="w-5 h-5" /> : stepNum}
                    </div>
                    {stepNum < 3 && (
                      <div className={`w-12 h-1 mx-2 ${
                        stepNum < step ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : 'bg-gray-600'
                      }`} />
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-center space-x-8 text-sm text-gray-300">
                <span className={step >= 1 ? 'text-cyan-300' : ''}>Details</span>
                <span className={step >= 2 ? 'text-cyan-300' : ''}>Processing</span>
                <span className={step >= 3 ? 'text-cyan-300' : ''}>Complete</span>
              </div>
            </motion.div>

            {/* Step 1: Form */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
              >
                {/* Form */}
                <div className="lg:col-span-2">
                  <Card className="glass-premium border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Gift Card Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* Amount */}
                        <div className="space-y-2">
                          <Label htmlFor="amount" className="text-white flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            Gift Card Amount
                          </Label>
                          {isCustom ? (
                            <Input
                              id="amount"
                              type="number"
                              min="10"
                              max="1000"
                              {...form.register("amount", { valueAsNumber: true })}
                              className="glass-premium border-white/20 text-white placeholder-gray-400"
                              placeholder="Enter amount ($10 - $1,000)"
                            />
                          ) : (
                            <div className="text-2xl font-bold text-cyan-300">
                              ${form.watch("amount")}
                            </div>
                          )}
                          {form.formState.errors.amount && (
                            <p className="text-red-400 text-sm">{form.formState.errors.amount.message}</p>
                          )}
                        </div>

                        {/* Recipient Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="recipientName" className="text-white">
                              Recipient Name
                            </Label>
                            <Input
                              id="recipientName"
                              {...form.register("recipientName")}
                              className="glass-premium border-white/20 text-white placeholder-gray-400"
                              placeholder="Who is this for?"
                            />
                            {form.formState.errors.recipientName && (
                              <p className="text-red-400 text-sm">{form.formState.errors.recipientName.message}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="recipientEmail" className="text-white flex items-center gap-2">
                              <Mail className="w-4 h-4" />
                              Recipient Email
                            </Label>
                            <Input
                              id="recipientEmail"
                              type="email"
                              {...form.register("recipientEmail")}
                              className="glass-premium border-white/20 text-white placeholder-gray-400"
                              placeholder="recipient@example.com"
                            />
                            {form.formState.errors.recipientEmail && (
                              <p className="text-red-400 text-sm">{form.formState.errors.recipientEmail.message}</p>
                            )}
                          </div>
                        </div>

                        {/* Sender Name */}
                        <div className="space-y-2">
                          <Label htmlFor="senderName" className="text-white">
                            Your Name
                          </Label>
                          <Input
                            id="senderName"
                            {...form.register("senderName")}
                            className="glass-premium border-white/20 text-white placeholder-gray-400"
                            placeholder="Your name"
                          />
                          {form.formState.errors.senderName && (
                            <p className="text-red-400 text-sm">{form.formState.errors.senderName.message}</p>
                          )}
                        </div>

                        {/* Personal Message */}
                        <div className="space-y-2">
                          <Label htmlFor="personalMessage" className="text-white flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" />
                            Personal Message (Optional)
                          </Label>
                          <Textarea
                            id="personalMessage"
                            {...form.register("personalMessage")}
                            className="glass-premium border-white/20 text-white placeholder-gray-400 min-h-[100px]"
                            placeholder="Add a personal touch to your gift..."
                            maxLength={500}
                          />
                          <div className="text-right text-xs text-gray-400">
                            {form.watch("personalMessage")?.length || 0}/500
                          </div>
                        </div>

                        {/* Delivery Options */}
                        <div className="space-y-4">
                          <Label className="text-white flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Delivery Time
                          </Label>
                          <RadioGroup
                            value={form.watch("deliveryTime")}
                            onValueChange={(value) => form.setValue("deliveryTime", value as "now" | "scheduled")}
                            className="space-y-3"
                          >
                            <div className="flex items-center space-x-2 glass-premium p-4 rounded-lg border border-white/10">
                              <RadioGroupItem value="now" id="now" />
                              <Label htmlFor="now" className="text-white cursor-pointer flex-1">
                                <div className="font-semibold">Send Now</div>
                                <div className="text-sm text-gray-300">Deliver immediately via email</div>
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2 glass-premium p-4 rounded-lg border border-white/10">
                              <RadioGroupItem value="scheduled" id="scheduled" />
                              <Label htmlFor="scheduled" className="text-white cursor-pointer flex-1">
                                <div className="font-semibold">Schedule for Later</div>
                                <div className="text-sm text-gray-300">Choose a specific date and time</div>
                              </Label>
                            </div>
                          </RadioGroup>

                          {form.watch("deliveryTime") === "scheduled" && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4"
                            >
                              <div className="space-y-2">
                                <Label htmlFor="scheduledDate" className="text-white">
                                  Date
                                </Label>
                                <Input
                                  id="scheduledDate"
                                  type="date"
                                  {...form.register("scheduledDate")}
                                  className="glass-premium border-white/20 text-white"
                                  min={new Date().toISOString().split('T')[0]}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="scheduledTime" className="text-white">
                                  Time
                                </Label>
                                <Input
                                  id="scheduledTime"
                                  type="time"
                                  {...form.register("scheduledTime")}
                                  className="glass-premium border-white/20 text-white"
                                />
                              </div>
                            </motion.div>
                          )}
                        </div>

                        <Button
                          type="submit"
                          className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white py-3 text-lg font-semibold"
                          disabled={purchaseMutation.isPending}
                        >
                          <CreditCard className="w-5 h-5 mr-2" />
                          Complete Purchase
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </div>

                {/* Order Summary */}
                <div>
                  <Card className="glass-premium border-white/10 sticky top-8">
                    <CardHeader>
                      <CardTitle className="text-white">Order Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center py-3 border-b border-white/10">
                        <span className="text-gray-300">Gift Card Amount</span>
                        <span className="text-2xl font-bold text-cyan-300">
                          ${form.watch("amount")}
                        </span>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-300">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          Instant email delivery
                        </div>
                        <div className="flex items-center gap-2 text-gray-300">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          QR code for easy redemption
                        </div>
                        <div className="flex items-center gap-2 text-gray-300">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          Never expires
                        </div>
                        <div className="flex items-center gap-2 text-gray-300">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          Secure & trusted
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}

            {/* Step 2: Processing */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-20"
              >
                <Loader2 className="w-16 h-16 animate-spin text-cyan-300 mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-white mb-4">
                  Creating Your Gift Card
                </h2>
                <p className="text-gray-300 mb-8">
                  Please wait while we process your purchase and generate the gift card...
                </p>
                <div className="glass-premium max-w-md mx-auto p-6 rounded-xl border-white/10">
                  <div className="space-y-2 text-sm text-gray-300">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing payment...
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Success */}
            {step === 3 && purchaseResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-green-400" />
                </div>
                
                <h2 className="text-3xl font-bold text-white mb-4">
                  Gift Card Created Successfully!
                </h2>
                
                <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
                  Your gift card has been created and will be delivered to the recipient's email address. 
                  They'll receive a beautifully formatted email with their gift card and QR code.
                </p>

                <Card className="glass-premium border-white/10 max-w-2xl mx-auto mb-8">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                      <div>
                        <h4 className="font-semibold text-white mb-2">Gift Card Details</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-300">Amount:</span>
                            <span className="text-cyan-300 font-semibold">
                              ${(purchaseResult.amount / 100).toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">GAN:</span>
                            <span className="text-white font-mono">
                              {purchaseResult.gan}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-white mb-2">Delivery Info</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-300">Recipient:</span>
                            <span className="text-white">{purchaseResult.recipientName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">Status:</span>
                            <span className="text-green-400">Delivered</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    onClick={() => window.open(`/gift/${purchaseResult.gan}`, '_blank')}
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
                  >
                    View Gift Card
                  </Button>
                  
                  <Button
                    onClick={() => window.location.href = '/store'}
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    Send Another Gift Card
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}