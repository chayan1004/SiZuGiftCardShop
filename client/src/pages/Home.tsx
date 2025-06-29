import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import AboutSection from "@/components/AboutSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import PricingSection from "@/components/PricingSection";
import CTASection from "@/components/CTASection";
import PurchaseModal from "@/components/PurchaseModal";
import MerchantDashboard from "@/components/MerchantDashboard";
import { Gift, Shield, Smartphone, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
// Authentication utilities removed - using simplified auth system

export default function Home() {
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  // Check authentication status from localStorage
  const merchantToken = localStorage.getItem('merchantToken');
  const adminToken = localStorage.getItem('adminToken');

  // Auto-redirect admin to main admin dashboard
  useEffect(() => {
    if (merchantToken) {
      setIsDashboardOpen(true);
    } else if (adminToken === 'sizu-admin-2025') {
      window.location.href = '/admin';
    }
  }, [merchantToken, adminToken]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900">
      <Navigation 
        onOpenPurchaseModal={() => setIsPurchaseModalOpen(true)}
        onOpenDashboard={() => setIsDashboardOpen(true)}
      />
      
      <HeroSection onOpenPurchaseModal={() => setIsPurchaseModalOpen(true)} />
      
      <FeaturesSection />
      
      <AboutSection />
      
      <TestimonialsSection />
      
      <PricingSection />
      
      <CTASection onOpenPurchaseModal={() => setIsPurchaseModalOpen(true)} />
      
      {/* Enhanced Footer */}
      <footer className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900">
        {/* Rich Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/5 via-purple-500/3 to-indigo-500/5" />
          <div className="absolute top-20 right-20 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid md:grid-cols-4 gap-12">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-4 mb-8">
                <div className="w-16 h-16 gradient-premium rounded-2xl flex items-center justify-center shadow-2xl">
                  <Gift className="text-white" size={24} />
                </div>
                <div>
                  <span className="font-display text-3xl font-bold bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                    SiZu
                  </span>
                  <div className="font-mono text-xs text-cyan-300 tracking-[0.3em] font-semibold">
                    GIFTCARD
                  </div>
                </div>
              </div>
              <p className="text-xl text-gray-200 leading-relaxed mb-8 max-w-lg">
                The future of digital gift cards. Powered by Square's enterprise platform, 
                trusted by thousands of businesses worldwide.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="w-12 h-12 glass-premium rounded-xl flex items-center justify-center text-gray-300 hover:text-cyan-300 transition-colors duration-300">
                  <span className="text-sm font-semibold">T</span>
                </a>
                <a href="#" className="w-12 h-12 glass-premium rounded-xl flex items-center justify-center text-gray-300 hover:text-cyan-300 transition-colors duration-300">
                  <span className="text-sm font-semibold">L</span>
                </a>
                <a href="#" className="w-12 h-12 glass-premium rounded-xl flex items-center justify-center text-gray-300 hover:text-cyan-300 transition-colors duration-300">
                  <span className="text-sm font-semibold">G</span>
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">How it Works</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Press</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-700 mt-12 pt-8 text-center text-slate-400">
            <p>&copy; 2024 SiZu GiftCard. All rights reserved. Powered by Square.</p>
          </div>
        </div>
      </footer>

      <PurchaseModal 
        isOpen={isPurchaseModalOpen} 
        onClose={() => setIsPurchaseModalOpen(false)} 
      />
      
      <MerchantDashboard 
        isOpen={isDashboardOpen} 
        onClose={() => setIsDashboardOpen(false)} 
      />
    </div>
  );
}
