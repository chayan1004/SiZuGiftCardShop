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
    <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
            Gift Cards Made{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-700">
              Simple
            </span>
          </h1>
          <p className="text-xl text-slate-700 mb-8 max-w-3xl mx-auto leading-relaxed">
            Create, send, and manage gift cards powered by Square. Perfect for any business, 
            built for the modern world.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                onClick={onOpenPurchaseModal}
                size="lg"
                className="bg-square-blue text-white px-8 py-4 text-lg font-semibold hover:bg-square-blue-dark animate-pulse-glow"
              >
                <Gift className="mr-2" size={20} />
                Buy a Gift Card
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                variant="outline" 
                size="lg"
                className="border-2 border-slate-300 text-slate-700 px-8 py-4 text-lg font-semibold hover:border-square-blue hover:text-square-blue"
              >
                <Play className="mr-2" size={20} />
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
