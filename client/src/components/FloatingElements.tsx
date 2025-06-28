import { motion } from "framer-motion";
import { Gift, Star, Heart, CreditCard, Sparkles, Zap } from "lucide-react";

export default function FloatingElements() {
  const elements = [
    { icon: Gift, delay: 0, x: 100, y: 200, rotation: 0, color: "from-blue-400 to-blue-600" },
    { icon: Star, delay: 1, x: 300, y: 100, rotation: 45, color: "from-purple-400 to-purple-600" },
    { icon: Heart, delay: 2, x: 200, y: 350, rotation: 90, color: "from-pink-400 to-pink-600" },
    { icon: CreditCard, delay: 3, x: 400, y: 280, rotation: 135, color: "from-indigo-400 to-indigo-600" },
    { icon: Sparkles, delay: 4, x: 50, y: 120, rotation: 180, color: "from-yellow-400 to-orange-600" },
    { icon: Zap, delay: 5, x: 350, y: 50, rotation: 225, color: "from-green-400 to-green-600" }
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {elements.map((element, index) => (
        <motion.div
          key={index}
          initial={{ 
            opacity: 0, 
            scale: 0,
            rotateX: 0,
            rotateY: 0,
            rotateZ: element.rotation
          }}
          animate={{ 
            opacity: [0, 0.6, 0.3, 0.8, 0.2],
            scale: [0, 1.2, 0.8, 1.1, 0.9],
            rotateX: [0, 360, 0, 180, 0],
            rotateY: [0, 180, 360, 0, 180],
            rotateZ: [element.rotation, element.rotation + 360, element.rotation],
            x: [element.x, element.x + 50, element.x - 30, element.x + 20, element.x],
            y: [element.y, element.y - 40, element.y + 60, element.y - 20, element.y]
          }}
          transition={{
            duration: 20,
            delay: element.delay,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute"
          style={{
            transformStyle: "preserve-3d",
            left: element.x,
            top: element.y
          }}
        >
          <motion.div
            whileHover={{
              scale: 1.5,
              rotateZ: 720,
              transition: { duration: 0.5 }
            }}
            className={`w-16 h-16 bg-gradient-to-br ${element.color} rounded-2xl flex items-center justify-center shadow-2xl backdrop-blur-sm border border-white/20`}
          >
            <element.icon className="text-white" size={24} />
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}