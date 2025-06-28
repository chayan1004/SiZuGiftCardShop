import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { Gift, Sparkles, Star, Heart, Coffee, ShoppingBag, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface GiftCardOption {
  id: string;
  amount: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  popular?: boolean;
  color: string;
  bgGradient: string;
}

const giftCardOptions: GiftCardOption[] = [
  {
    id: "coffee-lover",
    amount: 25,
    title: "Coffee Lover",
    description: "Perfect for daily coffee runs",
    icon: <Coffee className="w-6 h-6" />,
    color: "text-amber-600",
    bgGradient: "from-amber-50 to-orange-50"
  },
  {
    id: "treat-yourself",
    amount: 50,
    title: "Treat Yourself",
    description: "A little something special",
    icon: <Heart className="w-6 h-6" />,
    popular: true,
    color: "text-pink-600",
    bgGradient: "from-pink-50 to-rose-50"
  },
  {
    id: "shopping-spree",
    amount: 100,
    title: "Shopping Spree",
    description: "For the ultimate shopping experience",
    icon: <ShoppingBag className="w-6 h-6" />,
    color: "text-purple-600",
    bgGradient: "from-purple-50 to-indigo-50"
  },
  {
    id: "premium-experience",
    amount: 250,
    title: "Premium Experience",
    description: "The ultimate gift for someone special",
    icon: <Award className="w-6 h-6" />,
    color: "text-emerald-600",
    bgGradient: "from-emerald-50 to-teal-50"
  }
];

export default function GiftCardStore() {
  const [selectedCard, setSelectedCard] = useState<GiftCardOption | null>(null);
  const [, setLocation] = useLocation();

  const handleSelectCard = (card: GiftCardOption) => {
    setSelectedCard(card);
    // Navigate to checkout with selected amount
    setLocation(`/checkout?amount=${card.amount}&type=${card.id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/5 via-purple-500/3 to-indigo-500/5" />
          <div className="absolute top-20 right-20 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
        </div>

        <div className="relative z-10 px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="max-w-7xl mx-auto text-center">
            {/* Brand Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center space-x-4 mb-8"
            >
              <div className="w-16 h-16 gradient-premium rounded-2xl flex items-center justify-center shadow-2xl">
                <Gift className="text-white" size={24} />
              </div>
              <div>
                <span className="font-display text-4xl font-bold bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                  SiZu
                </span>
                <div className="font-mono text-xs text-cyan-300 tracking-[0.3em] font-semibold">
                  GIFT CARDS
                </div>
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-5xl md:text-7xl font-bold mb-6"
            >
              <span className="bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                Gift the Perfect
              </span>
              <br />
              <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                Experience
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed"
            >
              Send instantly or schedule for later. Every gift card includes a personalized message, 
              QR code for easy redemption, and never expires.
            </motion.p>

            {/* Features */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap justify-center gap-6 mb-16"
            >
              {[
                { icon: Sparkles, text: "Instant Delivery" },
                { icon: Star, text: "Never Expires" },
                { icon: Gift, text: "Personal Message" }
              ].map((feature, index) => (
                <div key={index} className="flex items-center space-x-2 glass-premium px-4 py-2 rounded-full">
                  <feature.icon className="w-5 h-5 text-cyan-300" />
                  <span className="text-white font-medium">{feature.text}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Gift Card Options */}
      <div className="relative z-10 px-4 sm:px-6 lg:px-8 pb-20">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="text-3xl font-bold text-center mb-4 text-white"
          >
            Choose Your Gift Amount
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="text-gray-300 text-center mb-12"
          >
            Select from our curated collection or choose a custom amount
          </motion.p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {giftCardOptions.map((card, index) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 + index * 0.1 }}
                className="relative"
              >
                {card.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                    <Badge className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-3 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <Card 
                  className={`relative overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl glass-premium border-white/10 ${card.popular ? 'ring-2 ring-cyan-500/50' : ''}`}
                  onClick={() => handleSelectCard(card)}
                >
                  <CardContent className="p-6">
                    {/* Background Gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${card.bgGradient} opacity-5`} />
                    
                    {/* Content */}
                    <div className="relative z-10">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.bgGradient} flex items-center justify-center mb-4 ${card.color}`}>
                        {card.icon}
                      </div>
                      
                      <h3 className="text-xl font-bold text-white mb-2">
                        {card.title}
                      </h3>
                      
                      <p className="text-gray-300 text-sm mb-4">
                        {card.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-3xl font-bold bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
                            ${card.amount}
                          </span>
                        </div>
                        
                        <Button 
                          className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
                          size="sm"
                        >
                          Select
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Custom Amount Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.8 }}
            className="mt-12 text-center"
          >
            <Card className="glass-premium border-white/10 max-w-md mx-auto">
              <CardContent className="p-6">
                <Gift className="w-8 h-8 text-cyan-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">
                  Custom Amount
                </h3>
                <p className="text-gray-300 text-sm mb-4">
                  Choose any amount from $10 to $1,000
                </p>
                <Button 
                  onClick={() => setLocation('/checkout?custom=true')}
                  className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white"
                >
                  Choose Custom Amount
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Trust Indicators */}
      <div className="relative z-10 px-4 sm:px-6 lg:px-8 pb-20">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center"
          >
            <div className="glass-premium p-6 rounded-xl border-white/10">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift className="w-6 h-6 text-green-400" />
              </div>
              <h4 className="font-semibold text-white mb-2">Secure & Trusted</h4>
              <p className="text-gray-300 text-sm">
                Powered by Square's enterprise-grade security
              </p>
            </div>
            
            <div className="glass-premium p-6 rounded-xl border-white/10">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 text-blue-400" />
              </div>
              <h4 className="font-semibold text-white mb-2">Instant Delivery</h4>
              <p className="text-gray-300 text-sm">
                Send immediately or schedule for the perfect moment
              </p>
            </div>
            
            <div className="glass-premium p-6 rounded-xl border-white/10">
              <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-6 h-6 text-purple-400" />
              </div>
              <h4 className="font-semibold text-white mb-2">Never Expires</h4>
              <p className="text-gray-300 text-sm">
                Gift cards retain their full value indefinitely
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}