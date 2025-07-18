import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Rocket, Zap, Star, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CTASectionProps {
  onOpenPurchaseModal: () => void;
}

export default function CTASection({ onOpenPurchaseModal }: CTASectionProps) {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background with 3D floating elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-700 to-indigo-800" />
      
      {/* Floating 3D shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            y: [0, -20, 0],
            rotateX: [0, 360],
            rotateY: [0, 180],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-blue-400/30 to-purple-400/30 rounded-3xl backdrop-blur-sm"
          style={{ transformStyle: "preserve-3d" }}
        />
        <motion.div
          animate={{
            y: [0, 30, 0],
            rotateX: [0, -360],
            rotateZ: [0, 180],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
          className="absolute bottom-20 right-20 w-24 h-24 bg-gradient-to-br from-pink-400/30 to-indigo-400/30 rounded-full backdrop-blur-sm"
          style={{ transformStyle: "preserve-3d" }}
        />
        <motion.div
          animate={{
            x: [0, 40, 0],
            rotateY: [0, 360],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 4
          }}
          className="absolute top-1/2 right-1/4 w-16 h-16 bg-gradient-to-br from-yellow-400/30 to-orange-400/30 rounded-2xl backdrop-blur-sm"
          style={{ transformStyle: "preserve-3d" }}
        />
      </div>

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <motion.div
            animate={{
              rotate: [0, 360],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl"
          >
            <Sparkles className="text-white" size={32} />
          </motion.div>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-5xl md:text-6xl font-bold text-white mb-6"
        >
          Ready to Transform Your 
          <motion.span 
            className="block bg-gradient-to-r from-yellow-400 to-pink-400 bg-clip-text text-transparent"
            animate={{
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            Gift Card Business?
          </motion.span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto leading-relaxed"
        >
          Join thousands of businesses already using SiZu GiftCard to increase customer loyalty, 
          boost sales, and streamline their gift card operations.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-8 justify-center items-center"
        >
          <motion.div
            whileHover={{ 
              scale: 1.05,
              rotateY: 5,
              transition: { duration: 0.3 }
            }}
            whileTap={{ scale: 0.95 }}
            className="relative"
          >
            <Button 
              onClick={onOpenPurchaseModal}
              className="relative px-12 py-6 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-black font-display font-bold text-xl rounded-3xl shadow-2xl hover:shadow-yellow-400/30 transition-all duration-500 group overflow-hidden"
            >
              {/* Animated shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/40 to-white/20"
                animate={{
                  x: ['-100%', '100%'],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  repeatDelay: 2
                }}
              />
              
              <span className="relative z-10 flex items-center space-x-3">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Rocket size={24} />
                </motion.div>
                <span>Start Free Trial</span>
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <ArrowRight size={24} />
                </motion.div>
              </span>
              
              {/* Floating stars around button */}
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-white rounded-full"
                  animate={{
                    x: [0, 30 * Math.cos(i * 2.094), 0],
                    y: [0, 30 * Math.sin(i * 2.094), 0],
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0]
                  }}
                  transition={{
                    duration: 2 + i * 0.5,
                    repeat: Infinity,
                    delay: i * 0.3,
                  }}
                  style={{
                    left: '50%',
                    top: '50%',
                  }}
                />
              ))}
            </Button>
          </motion.div>

          <motion.div
            whileHover={{ 
              scale: 1.05,
              rotateY: -5,
              transition: { duration: 0.3 }
            }}
            whileTap={{ scale: 0.95 }}
            className="relative"
          >
            <Button 
              variant="outline"
              className="relative px-12 py-6 glass-premium-button border-2 border-white/30 text-white hover:border-white/60 font-display font-semibold text-xl rounded-3xl backdrop-blur-md transition-all duration-500 group"
            >
              {/* Glow effect on hover */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-white/5 to-white/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              />
              
              <span className="relative z-10 flex items-center space-x-3">
                <Shield size={24} />
                <span>Watch Demo</span>
              </span>
              
              {/* Pulsing border effect */}
              <motion.div
                className="absolute inset-0 border-2 border-white/20 rounded-3xl"
                animate={{
                  opacity: [0.5, 1, 0.5],
                  scale: [1, 1.02, 1]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </Button>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center"
        >
          {[
            { number: "14-day", label: "Free Trial" },
            { number: "No", label: "Setup Fees" },
            { number: "24/7", label: "Support" }
          ].map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ 
                duration: 0.6, 
                delay: 0.8 + index * 0.2,
                type: "spring",
                stiffness: 200
              }}
              whileHover={{
                scale: 1.1,
                rotateY: 10,
                transition: { duration: 0.2 }
              }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:border-white/40 transition-all duration-300"
              style={{ transformStyle: "preserve-3d" }}
            >
              <div className="text-2xl font-bold text-yellow-400 mb-2">{item.number}</div>
              <div className="text-blue-100">{item.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}