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
          className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/30 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            delay: card.delay,
            duration: 0.6,
            ease: "easeOut"
          }}
        >
          <div className={`bg-gradient-to-br ${card.gradient} rounded-xl p-6 text-white mb-4 shadow-lg`}>
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="font-semibold text-lg drop-shadow-sm">SiZu GiftCard</h3>
                <p className="text-white/80 text-sm">Powered by Square</p>
              </div>
              <card.icon size={24} className="opacity-90 drop-shadow-sm" />
            </div>
            <div className="text-3xl font-bold drop-shadow-sm">${card.amount}</div>
          </div>
          <div className="text-center">
            <div className="bg-slate-50 rounded-lg p-4 mb-3 border border-slate-200">
              <div className="w-20 h-20 bg-slate-200 rounded-lg mx-auto flex items-center justify-center border">
                <QrCode className="text-slate-600" size={24} />
              </div>
            </div>
            <p className="text-xs text-slate-700 font-medium tracking-wide">{card.gan}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
