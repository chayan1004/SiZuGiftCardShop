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
    <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Background Effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: "3s" }} />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl font-bold text-slate-900 mb-6"
          >
            Simple, <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Transparent</span> Pricing
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl text-slate-700 max-w-3xl mx-auto"
          >
            Choose the perfect plan for your business. Upgrade or downgrade at any time.
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
              className={`relative bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border transition-all duration-500 group ${
                plan.popular 
                  ? 'border-purple-300 shadow-purple-200/50 hover:shadow-purple-300/60' 
                  : 'border-white/30 hover:shadow-2xl'
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
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                <p className="text-slate-600 mb-4">{plan.description}</p>
                <div className="flex items-baseline mb-6">
                  <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                  {plan.period && <span className="text-slate-600 ml-1">{plan.period}</span>}
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
                    className="flex items-center text-slate-700"
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
          <p className="text-slate-600 mb-4">
            All plans include 14-day free trial • No setup fees • Cancel anytime
          </p>
          <p className="text-sm text-slate-500">
            Questions? <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">Contact our sales team</a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}