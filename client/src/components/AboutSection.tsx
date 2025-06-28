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
    <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 opacity-50" />
      <div className="absolute top-20 left-20 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" />
      <div className="absolute bottom-20 right-20 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{ animationDelay: "2s" }} />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl font-bold text-slate-900 mb-6"
          >
            Why Choose <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">SiZu GiftCard</span>?
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl text-slate-700 max-w-3xl mx-auto leading-relaxed"
          >
            We're revolutionizing the gift card industry with cutting-edge technology, 
            unmatched security, and an exceptional user experience.
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
              className="text-center bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300"
              style={{
                transformStyle: "preserve-3d"
              }}
            >
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <stat.icon className="text-white" size={28} />
              </div>
              <div className="text-3xl font-bold text-slate-900 mb-2">{stat.value}</div>
              <div className="text-slate-600 font-medium">{stat.label}</div>
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