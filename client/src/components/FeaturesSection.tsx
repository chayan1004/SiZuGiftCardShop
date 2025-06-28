import { Shield, Smartphone, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export default function FeaturesSection() {
  const features = [
    {
      icon: Shield,
      title: "Bank-Level Security",
      description: "Your gift cards are protected by Square's enterprise-grade security and fraud prevention.",
      gradient: "from-square-blue to-indigo-600",
      delay: 0
    },
    {
      icon: Smartphone,
      title: "Mobile Ready",
      description: "Send and redeem gift cards anywhere with QR codes and mobile-optimized checkout.",
      gradient: "from-emerald-500 to-teal-600",
      delay: 0.1
    },
    {
      icon: TrendingUp,
      title: "Real-time Analytics",
      description: "Track sales, redemptions, and customer insights with our merchant dashboard.",
      gradient: "from-purple-500 to-pink-600",
      delay: 0.2
    }
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Powered by Square</h2>
          <p className="text-xl text-slate-700 max-w-2xl mx-auto">
            Built on Square's trusted payment platform with enterprise-grade security and reliability.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div 
              key={feature.title}
              className="text-center group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: feature.delay, duration: 0.5 }}
            >
              <motion.div 
                className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mx-auto mb-6`}
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <feature.icon className="text-white" size={24} />
              </motion.div>
              <h3 className="text-xl font-semibold text-slate-800 mb-3">{feature.title}</h3>
              <p className="text-slate-600">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
