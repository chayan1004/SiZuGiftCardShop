import { Gift, Star, Heart, QrCode } from "lucide-react";
import { motion } from "framer-motion";

export default function GiftCardGrid() {
  const giftCards = [
    {
      amount: 50,
      icon: Gift,
      gradient: "from-square-blue to-indigo-600",
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
          className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20"
          style={{ 
            animationDelay: `${card.delay}s`,
            animationDuration: "6s",
            animationIterationCount: "infinite",
            animationTimingFunction: "ease-in-out"
          }}
          animate={{ y: [0, -10, 0] }}
          transition={{ 
            duration: 6, 
            repeat: Infinity, 
            delay: card.delay,
            ease: "easeInOut"
          }}
        >
          <div className={`bg-gradient-to-br ${card.gradient} rounded-xl p-6 text-white mb-4`}>
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="font-semibold text-lg">SiZu GiftCard</h3>
                <p className="text-white/70 text-sm">Powered by Square</p>
              </div>
              <card.icon size={24} className="opacity-80" />
            </div>
            <div className="text-3xl font-bold">${card.amount}</div>
          </div>
          <div className="text-center">
            <div className="bg-slate-100 rounded-lg p-3 mb-2">
              <div className="w-20 h-20 bg-slate-300 rounded mx-auto flex items-center justify-center">
                <QrCode className="text-slate-500" size={24} />
              </div>
            </div>
            <p className="text-xs text-slate-500">{card.gan}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
