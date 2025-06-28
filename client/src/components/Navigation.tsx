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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
              <Gift className="text-white" size={20} />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">SiZu GiftCard</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-slate-700 hover:text-blue-600 transition-colors font-medium">Features</a>
            <a href="#pricing" className="text-slate-700 hover:text-blue-600 transition-colors font-medium">Pricing</a>
            <a href="/about" className="text-slate-700 hover:text-blue-600 transition-colors font-medium">About</a>
            <a href="#" className="text-slate-700 hover:text-blue-600 transition-colors font-medium">Support</a>
            <Button 
              onClick={onOpenDashboard}
              className="bg-square-blue text-white hover:bg-square-blue-dark"
            >
              Merchant Login
            </Button>
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
              <a href="#" className="block text-slate-700 hover:text-blue-600 transition-colors font-medium">How it Works</a>
              <a href="#" className="block text-slate-700 hover:text-blue-600 transition-colors font-medium">For Business</a>
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
