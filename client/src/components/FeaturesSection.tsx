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
    <section id="features" className="py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      {/* Rich Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-pink-500/10" />
        <div className="absolute top-10 right-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 left-10 w-72 h-72 bg-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "3s" }} />
      </div>
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-20">
          <motion.h2 
            className="font-display text-6xl font-bold text-white mb-6"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Powered by <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400 bg-clip-text text-transparent">Square</span>
          </motion.h2>
          <motion.p 
            className="text-2xl text-gray-200 max-w-4xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Built on Square's enterprise payment platform with world-class security, reliability, and seamless integration.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 50, rotateX: -15 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ delay: feature.delay, duration: 0.8 }}
              whileHover={{ 
                y: -20,
                rotateX: 5,
                rotateY: 5,
                scale: 1.02,
                transition: { duration: 0.3 }
              }}
              className="glass-card rounded-3xl p-10 shadow-2xl hover:shadow-cyan-500/20 group cursor-pointer"
              style={{ transformStyle: "preserve-3d" }}
            >
              <motion.div 
                className={`w-20 h-20 bg-gradient-to-br ${feature.gradient} rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl group-hover:shadow-blue-500/30 transition-all duration-500`}
                initial={{ scale: 0, rotateZ: -180 }}
                whileInView={{ scale: 1, rotateZ: 0 }}
                transition={{ type: "spring", stiffness: 200, delay: feature.delay + 0.2 }}
                whileHover={{ 
                  rotateZ: 360,
                  scale: 1.15,
                  transition: { duration: 0.5 }
                }}
              >
                <feature.icon className="text-white drop-shadow-lg" size={32} />
              </motion.div>
              <h3 className="font-display text-2xl font-bold text-white mb-4 group-hover:text-cyan-300 transition-colors duration-300 text-center">
                {feature.title}
              </h3>
              <p className="text-gray-300 text-lg leading-relaxed group-hover:text-gray-200 transition-colors duration-300 text-center">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
