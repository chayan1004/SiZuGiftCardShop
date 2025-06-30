import React from 'react';
import { motion } from 'framer-motion';
import { Gift, Sparkles, Zap } from 'lucide-react';

interface LoadingAnimationProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'minimal' | 'full-screen';
  message?: string;
  className?: string;
}

export const LoadingAnimation: React.FC<LoadingAnimationProps> = ({
  size = 'md',
  variant = 'default',
  message = 'Loading...',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  // Rotating gift box animation
  const giftVariants = {
    animate: {
      rotateY: [0, 360],
      scale: [1, 1.1, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  // Floating sparkles animation
  const sparkleVariants = {
    animate: {
      y: [-10, 10, -10],
      opacity: [0.5, 1, 0.5],
      scale: [0.8, 1.2, 0.8],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  // Pulsing energy ring animation
  const ringVariants = {
    animate: {
      scale: [1, 1.5, 1],
      opacity: [0.8, 0.3, 0.8],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  // Lightning bolt animation
  const boltVariants = {
    animate: {
      rotate: [0, 10, -10, 0],
      scale: [1, 1.1, 1],
      transition: {
        duration: 0.5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  // Text shimmer animation
  const textVariants = {
    animate: {
      opacity: [0.6, 1, 0.6],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  if (variant === 'full-screen') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl">
        <div className="text-center">
          {/* Main Loading Animation */}
          <div className="relative mb-8">
            {/* Outer energy ring */}
            <motion.div
              variants={ringVariants}
              animate="animate"
              className="absolute inset-0 rounded-full border-4 border-purple-500/30 w-32 h-32"
            />
            
            {/* Inner energy ring */}
            <motion.div
              variants={ringVariants}
              animate="animate"
              style={{ animationDelay: '0.5s' }}
              className="absolute inset-2 rounded-full border-2 border-pink-500/40 w-28 h-28"
            />

            {/* Central gift box */}
            <motion.div
              variants={giftVariants}
              animate="animate"
              className="relative z-10 w-32 h-32 flex items-center justify-center"
            >
              <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-2xl">
                <Gift className="w-8 h-8" />
              </div>
            </motion.div>

            {/* Floating sparkles */}
            <motion.div
              variants={sparkleVariants}
              animate="animate"
              className="absolute -top-2 -right-2 text-yellow-400"
            >
              <Sparkles className="w-6 h-6" />
            </motion.div>
            
            <motion.div
              variants={sparkleVariants}
              animate="animate"
              style={{ animationDelay: '0.7s' }}
              className="absolute -bottom-2 -left-2 text-blue-400"
            >
              <Sparkles className="w-4 h-4" />
            </motion.div>

            <motion.div
              variants={boltVariants}
              animate="animate"
              className="absolute top-0 left-0 text-purple-400"
            >
              <Zap className="w-5 h-5" />
            </motion.div>
          </div>

          {/* Brand Text */}
          <motion.div
            variants={textVariants}
            animate="animate"
            className="mb-4"
          >
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent">
              SiZu GiftCard
            </h1>
          </motion.div>

          {/* Loading Message */}
          <motion.p
            variants={textVariants}
            animate="animate"
            style={{ animationDelay: '0.3s' }}
            className="text-lg text-gray-600 dark:text-gray-400"
          >
            {message}
          </motion.p>

          {/* Loading dots */}
          <div className="flex justify-center items-center space-x-2 mt-6">
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: index * 0.2,
                }}
                className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'minimal') {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="relative">
          <motion.div
            variants={giftVariants}
            animate="animate"
            className={`${sizeClasses[size]} flex items-center justify-center`}
          >
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 text-white">
              <Gift className="w-4 h-4" />
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
      <div className="relative">
        {/* Energy ring */}
        <motion.div
          variants={ringVariants}
          animate="animate"
          className={`absolute inset-0 rounded-full border-2 border-purple-500/40 ${sizeClasses[size]}`}
        />

        {/* Central gift box */}
        <motion.div
          variants={giftVariants}
          animate="animate"
          className={`relative z-10 ${sizeClasses[size]} flex items-center justify-center`}
        >
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-lg">
            <Gift className="w-6 h-6" />
          </div>
        </motion.div>

        {/* Sparkles */}
        <motion.div
          variants={sparkleVariants}
          animate="animate"
          className="absolute -top-1 -right-1 text-yellow-400"
        >
          <Sparkles className="w-4 h-4" />
        </motion.div>
      </div>

      {message && (
        <motion.p
          variants={textVariants}
          animate="animate"
          className={`${textSizes[size]} text-gray-600 dark:text-gray-400 text-center`}
        >
          {message}
        </motion.p>
      )}
    </div>
  );
};

export default LoadingAnimation;