import { useState, useEffect } from "react";
import { Gift, Menu, X, Sparkles, Zap, Star, Shield, ChevronDown, ArrowRight, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";

interface NavigationProps {
  onOpenPurchaseModal: () => void;
  onOpenDashboard: () => void;
}

export default function Navigation({ onOpenPurchaseModal, onOpenDashboard }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeItem, setActiveItem] = useState('');
  const [hoveredItem, setHoveredItem] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { 
      label: 'Store', 
      href: '/store',
      icon: ShoppingBag,
      description: 'Buy gift cards',
      color: 'from-emerald-400 to-green-500'
    },
    { 
      label: 'Features', 
      href: '#features',
      icon: Star,
      description: 'Powerful tools',
      color: 'from-blue-400 to-indigo-500'
    },
    { 
      label: 'Pricing', 
      href: '#pricing',
      icon: Zap,
      description: 'Simple plans',
      color: 'from-purple-400 to-pink-500'
    },
    { 
      label: 'About', 
      href: '#about',
      icon: Shield,
      description: 'Our story',
      color: 'from-cyan-400 to-teal-500'
    },
  ];

  return (
    <>
      {/* Futuristic Navigation */}
      <motion.nav 
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${
          isScrolled 
            ? 'bg-slate-900/95 backdrop-blur-2xl border-b border-cyan-400/20 shadow-2xl shadow-cyan-500/10' 
            : 'bg-transparent'
        }`}
      >
        {/* Dynamic background effects */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div 
            className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-purple-600/5 via-cyan-500/5 to-blue-600/5"
            animate={{
              background: [
                'linear-gradient(90deg, rgba(147,51,234,0.05) 0%, rgba(6,182,212,0.05) 50%, rgba(37,99,235,0.05) 100%)',
                'linear-gradient(90deg, rgba(37,99,235,0.05) 0%, rgba(147,51,234,0.05) 50%, rgba(6,182,212,0.05) 100%)',
                'linear-gradient(90deg, rgba(6,182,212,0.05) 0%, rgba(37,99,235,0.05) 50%, rgba(147,51,234,0.05) 100%)'
              ]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />
          
          {/* Floating particles */}
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-cyan-400/30 rounded-full"
              animate={{
                x: [0, window.innerWidth || 1200],
                y: [0, -20, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 10 + i * 2,
                repeat: Infinity,
                delay: i * 2,
                ease: "linear"
              }}
              style={{
                top: `${20 + i * 10}%`,
              }}
            />
          ))}
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex justify-between items-center h-24">
            {/* Revolutionary Logo */}
            <motion.div 
              className="flex items-center space-x-4"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <div className="relative group">
                <motion.div 
                  className="w-20 h-20 gradient-premium-3 rounded-3xl flex items-center justify-center shadow-2xl relative overflow-hidden border border-cyan-400/20"
                  whileHover={{ 
                    rotateY: 15,
                    rotateX: 10,
                    scale: 1.05,
                    boxShadow: "0 25px 50px -12px rgba(6, 182, 212, 0.3)",
                    transition: { duration: 0.4 }
                  }}
                  style={{ transformStyle: "preserve-3d" }}
                >
                  {/* Inner holographic effect */}
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-br from-white/10 via-cyan-300/5 to-transparent rounded-3xl"
                    animate={{ 
                      background: [
                        'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(6,182,212,0.05) 50%, transparent 100%)',
                        'linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.1) 50%, rgba(6,182,212,0.05) 100%)',
                        'linear-gradient(135deg, rgba(6,182,212,0.05) 0%, transparent 50%, rgba(255,255,255,0.1) 100%)'
                      ]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                  
                  <Gift className="text-white relative z-10 drop-shadow-lg" size={28} />
                  
                  {/* Orbital particles */}
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 bg-cyan-300 rounded-full"
                      animate={{
                        rotate: [0, 360],
                        x: [0, 30 * Math.cos(i * 2.094), 0],
                        y: [0, 30 * Math.sin(i * 2.094), 0],
                        opacity: [0.3, 1, 0.3],
                        scale: [0.5, 1, 0.5]
                      }}
                      transition={{
                        duration: 4 + i * 0.5,
                        repeat: Infinity,
                        delay: i * 0.8,
                      }}
                      style={{
                        left: '50%',
                        top: '50%',
                        marginLeft: '-4px',
                        marginTop: '-4px'
                      }}
                    />
                  ))}
                </motion.div>
                
                {/* Premium status indicator */}
                <motion.div 
                  className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-full flex items-center justify-center border-2 border-white/20"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 360],
                    boxShadow: [
                      "0 0 0 0 rgba(251, 191, 36, 0.4)",
                      "0 0 0 10px rgba(251, 191, 36, 0)",
                      "0 0 0 0 rgba(251, 191, 36, 0)"
                    ]
                  }}
                  transition={{ 
                    duration: 3, 
                    repeat: Infinity,
                    ease: "easeInOut" 
                  }}
                >
                  <Sparkles size={14} className="text-white" />
                </motion.div>
              </div>
              
              <div className="flex flex-col">
                <motion.span 
                  className="font-display text-4xl font-black bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400 bg-clip-text text-transparent relative"
                  animate={{ 
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                  }}
                  transition={{ 
                    duration: 5, 
                    repeat: Infinity,
                    ease: "linear" 
                  }}
                  style={{ 
                    backgroundSize: '300% 300%' 
                  }}
                >
                  SiZu
                  {/* Text glow effect */}
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent blur-sm opacity-40"
                    animate={{ opacity: [0.2, 0.6, 0.2] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    SiZu
                  </motion.div>
                </motion.span>
                <motion.div 
                  className="font-mono text-sm text-cyan-300 tracking-[0.5em] font-bold uppercase relative"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  GIFTCARD™
                  <motion.div
                    className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-300 to-transparent"
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                  />
                </motion.div>
              </div>
            </motion.div>
            
            {/* Advanced Navigation Menu */}
            <div className="hidden lg:flex items-center space-x-2">
              {navItems.map((item, index) => (
                <motion.div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => setHoveredItem(item.label)}
                  onMouseLeave={() => setHoveredItem('')}
                >
                  {item.href.startsWith('/') ? (
                    <Link href={item.href}>
                      <motion.div
                        className="relative px-6 py-3 rounded-2xl text-gray-300 hover:text-white transition-all duration-300 font-semibold text-lg group flex items-center space-x-2 cursor-pointer"
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {/* Dynamic background */}
                        <motion.div
                          className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${item.color} opacity-0 group-hover:opacity-20 transition-opacity duration-300`}
                        />
                        
                        {/* Glow effect */}
                        <motion.div
                          className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${item.color} opacity-0 group-hover:opacity-10 blur-lg transition-opacity duration-300`}
                        />
                        
                        <item.icon size={18} className="relative z-10" />
                        <span className="relative z-10">{item.label}</span>
                      </motion.div>
                    </Link>
                  ) : (
                    <motion.a
                      href={item.href}
                      className="relative px-6 py-3 rounded-2xl text-gray-300 hover:text-white transition-all duration-300 font-semibold text-lg group flex items-center space-x-2"
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {/* Dynamic background */}
                      <motion.div
                        className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${item.color} opacity-0 group-hover:opacity-20 transition-opacity duration-300`}
                      />
                      
                      {/* Glow effect */}
                      <motion.div
                        className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${item.color} opacity-0 group-hover:opacity-10 blur-lg transition-opacity duration-300`}
                      />
                      
                      <item.icon size={18} className="relative z-10" />
                      <span className="relative z-10">{item.label}</span>
                    </motion.a>
                  )}
                  
                  {/* Hover tooltip */}
                  <AnimatePresence>
                    {hoveredItem === item.label && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.8 }}
                        className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-slate-800/95 backdrop-blur-sm text-cyan-300 px-3 py-1 rounded-lg text-sm whitespace-nowrap border border-cyan-400/20"
                      >
                        {item.description}
                        <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45 border-t border-l border-cyan-400/20"></div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
              
              {/* Premium CTA Buttons */}
              <div className="flex items-center space-x-4 ml-8">
                <motion.div 
                  whileHover={{ scale: 1.05, rotateY: 5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    onClick={onOpenDashboard}
                    className="relative px-8 py-3 glass-premium-button text-white font-bold rounded-2xl border border-cyan-400/30 hover:border-cyan-300/50 transition-all duration-300 group overflow-hidden"
                  >
                    {/* Button glow effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      animate={{ 
                        x: ['-100%', '100%'],
                      }}
                      transition={{ 
                        duration: 1.5, 
                        repeat: Infinity, 
                        repeatDelay: 3 
                      }}
                    />
                    
                    <span className="relative z-10 flex items-center space-x-2">
                      <Shield size={18} />
                      <span>Merchant Login</span>
                    </span>
                  </Button>
                </motion.div>
                
                <motion.div 
                  whileHover={{ scale: 1.05, rotateY: -5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    onClick={onOpenPurchaseModal}
                    className="relative px-8 py-3 gradient-premium-3 text-white font-bold rounded-2xl shadow-2xl hover:shadow-cyan-500/25 transition-all duration-300 group overflow-hidden border border-transparent"
                  >
                    {/* Animated background */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-purple-600 via-cyan-500 to-blue-600"
                      animate={{
                        x: ['-100%', '100%'],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatDelay: 1
                      }}
                    />
                    
                    <span className="relative z-10 flex items-center space-x-2">
                      <Sparkles size={18} />
                      <span>Get Started</span>
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
                    </span>
                  </Button>
                </motion.div>
              </div>
            </div>
            
            {/* Enhanced Mobile Menu Button */}
            <motion.div
              className="lg:hidden"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Button
                variant="ghost"
                size="sm"
                className="w-12 h-12 glass-premium rounded-2xl text-white hover:text-cyan-300 border border-cyan-400/20 hover:border-cyan-300/40 transition-all duration-300"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <motion.div
                  animate={{ rotate: isMobileMenuOpen ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </motion.div>
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.nav>

      {/* Advanced Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed top-24 left-4 right-4 z-40 lg:hidden"
          >
            <div className="glass-premium rounded-3xl border border-cyan-400/20 shadow-2xl p-6 space-y-6">
              {/* Mobile navigation items */}
              {navItems.map((item, index) => (
                <motion.a
                  key={item.label}
                  href={item.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center space-x-4 p-4 rounded-2xl glass-premium-button text-white hover:text-cyan-300 transition-all duration-300 group"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${item.color} flex items-center justify-center`}>
                    <item.icon size={20} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-lg">{item.label}</div>
                    <div className="text-sm text-gray-400 group-hover:text-cyan-400 transition-colors">
                      {item.description}
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-gray-500 group-hover:text-cyan-300 group-hover:translate-x-1 transition-all duration-300" />
                </motion.a>
              ))}
              
              {/* Mobile CTA buttons */}
              <div className="space-y-4 pt-4 border-t border-white/10">
                <Button 
                  onClick={() => {
                    onOpenDashboard();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full glass-premium-button text-white font-semibold py-4 rounded-2xl border border-cyan-400/30 hover:border-cyan-300/50 transition-all duration-300"
                >
                  <Shield size={18} className="mr-2" />
                  Merchant Login
                </Button>
                
                <Button 
                  onClick={() => {
                    onOpenPurchaseModal();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full gradient-premium-3 text-white font-bold py-4 rounded-2xl shadow-xl hover:shadow-cyan-500/25 transition-all duration-300"
                >
                  <Sparkles size={18} className="mr-2" />
                  Get Started
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}