import { useState } from "react";
import { Gift, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface NavigationProps {
  onOpenPurchaseModal: () => void;
  onOpenDashboard: () => void;
}

export default function Navigation({ onOpenPurchaseModal, onOpenDashboard }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-premium border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <motion.div
              whileHover={{ 
                scale: 1.1,
                rotateY: 180,
                transition: { duration: 0.6 }
              }}
              className="relative w-12 h-12 gradient-premium rounded-2xl flex items-center justify-center shadow-2xl animate-glow-pulse"
              style={{ transformStyle: "preserve-3d" }}
            >
              <motion.div
                animate={{
                  rotateZ: [0, 360],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="absolute inset-1 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl opacity-30"
              />
              <Gift className="text-white relative z-10 drop-shadow-sm" size={24} />
            </motion.div>
            <div className="flex flex-col">
              <motion.span 
                className="font-display text-3xl font-bold bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-500 bg-clip-text text-transparent"
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                style={{
                  backgroundSize: "200% 200%"
                }}
              >
                SiZu
              </motion.span>
              <span className="font-mono text-xs text-cyan-300 tracking-[0.3em] -mt-1 font-semibold">
                GIFTCARD
              </span>
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-300 hover:text-indigo-400 transition-colors font-medium tracking-wide">Features</a>
            <a href="#pricing" className="text-gray-300 hover:text-purple-400 transition-colors font-medium tracking-wide">Pricing</a>
            <a href="/about" className="text-gray-300 hover:text-pink-400 transition-colors font-medium tracking-wide">About</a>
            <a href="#" className="text-gray-300 hover:text-cyan-400 transition-colors font-medium tracking-wide">Support</a>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                onClick={onOpenDashboard}
                className="gradient-premium text-white font-semibold px-6 py-2 rounded-xl border-none shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Merchant Login
              </Button>
            </motion.div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden text-slate-800 hover:text-slate-900"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white/90 backdrop-blur-md border-b border-white/20"
          >
            <div className="px-4 py-4 space-y-4">
              <a href="#features" className="block text-slate-700 hover:text-blue-600 transition-colors font-medium">Features</a>
              <a href="#pricing" className="block text-slate-700 hover:text-blue-600 transition-colors font-medium">Pricing</a>
              <a href="/about" className="block text-slate-700 hover:text-blue-600 transition-colors font-medium">About</a>
              <a href="#" className="block text-slate-700 hover:text-blue-600 transition-colors font-medium">Support</a>
              <Button 
                onClick={() => {
                  onOpenDashboard();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full bg-square-blue text-white hover:bg-square-blue-dark"
              >
                Merchant Login
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
