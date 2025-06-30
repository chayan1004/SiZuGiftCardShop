import { useState, useEffect } from 'react';

interface MerchantDesign {
  hasCustomDesign: boolean;
  backgroundImageUrl: string | null;
  logoUrl: string | null;
  themeColor: string;
  customMessage: string;
}

interface DesignPreviewProps {
  merchantDesign: MerchantDesign | null;
  amount: number;
  isLoading?: boolean;
}

export default function DesignPreview({ merchantDesign, amount, isLoading }: DesignPreviewProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(false);
  
  useEffect(() => {
    setImageLoaded(false);
    setLogoLoaded(false);
  }, [merchantDesign]);

  if (isLoading || !merchantDesign) {
    return (
      <div className="w-full aspect-[1.6/1] bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl shadow-lg animate-pulse">
        <div className="p-6 h-full flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 bg-white/20 rounded-lg animate-pulse"></div>
            <div className="w-24 h-6 bg-white/20 rounded animate-pulse"></div>
          </div>
          <div className="space-y-2">
            <div className="w-32 h-4 bg-white/20 rounded animate-pulse"></div>
            <div className="w-20 h-6 bg-white/20 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  const formatAmount = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100);
  };

  const cardStyle = {
    backgroundColor: merchantDesign.themeColor,
    backgroundImage: merchantDesign.backgroundImageUrl 
      ? `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url(${merchantDesign.backgroundImageUrl})`
      : `linear-gradient(135deg, ${merchantDesign.themeColor}, ${merchantDesign.themeColor}dd)`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };

  return (
    <div className="w-full">
      {/* Mobile: Stacked Layout */}
      <div className="lg:hidden space-y-4">
        <div 
          className="w-full aspect-[1.6/1] rounded-xl shadow-lg transition-all duration-500 ease-in-out transform hover:scale-105"
          style={cardStyle}
        >
          <div className="p-4 sm:p-6 h-full flex flex-col justify-between text-white">
            {/* Header with Logo */}
            <div className="flex justify-between items-start">
              {merchantDesign.logoUrl ? (
                <div className="relative">
                  <img
                    src={merchantDesign.logoUrl}
                    alt="Merchant Logo"
                    className={`w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-lg transition-opacity duration-300 ${
                      logoLoaded ? 'opacity-100' : 'opacity-0'
                    }`}
                    onLoad={() => setLogoLoaded(true)}
                    onError={() => setLogoLoaded(true)}
                  />
                  {!logoLoaded && (
                    <div className="absolute inset-0 w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-lg animate-pulse"></div>
                  )}
                </div>
              ) : (
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <span className="text-xs sm:text-sm font-bold">GIFT</span>
                </div>
              )}
              <div className="text-right">
                <div className="text-xs sm:text-sm opacity-80">Gift Card</div>
                <div className="text-lg sm:text-xl font-bold">{formatAmount(amount)}</div>
              </div>
            </div>

            {/* Footer with Message */}
            <div className="space-y-1">
              <div className="text-xs sm:text-sm opacity-90">
                {merchantDesign.customMessage || 'Thank you for choosing our gift card!'}
              </div>
              <div className="text-xs opacity-70">
                Valid until used • No expiration
              </div>
            </div>
          </div>
        </div>

        {/* Card Features */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
            <div className="font-semibold text-green-600">✓ No Fees</div>
            <div className="text-gray-600 dark:text-gray-400 text-xs">Free to use</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
            <div className="font-semibold text-blue-600">✓ Never Expires</div>
            <div className="text-gray-600 dark:text-gray-400 text-xs">Use anytime</div>
          </div>
        </div>
      </div>

      {/* Desktop: Side Layout */}
      <div className="hidden lg:block">
        <div 
          className="w-full aspect-[1.6/1] rounded-xl shadow-lg transition-all duration-500 ease-in-out transform hover:scale-105"
          style={cardStyle}
        >
          <div className="p-8 h-full flex flex-col justify-between text-white">
            {/* Header with Logo */}
            <div className="flex justify-between items-start">
              {merchantDesign.logoUrl ? (
                <div className="relative">
                  <img
                    src={merchantDesign.logoUrl}
                    alt="Merchant Logo"
                    className={`w-16 h-16 object-cover rounded-lg transition-opacity duration-300 ${
                      logoLoaded ? 'opacity-100' : 'opacity-0'
                    }`}
                    onLoad={() => setLogoLoaded(true)}
                    onError={() => setLogoLoaded(true)}
                  />
                  {!logoLoaded && (
                    <div className="absolute inset-0 w-16 h-16 bg-white/20 rounded-lg animate-pulse"></div>
                  )}
                </div>
              ) : (
                <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center">
                  <span className="text-sm font-bold">GIFT</span>
                </div>
              )}
              <div className="text-right">
                <div className="text-sm opacity-80">Gift Card</div>
                <div className="text-2xl font-bold">{formatAmount(amount)}</div>
              </div>
            </div>

            {/* Footer with Message */}
            <div className="space-y-2">
              <div className="text-sm opacity-90 max-w-md">
                {merchantDesign.customMessage || 'Thank you for choosing our gift card!'}
              </div>
              <div className="text-xs opacity-70">
                Valid until used • No expiration • Digital delivery
              </div>
            </div>
          </div>
        </div>

        {/* Card Features - Desktop */}
        <div className="mt-6 grid grid-cols-3 gap-4 text-sm">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
            <div className="font-semibold text-green-600 mb-1">✓ No Fees</div>
            <div className="text-gray-600 dark:text-gray-400 text-xs">No hidden charges</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
            <div className="font-semibold text-blue-600 mb-1">✓ Never Expires</div>
            <div className="text-gray-600 dark:text-gray-400 text-xs">Use anytime</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
            <div className="font-semibold text-purple-600 mb-1">✓ Instant Delivery</div>
            <div className="text-gray-600 dark:text-gray-400 text-xs">Email + PDF receipt</div>
          </div>
        </div>
      </div>
    </div>
  );
}