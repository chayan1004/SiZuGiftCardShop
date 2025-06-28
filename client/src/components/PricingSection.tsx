import { motion } from "framer-motion";
import { Check, Star, Zap, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PricingSection() {
  const plans = [
    {
      name: "Starter",
      price: "Free",
      description: "Perfect for small businesses getting started",
      icon: Star,
      features: [
        "Up to 100 gift cards/month",
        "Basic analytics dashboard",
        "Email support",
        "Square integration",
        "Mobile-friendly interface"
      ],
      buttonText: "Get Started",
      popular: false,
      gradient: "from-blue-500 to-blue-600"
    },
    {
      name: "Professional",
      price: "$29",
      period: "/month",
      description: "Ideal for growing businesses with advanced needs",
      icon: Zap,
      features: [
        "Unlimited gift cards",
        "Advanced analytics & reporting",
        "Priority support",
        "Custom branding",
        "API access",
        "Multi-location support",
        "Automated campaigns"
      ],
      buttonText: "Start Free Trial",
      popular: true,
      gradient: "from-purple-500 to-pink-600"
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "Tailored solutions for large organizations",
      icon: Crown,
      features: [
        "Everything in Professional",
        "Dedicated account manager",
        "Custom integrations",
        "SLA guarantee",
        "White-label solution",
        "Advanced security features",
        "Training & onboarding"
      ],
      buttonText: "Contact Sales",
      popular: false,
      gradient: "from-indigo-500 to-purple-600"
    }
  ];

  return (
    <section id="pricing" className="py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-500/10 via-blue-500/5 to-indigo-500/10" />
        <div className="absolute top-20 left-20 w-[500px] h-[500px] bg-purple-400/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-[500px] h-[500px] bg-blue-400/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "3s" }} />
        <div className="absolute top-1/3 right-1/3 w-[300px] h-[300px] bg-indigo-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1.5s" }} />
      </div>
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="font-display text-6xl font-bold text-white mb-8"
          >
            Simple, <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400 bg-clip-text text-transparent">Transparent</span> Pricing
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-2xl text-gray-200 max-w-4xl mx-auto leading-relaxed"
          >
            Choose the perfect plan for your business. Scale seamlessly with enterprise-grade features.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 50, rotateX: -10 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ 
                duration: 0.8, 
                delay: index * 0.2,
                type: "spring",
                stiffness: 100
              }}
              whileHover={{ 
                y: -10,
                rotateX: 5,
                rotateY: 5,
                scale: 1.02,
                transition: { duration: 0.3 }
              }}
              className={`relative glass-card rounded-3xl p-10 shadow-2xl transition-all duration-500 group cursor-pointer ${
                plan.popular 
                  ? 'border-cyan-300/30 shadow-cyan-500/20 hover:shadow-cyan-500/40' 
                  : 'hover:shadow-purple-500/20'
              }`}
              style={{
                transformStyle: "preserve-3d"
              }}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                  className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg"
                >
                  Most Popular
                </motion.div>
              )}

              {/* Plan Icon */}
              <motion.div 
                className={`w-16 h-16 bg-gradient-to-br ${plan.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:shadow-xl transition-all duration-300`}
                whileHover={{ 
                  rotateZ: 15,
                  scale: 1.1,
                  transition: { duration: 0.3 }
                }}
                style={{
                  transformStyle: "preserve-3d"
                }}
              >
                <plan.icon className="text-white" size={28} />
              </motion.div>

              {/* Plan Details */}
              <div className="mb-10">
                <h3 className="font-display text-3xl font-bold text-white mb-3">{plan.name}</h3>
                <p className="text-gray-300 text-lg mb-6">{plan.description}</p>
                <div className="flex items-baseline mb-8">
                  <span className="font-display text-5xl font-bold text-white">{plan.price}</span>
                  {plan.period && <span className="text-cyan-300 ml-2 text-xl font-semibold">{plan.period}</span>}
                </div>
              </div>

              {/* Features List */}
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <motion.li
                    key={feature}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.2 + featureIndex * 0.1 }}
                    className="flex items-center text-[#e1e5e9] bg-[#0000]"
                  >
                    <motion.div
                      whileHover={{ scale: 1.2, rotateZ: 360 }}
                      transition={{ duration: 0.3 }}
                      className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mr-3 flex-shrink-0"
                    >
                      <Check className="text-white" size={12} />
                    </motion.div>
                    {feature}
                  </motion.li>
                ))}
              </ul>

              {/* CTA Button */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  className={`w-full py-3 text-lg font-semibold rounded-xl transition-all duration-300 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl'
                      : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl'
                  }`}
                >
                  {plan.buttonText}
                </Button>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-center mt-16"
        >
          <p className="mb-4 text-[#dde8fd]">
            All plans include 14-day free trial • No setup fees • Cancel anytime
          </p>
          <p className="text-sm text-[#f8faff]">
            Questions? <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">Contact our sales team</a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}