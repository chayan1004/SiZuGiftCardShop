import { Gift, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import GiftCardGrid from "./GiftCardGrid";
import FloatingElements from "./FloatingElements";

interface HeroSectionProps {
  onOpenPurchaseModal: () => void;
}

export default function HeroSection({ onOpenPurchaseModal }: HeroSectionProps) {
  return (
    <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <FloatingElements />
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="font-display text-7xl md:text-8xl font-bold text-white mb-8 leading-none">
            <span className="block">Gift Cards</span>
            <span className="block bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent shimmer">
              Reimagined
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed font-light">
            Experience the future of digital gift cards with premium Square integration, 
            advanced analytics, and seamless customer experiences.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                onClick={onOpenPurchaseModal}
                size="lg"
                className="gradient-premium text-white px-12 py-6 text-xl font-display font-bold rounded-2xl shadow-2xl hover:shadow-purple-500/25 transition-all duration-500 border-none"
              >
                <Gift className="mr-3" size={24} />
                Experience SiZu
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05, rotateY: -5 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                variant="outline" 
                size="lg"
                className="glass-premium border-2 border-white/20 text-white hover:bg-white/10 px-12 py-6 text-xl font-display font-semibold rounded-2xl backdrop-blur-md transition-all duration-500"
              >
                <Play className="mr-3" size={24} />
                Watch Demo
              </Button>
            </motion.div>
          </div>
        </motion.div>

        <motion.div 
          className="relative max-w-4xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <GiftCardGrid />
        </motion.div>
      </div>
    </section>
  );
}
