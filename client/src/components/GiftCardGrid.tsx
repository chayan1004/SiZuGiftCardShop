import { Gift, Star, Heart, QrCode } from "lucide-react";
import { motion } from "framer-motion";

export default function GiftCardGrid() {
  const giftCards = [
    {
      amount: 50,
      icon: Gift,
      gradient: "from-blue-500 to-blue-600",
      gan: "**** **** **** 1234",
      delay: 0
    },
    {
      amount: 100,
      icon: Star,
      gradient: "from-emerald-500 to-teal-600",
      gan: "**** **** **** 5678",
      delay: 0.5
    },
    {
      amount: 25,
      icon: Heart,
      gradient: "from-purple-500 to-pink-600",
      gan: "**** **** **** 9012",
      delay: 1
    }
  ];

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {giftCards.map((card) => (
        <motion.div 
          key={card.gan}
          className="glass-card rounded-3xl p-8 shadow-2xl hover:shadow-purple-500/20 group cursor-pointer"
          initial={{ opacity: 0, y: 50, rotateX: -15 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ 
            delay: card.delay,
            duration: 0.8,
            ease: "easeOut"
          }}
          whileHover={{ 
            y: -20,
            rotateX: 8,
            rotateY: 5,
            scale: 1.05,
            transition: { duration: 0.4 }
          }}
          style={{ transformStyle: "preserve-3d" }}
        >
          <div className={`bg-gradient-to-br ${card.gradient} rounded-2xl p-8 text-white mb-6 shadow-2xl group-hover:shadow-3xl transition-all duration-500 relative overflow-hidden`}>
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              animate={{
                backgroundPosition: ['0% 0%', '100% 100%'],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear"
              }}
            />
            <div className="flex justify-between items-start mb-12 relative z-10">
              <div>
                <h3 className="font-display text-xl font-bold drop-shadow-lg">SiZu</h3>
                <p className="text-white/90 text-sm font-mono tracking-wide">POWERED BY SQUARE</p>
              </div>
              <motion.div
                whileHover={{ 
                  rotateZ: 180,
                  scale: 1.2
                }}
                transition={{ duration: 0.3 }}
              >
                <card.icon size={28} className="drop-shadow-lg" />
              </motion.div>
            </div>
            <div className="flex justify-between items-end relative z-10">
              <div className="text-4xl font-display font-bold drop-shadow-lg">${card.amount}</div>
              <div className="text-right">
                <div className="text-xs font-mono opacity-80">GIFT CARD</div>
                <div className="text-xs font-mono opacity-60">DIGITAL</div>
              </div>
            </div>
          </div>
          <div className="text-center">
            <motion.div 
              className="glass-premium rounded-2xl p-6 mb-4 group-hover:bg-white/10 transition-all duration-500"
              whileHover={{ scale: 1.1, rotateZ: 5 }}
              transition={{ duration: 0.3 }}
            >
              <div className="w-24 h-24 bg-gradient-to-br from-white/20 to-white/5 rounded-2xl mx-auto flex items-center justify-center border border-white/20 shadow-lg">
                <motion.div
                  animate={{
                    rotateZ: [0, 360],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                >
                  <QrCode className="text-white/80" size={32} />
                </motion.div>
              </div>
            </motion.div>
            <p className="font-mono text-xs text-gray-300 font-medium tracking-wider bg-gradient-to-r from-gray-400 to-gray-200 bg-clip-text text-transparent">
              {card.gan}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
