import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

export default function TestimonialsSection() {
  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Coffee Shop Owner",
      company: "Bean & Brew",
      content: "SiZu GiftCard transformed our customer loyalty program. Sales increased by 40% and our customers love the seamless experience.",
      rating: 5,
      avatar: "SC"
    },
    {
      name: "Marcus Rodriguez",
      role: "Restaurant Manager",
      company: "Taste Kitchen",
      content: "The analytics dashboard gives us incredible insights. We can track gift card usage patterns and optimize our marketing campaigns.",
      rating: 5,
      avatar: "MR"
    },
    {
      name: "Emily Thompson",
      role: "Retail Director",
      company: "Fashion Forward",
      content: "Integration was effortless and the security features give us complete peace of mind. Our customers trust the Square platform.",
      rating: 5,
      avatar: "ET"
    }
  ];

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full opacity-30">
          <div className="w-full h-full bg-gradient-to-br from-blue-500/10 to-purple-500/10" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl font-bold text-white mb-6"
          >
            Loved by <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Thousands</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl text-blue-100 max-w-3xl mx-auto"
          >
            See what our customers are saying about their experience with SiZu GiftCard
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 50, rotateX: -15 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ 
                duration: 0.8, 
                delay: index * 0.2,
                type: "spring",
                stiffness: 100
              }}
              whileHover={{ 
                y: -15,
                rotateX: 5,
                rotateY: 5,
                scale: 1.02,
                transition: { duration: 0.3 }
              }}
              className="group bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:border-white/40 transition-all duration-500 hover:shadow-2xl"
              style={{
                transformStyle: "preserve-3d"
              }}
            >
              {/* Quote Icon */}
              <motion.div 
                className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center mb-6 shadow-lg"
                whileHover={{ 
                  rotateZ: 360,
                  scale: 1.1
                }}
                transition={{ duration: 0.5 }}
              >
                <Quote className="text-white" size={20} />
              </motion.div>

              {/* Rating Stars */}
              <div className="flex mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.2 + i * 0.1 }}
                    whileHover={{ 
                      scale: 1.2,
                      rotateZ: 72
                    }}
                  >
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  </motion.div>
                ))}
              </div>

              {/* Testimonial Content */}
              <blockquote className="text-white mb-6 text-lg leading-relaxed group-hover:text-blue-100 transition-colors duration-300">
                "{testimonial.content}"
              </blockquote>

              {/* Author Info */}
              <div className="flex items-center">
                <motion.div 
                  className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold mr-4 shadow-lg"
                  whileHover={{ 
                    rotateY: 180,
                    scale: 1.1
                  }}
                  transition={{ duration: 0.5 }}
                >
                  {testimonial.avatar}
                </motion.div>
                <div>
                  <div className="text-white font-semibold">{testimonial.name}</div>
                  <div className="text-blue-200 text-sm">{testimonial.role}</div>
                  <div className="text-blue-300 text-sm font-medium">{testimonial.company}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust Indicators */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-center mt-16"
        >
          <p className="text-blue-200 mb-8">Trusted by businesses worldwide</p>
          <div className="flex justify-center items-center space-x-8 opacity-60">
            {["Square", "Visa", "Mastercard", "PayPal", "Stripe"].map((brand, index) => (
              <motion.div
                key={brand}
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 0.6, scale: 1 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                whileHover={{ 
                  opacity: 1,
                  scale: 1.1,
                  transition: { duration: 0.2 }
                }}
                className="text-white font-semibold text-lg"
              >
                {brand}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}