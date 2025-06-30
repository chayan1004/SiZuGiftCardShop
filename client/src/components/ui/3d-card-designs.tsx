import React from 'react';

interface Card3DDesignProps {
  category: string;
  amount: number;
  merchantName: string;
  className?: string;
}

export function Card3DDesign({ category, amount, merchantName, className = "" }: Card3DDesignProps) {
  const formatAmount = (amount: number) => `$${(amount / 100).toFixed(2)}`;

  const getDesignByCategory = () => {
    switch (category?.toLowerCase()) {
      case 'gaming':
        return (
          <div className={`relative w-full h-48 perspective-1000 ${className}`}>
            <div className="relative w-full h-full transform-style-preserve-3d hover:rotate-y-12 transition-all duration-500">
              {/* Gaming Card Design */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-black rounded-xl shadow-2xl border border-purple-500/30">
                {/* Circuit Pattern Background */}
                <div className="absolute inset-0 opacity-20">
                  <svg className="w-full h-full" viewBox="0 0 400 200">
                    <defs>
                      <pattern id="circuit" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M10 10 L30 10 L30 30 L10 30 Z" fill="none" stroke="#00ff88" strokeWidth="0.5"/>
                        <circle cx="10" cy="10" r="1" fill="#00ff88"/>
                        <circle cx="30" cy="30" r="1" fill="#00ff88"/>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#circuit)"/>
                  </svg>
                </div>
                
                {/* Gaming Elements */}
                <div className="absolute top-4 right-4 text-green-400">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs font-mono">ONLINE</span>
                  </div>
                </div>
                
                {/* 3D Game Controller Icon */}
                <div className="absolute top-6 left-6">
                  <div className="relative transform rotate-12">
                    <div className="w-12 h-8 bg-gradient-to-br from-gray-300 to-gray-600 rounded-lg shadow-lg">
                      <div className="absolute top-1 left-2 w-2 h-2 bg-red-500 rounded-full"></div>
                      <div className="absolute top-1 right-2 w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="absolute bottom-1 left-3 w-6 h-2 bg-gray-800 rounded-full"></div>
                    </div>
                  </div>
                </div>
                
                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="text-green-400 font-mono text-lg font-bold mb-1">
                    {formatAmount(amount)}
                  </div>
                  <div className="text-white/80 text-sm truncate">
                    {merchantName}
                  </div>
                  <div className="text-purple-300 text-xs uppercase tracking-wider mt-1">
                    Gaming Gift Card
                  </div>
                </div>
                
                {/* Holographic effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 translate-x-full animate-shimmer"></div>
              </div>
            </div>
          </div>
        );

      case 'food':
        return (
          <div className={`relative w-full h-48 perspective-1000 ${className}`}>
            <div className="relative w-full h-full transform-style-preserve-3d hover:rotate-y-12 transition-all duration-500">
              {/* Food Card Design */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-600 via-red-500 to-amber-600 rounded-xl shadow-2xl border border-orange-300/30">
                {/* Food Pattern Background */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-4 left-4 text-6xl">🍕</div>
                  <div className="absolute top-8 right-8 text-4xl">🍔</div>
                  <div className="absolute bottom-8 left-8 text-3xl">🍜</div>
                  <div className="absolute bottom-4 right-4 text-5xl">🍰</div>
                </div>
                
                {/* Chef Hat 3D Icon */}
                <div className="absolute top-6 left-6">
                  <div className="relative">
                    <div className="w-10 h-12 bg-white rounded-t-full shadow-lg transform rotate-6">
                      <div className="absolute bottom-0 w-full h-3 bg-gray-100 rounded-b-lg"></div>
                      <div className="absolute top-2 left-2 w-2 h-2 bg-gray-200 rounded-full"></div>
                    </div>
                  </div>
                </div>
                
                {/* Steam Effect */}
                <div className="absolute top-4 right-6">
                  <div className="flex space-x-1">
                    <div className="w-1 h-4 bg-white/30 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                    <div className="w-1 h-3 bg-white/20 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    <div className="w-1 h-5 bg-white/40 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                  </div>
                </div>
                
                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="text-white font-bold text-lg mb-1 drop-shadow-lg">
                    {formatAmount(amount)}
                  </div>
                  <div className="text-orange-100 text-sm truncate">
                    {merchantName}
                  </div>
                  <div className="text-amber-200 text-xs uppercase tracking-wider mt-1">
                    Food & Dining Gift Card
                  </div>
                </div>
                
                {/* Glossy effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent rounded-xl"></div>
              </div>
            </div>
          </div>
        );

      case 'event gifts':
        return (
          <div className={`relative w-full h-48 perspective-1000 ${className}`}>
            <div className="relative w-full h-full transform-style-preserve-3d hover:rotate-y-12 transition-all duration-500">
              {/* Event Card Design */}
              <div className="absolute inset-0 bg-gradient-to-br from-pink-600 via-purple-600 to-indigo-700 rounded-xl shadow-2xl border border-pink-300/30">
                {/* Celebration Pattern */}
                <div className="absolute inset-0 overflow-hidden rounded-xl">
                  <div className="absolute top-2 left-4 text-yellow-300 animate-spin">✨</div>
                  <div className="absolute top-8 right-6 text-pink-300 animate-bounce">🎉</div>
                  <div className="absolute bottom-10 left-8 text-purple-300 animate-pulse">🎈</div>
                  <div className="absolute bottom-4 right-8 text-yellow-400 animate-spin">⭐</div>
                  <div className="absolute top-12 left-12 text-blue-300 animate-bounce">🎊</div>
                </div>
                
                {/* Gift Box 3D Icon */}
                <div className="absolute top-6 left-6">
                  <div className="relative transform rotate-12">
                    <div className="w-10 h-8 bg-gradient-to-br from-red-500 to-red-700 rounded shadow-lg">
                      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-yellow-400 to-yellow-600"></div>
                      <div className="absolute top-0 bottom-0 left-4 w-2 bg-gradient-to-b from-yellow-400 to-yellow-600"></div>
                      <div className="absolute -top-1 left-3 w-4 h-2 bg-yellow-300 rounded-t transform rotate-3"></div>
                    </div>
                  </div>
                </div>
                
                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="text-white font-bold text-lg mb-1 drop-shadow-lg">
                    {formatAmount(amount)}
                  </div>
                  <div className="text-pink-100 text-sm truncate">
                    {merchantName}
                  </div>
                  <div className="text-purple-200 text-xs uppercase tracking-wider mt-1">
                    Event & Celebration Gift
                  </div>
                </div>
                
                {/* Sparkle overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform skew-x-12 -translate-x-full animate-shimmer"></div>
              </div>
            </div>
          </div>
        );

      case 'productivity':
        return (
          <div className={`relative w-full h-48 perspective-1000 ${className}`}>
            <div className="relative w-full h-full transform-style-preserve-3d hover:rotate-y-12 transition-all duration-500">
              {/* Productivity Card Design */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-blue-900 to-indigo-900 rounded-xl shadow-2xl border border-blue-300/30">
                {/* Tech Grid Pattern */}
                <div className="absolute inset-0 opacity-20">
                  <svg className="w-full h-full" viewBox="0 0 400 200">
                    <defs>
                      <pattern id="grid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#3b82f6" strokeWidth="0.5"/>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)"/>
                  </svg>
                </div>
                
                {/* Laptop 3D Icon */}
                <div className="absolute top-6 left-6">
                  <div className="relative">
                    <div className="w-12 h-8 bg-gradient-to-br from-gray-300 to-gray-700 rounded shadow-lg transform -rotate-12">
                      <div className="absolute inset-1 bg-gradient-to-br from-blue-900 to-black rounded"></div>
                      <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-gray-400 to-gray-600 rounded-b"></div>
                    </div>
                  </div>
                </div>
                
                {/* Progress Bars */}
                <div className="absolute top-4 right-6 space-y-1">
                  <div className="w-16 h-1 bg-gray-700 rounded-full overflow-hidden">
                    <div className="w-3/4 h-full bg-green-400 rounded-full animate-pulse"></div>
                  </div>
                  <div className="w-12 h-1 bg-gray-700 rounded-full overflow-hidden">
                    <div className="w-1/2 h-full bg-blue-400 rounded-full animate-pulse"></div>
                  </div>
                  <div className="w-14 h-1 bg-gray-700 rounded-full overflow-hidden">
                    <div className="w-4/5 h-full bg-yellow-400 rounded-full animate-pulse"></div>
                  </div>
                </div>
                
                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="text-blue-300 font-bold text-lg mb-1 drop-shadow-lg">
                    {formatAmount(amount)}
                  </div>
                  <div className="text-slate-200 text-sm truncate">
                    {merchantName}
                  </div>
                  <div className="text-indigo-300 text-xs uppercase tracking-wider mt-1">
                    Productivity & Tech Gift
                  </div>
                </div>
                
                {/* Digital glow */}
                <div className="absolute inset-0 bg-gradient-to-t from-transparent via-blue-500/5 to-blue-400/10 rounded-xl"></div>
              </div>
            </div>
          </div>
        );

      case 'wellness':
        return (
          <div className={`relative w-full h-48 perspective-1000 ${className}`}>
            <div className="relative w-full h-full transform-style-preserve-3d hover:rotate-y-12 transition-all duration-500">
              {/* Wellness Card Design */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-600 via-teal-600 to-cyan-700 rounded-xl shadow-2xl border border-green-300/30">
                {/* Nature Pattern */}
                <div className="absolute inset-0 opacity-15">
                  <div className="absolute top-4 left-4 text-4xl">🌿</div>
                  <div className="absolute top-8 right-8 text-3xl">🧘‍♀️</div>
                  <div className="absolute bottom-8 left-8 text-3xl">💚</div>
                  <div className="absolute bottom-4 right-4 text-4xl">🌸</div>
                  <div className="absolute top-12 left-16 text-2xl">🕉️</div>
                </div>
                
                {/* Lotus 3D Icon */}
                <div className="absolute top-6 left-6">
                  <div className="relative">
                    <div className="w-10 h-10 relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-pink-300 to-pink-500 rounded-full transform rotate-12 opacity-80"></div>
                      <div className="absolute inset-1 bg-gradient-to-br from-white to-pink-200 rounded-full"></div>
                      <div className="absolute top-2 left-2 w-6 h-6 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full"></div>
                    </div>
                  </div>
                </div>
                
                {/* Zen Circles */}
                <div className="absolute top-6 right-6">
                  <div className="relative">
                    <div className="w-8 h-8 border-2 border-white/30 rounded-full animate-pulse"></div>
                    <div className="absolute top-2 left-2 w-4 h-4 border border-white/50 rounded-full animate-ping"></div>
                  </div>
                </div>
                
                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="text-white font-bold text-lg mb-1 drop-shadow-lg">
                    {formatAmount(amount)}
                  </div>
                  <div className="text-green-100 text-sm truncate">
                    {merchantName}
                  </div>
                  <div className="text-teal-200 text-xs uppercase tracking-wider mt-1">
                    Wellness & Self-Care Gift
                  </div>
                </div>
                
                {/* Peaceful glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-green-400/10 rounded-xl"></div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className={`relative w-full h-48 perspective-1000 ${className}`}>
            <div className="relative w-full h-full transform-style-preserve-3d hover:rotate-y-12 transition-all duration-500">
              {/* Default Modern Card Design */}
              <div className="absolute inset-0 bg-gradient-to-br from-gray-800 via-slate-700 to-gray-900 rounded-xl shadow-2xl border border-gray-500/30">
                {/* Geometric Pattern */}
                <div className="absolute inset-0 opacity-20">
                  <svg className="w-full h-full" viewBox="0 0 400 200">
                    <defs>
                      <pattern id="hexagon" x="0" y="0" width="30" height="26" patternUnits="userSpaceOnUse">
                        <polygon points="15,2 26,9 26,18 15,25 4,18 4,9" fill="none" stroke="#6b7280" strokeWidth="0.5"/>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#hexagon)"/>
                  </svg>
                </div>
                
                {/* Gift Icon */}
                <div className="absolute top-6 left-6">
                  <div className="w-10 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded shadow-lg">
                    <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-gold-400 to-yellow-500"></div>
                    <div className="absolute top-0 bottom-0 left-4 w-2 bg-gradient-to-b from-gold-400 to-yellow-500"></div>
                  </div>
                </div>
                
                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="text-white font-bold text-lg mb-1">
                    {formatAmount(amount)}
                  </div>
                  <div className="text-gray-300 text-sm truncate">
                    {merchantName}
                  </div>
                  <div className="text-gray-400 text-xs uppercase tracking-wider mt-1">
                    Gift Card
                  </div>
                </div>
                
                {/* Metallic shine */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 translate-x-full animate-shimmer"></div>
              </div>
            </div>
          </div>
        );
    }
  };

  return getDesignByCategory();
}