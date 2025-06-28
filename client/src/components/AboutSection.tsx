import { motion } from "framer-motion";
import { Shield, Award, Users, TrendingUp, Globe, Zap } from "lucide-react";

export default function AboutSection() {
  const stats = [
    { value: "10K+", label: "Happy Merchants", icon: Users },
    { value: "99.9%", label: "Uptime", icon: TrendingUp },
    { value: "50+", label: "Countries", icon: Globe },
    { value: "24/7", label: "Support", icon: Zap }
  ];

  const features = [
    {
      icon: Shield,
      title: "Bank-Level Security",
      description: "Your transactions are protected by enterprise-grade encryption and Square's trusted security infrastructure."
    },
    {
      icon: Award,
      title: "Industry Leader",
      description: "Trusted by thousands of businesses worldwide, from small cafes to large retail chains."
    },
    {
      icon: Users,
      title: "Customer First",
      description: "Built with user experience in mind, making gift card management simple and intuitive."
    }
  ];

  return (
    <section className="py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-indigo-500/10" />
        <div className="absolute top-32 right-32 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-32 left-32 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-cyan-500/10 to-transparent rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="font-display text-6xl font-bold text-white mb-8"
          >
            Why Choose <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400 bg-clip-text text-transparent">SiZu GiftCard</span>?
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-2xl text-gray-200 max-w-4xl mx-auto leading-relaxed"
          >
            We're revolutionizing the gift card industry with cutting-edge technology, 
            unmatched security, and exceptional user experiences that drive business growth.
          </motion.p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ 
                duration: 0.6, 
                delay: index * 0.1,
                type: "spring",
                stiffness: 100
              }}
              whileHover={{ 
                scale: 1.05,
                rotateY: 10,
                transition: { duration: 0.2 }
              }}
              className="text-center glass-card rounded-3xl p-8 shadow-2xl hover:shadow-cyan-500/20 transition-all duration-500"
              style={{
                transformStyle: "preserve-3d"
              }}
            >
              <div className="w-20 h-20 gradient-premium-3 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
                <stat.icon className="text-white drop-shadow-lg" size={32} />
              </div>
              <div className="text-4xl font-display font-bold text-white mb-3">{stat.value}</div>
              <div className="text-cyan-300 font-semibold text-lg">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.8, 
                delay: index * 0.2,
                type: "spring",
                stiffness: 80
              }}
              whileHover={{ 
                y: -10,
                transition: { duration: 0.3 }
              }}
              className="group bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/30 hover:shadow-2xl transition-all duration-500"
            >
              <motion.div 
                className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:shadow-xl transition-all duration-300"
                whileHover={{ 
                  rotateX: 15,
                  rotateY: 15,
                  scale: 1.1
                }}
                style={{
                  transformStyle: "preserve-3d"
                }}
              >
                <feature.icon className="text-white drop-shadow-sm" size={28} />
              </motion.div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4 group-hover:text-blue-600 transition-colors duration-300">
                {feature.title}
              </h3>
              <p className="text-slate-700 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}