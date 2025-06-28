import { Gift, Play, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Link } from "wouter";
import GiftCardGrid from "./GiftCardGrid";
import FloatingElements from "./FloatingElements";

interface HeroSectionProps {
  onOpenPurchaseModal: () => void;
}

export default function HeroSection({ onOpenPurchaseModal }: HeroSectionProps) {
  return (
    <section className="pt-24 pb-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900">
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-purple-500/10" />
        <div className="absolute top-20 left-20 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-blue-500/10 to-transparent rounded-full" />
      </div>
      <FloatingElements />
      <div className="max-w-8xl mx-auto relative z-10">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.h1 
            className="font-display text-8xl md:text-9xl font-black leading-none mb-12"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            <motion.span 
              className="block text-white drop-shadow-2xl"
              animate={{
                textShadow: [
                  "0 0 20px rgba(255,255,255,0.3)",
                  "0 0 40px rgba(59,130,246,0.5)",
                  "0 0 20px rgba(255,255,255,0.3)"
                ]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              Digital
            </motion.span>
            <motion.span 
              className="block bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-500 bg-clip-text text-transparent"
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
              Gift Cards
            </motion.span>
            <motion.span 
              className="block font-mono text-4xl md:text-5xl text-cyan-300 tracking-[0.2em] mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 1 }}
            >
              REIMAGINED
            </motion.span>
          </motion.h1>
          <motion.p 
            className="text-2xl text-gray-200 mb-16 max-w-5xl mx-auto leading-relaxed font-light"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            Experience the next generation of digital gift cards with 
            <span className="text-cyan-300 font-medium"> Square's enterprise platform</span>, 
            real-time analytics, and seamless customer experiences that drive business growth.
          </motion.p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <motion.div
              whileHover={{ scale: 1.05, rotateY: 5 }}
              whileTap={{ scale: 0.95 }}
              className="relative"
            >
              <Button 
                onClick={onOpenPurchaseModal}
                size="lg"
                className="relative px-16 py-8 gradient-premium-3 text-white font-display font-bold text-2xl rounded-3xl shadow-2xl hover:shadow-cyan-500/30 transition-all duration-500 border-none group overflow-hidden"
              >
                {/* Animated background shimmer */}
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
                
                <span className="relative z-10 flex items-center space-x-4">
                  <Gift size={28} />
                  <span>Experience SiZu</span>
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
                  />
                </span>
              </Button>
              
              {/* Floating particles around button */}
              {[...Array(4)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-cyan-300 rounded-full opacity-60"
                  animate={{
                    x: [0, 40 * Math.cos(i * 1.57), 0],
                    y: [0, 40 * Math.sin(i * 1.57), 0],
                    opacity: [0.3, 1, 0.3],
                    scale: [0.5, 1, 0.5]
                  }}
                  transition={{
                    duration: 3 + i * 0.5,
                    repeat: Infinity,
                    delay: i * 0.4,
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
            
            <Link href="/store">
              <motion.div
                whileHover={{ scale: 1.05, rotateY: 5 }}
                whileTap={{ scale: 0.95 }}
                className="relative"
              >
                <Button 
                  variant="default" 
                  size="lg"
                  className="relative px-16 py-8 bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 font-display font-semibold text-2xl rounded-3xl shadow-2xl transition-all duration-500 group"
                >
                  {/* Shimmer effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100"
                    animate={{
                      x: ['-100%', '100%'],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      repeatDelay: 2
                    }}
                  />
                  
                  <span className="relative z-10 flex items-center space-x-4">
                    <ShoppingBag size={28} />
                    <span>Browse Store</span>
                  </span>
                </Button>
              </motion.div>
            </Link>
            
            <motion.div
              whileHover={{ scale: 1.05, rotateY: -5 }}
              whileTap={{ scale: 0.95 }}
              className="relative"
            >
              <Button 
                variant="outline" 
                size="lg"
                className="relative px-16 py-8 glass-premium-button border-2 border-cyan-400/30 text-white hover:border-cyan-400/60 font-display font-semibold text-2xl rounded-3xl backdrop-blur-md transition-all duration-500 group"
              >
                {/* Glow effect on hover */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-cyan-400/10 to-blue-500/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                />
                
                <span className="relative z-10 flex items-center space-x-4">
                  <Play size={28} />
                  <span>Watch Demo</span>
                </span>
                
                {/* Border animation */}
                <motion.div
                  className="absolute inset-0 border-2 border-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 rounded-3xl opacity-0 group-hover:opacity-30"
                  animate={{
                    rotate: [0, 360]
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  style={{
                    mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    maskComposite: 'subtract'
                  }}
                />
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
