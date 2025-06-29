import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Gift, Shield, ArrowRight, Eye, EyeOff, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useLocation, Link } from "wouter";


export default function MerchantLogin() {
  const [merchantId, setMerchantId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Check if already logged in and redirect to dashboard
  useEffect(() => {
    const token = localStorage.getItem('merchantToken');
    if (token && token.startsWith('eyJ')) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('🔍 Existing token found:', {
          role: payload.role,
          email: payload.email,
          merchantId: payload.merchantId,
          exp: new Date(payload.exp * 1000).toISOString(),
          isValid: payload.exp > Date.now() / 1000
        });
        
        if (payload.role === 'merchant' && payload.exp > Date.now() / 1000) {
          console.log('✅ Valid merchant token found, redirecting to dashboard');
          setLocation("/merchant-dashboard");
          return;
        } else {
          console.log('❌ Token expired or invalid, clearing storage');
          localStorage.removeItem('merchantToken');
          localStorage.removeItem('merchantData');
        }
      } catch (error) {
        console.error('❌ Token validation failed:', error);
        localStorage.removeItem('merchantToken');
        localStorage.removeItem('merchantData');
      }
    }
  }, [setLocation]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/merchant/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: merchantId, // Using merchantId input as email
          password: password
        })
      });

      const data = await response.json();

      if (data.success) {
        console.log('🔐 Login successful, received token:', {
          tokenLength: data.token?.length,
          merchantId: data.merchant?.merchantId,
          businessName: data.merchant?.businessName,
          email: data.merchant?.email
        });

        // Validate JWT token structure
        try {
          const payload = JSON.parse(atob(data.token.split('.')[1]));
          console.log('✅ JWT payload decoded:', {
            role: payload.role,
            merchantId: payload.merchantId,
            email: payload.email,
            businessName: payload.businessName,
            exp: new Date(payload.exp * 1000).toISOString()
          });

          // Store token in localStorage for client-side auth checks
          localStorage.setItem('merchantToken', data.token);
          localStorage.setItem('merchantData', JSON.stringify(data.merchant));
          
          toast({
            title: "Login Successful",
            description: `Welcome back, ${data.merchant.businessName}!`,
          });
          
          // Role-based redirect
          if (payload.role === 'merchant') {
            console.log('🔄 Redirecting to merchant dashboard');
            setLocation("/merchant-dashboard");
          } else {
            console.log('❌ Invalid role in token:', payload.role);
            throw new Error('Invalid user role');
          }
        } catch (tokenError) {
          console.error('❌ Token validation failed:', tokenError);
          toast({
            title: "Login Error",
            description: "Invalid token received. Please try again.",
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Login Failed",
          description: data.error || "Please check your credentials and try again",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: "Network error. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Demo login removed for security - merchants must use proper authentication

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Responsive Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/5 via-purple-500/3 to-indigo-500/5" />
        <div className="absolute top-10 right-10 sm:top-20 sm:right-20 w-48 h-48 sm:w-96 sm:h-96 bg-cyan-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 left-10 sm:bottom-20 sm:left-20 w-48 h-48 sm:w-96 sm:h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-sm sm:max-w-md lg:max-w-lg relative z-10"
      >
        <Card className="bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl rounded-2xl sm:rounded-3xl">
          <CardHeader className="text-center pb-6 sm:pb-8 px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
            <motion.div 
              className="mx-auto w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-2xl sm:rounded-3xl flex items-center justify-center mb-4 sm:mb-6 shadow-2xl"
              whileHover={{ scale: 1.05, rotateY: 15 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Shield className="text-white w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8" />
            </motion.div>
            
            <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
              Merchant Login
            </CardTitle>
            <p className="text-sm sm:text-base text-gray-300 px-2">
              Access your SiZu GiftCard merchant dashboard
            </p>
          </CardHeader>

          <CardContent className="px-4 sm:px-6 lg:px-8 pb-6 sm:pb-8">
            <form onSubmit={handleLogin} className="space-y-4 sm:space-y-6">
              <div className="space-y-2 sm:space-y-3">
                <label className="text-sm sm:text-base font-medium text-gray-300 flex items-center">
                  <User size={16} className="mr-2 flex-shrink-0" />
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  value={merchantId}
                  onChange={(e) => setMerchantId(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-cyan-400 h-12 sm:h-14 text-base sm:text-lg rounded-xl"
                  required
                />
              </div>

              <div className="space-y-2 sm:space-y-3">
                <label className="text-sm sm:text-base font-medium text-gray-300 flex items-center">
                  <Lock size={16} className="mr-2 flex-shrink-0" />
                  Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-cyan-400 h-12 sm:h-14 text-base sm:text-lg rounded-xl pr-12 sm:pr-14"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors p-1 touch-manipulation"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-600 hover:via-blue-700 hover:to-purple-700 text-white font-semibold py-3 sm:py-4 lg:py-5 text-base sm:text-lg rounded-xl transition-all duration-300 shadow-lg hover:shadow-cyan-500/25 touch-manipulation"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-white mr-2"></div>
                    <span className="text-base sm:text-lg">Signing In...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <span className="text-base sm:text-lg">Sign In</span>
                    <ArrowRight size={18} className="ml-2" />
                  </div>
                )}
              </Button>
            </form>

            <div className="relative my-6 sm:my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-sm sm:text-base">
                <span className="bg-transparent px-4 text-gray-400">or</span>
              </div>
            </div>

            <div className="text-center space-y-3 sm:space-y-4">
              <p className="text-sm sm:text-base text-gray-400">
                Don't have an account?{" "}
                <Link href="/merchant-register" className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium underline decoration-cyan-400/30 hover:decoration-cyan-300">
                  Sign up here
                </Link>
              </p>
              
              <p className="text-xs sm:text-sm text-gray-500">
                Forgot your password?{" "}
                <Link href="/merchant-reset-password" className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium underline decoration-cyan-400/30 hover:decoration-cyan-300">
                  Reset it here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Mobile Back to Home Link */}
        <div className="mt-6 sm:mt-8 text-center">
          <Link href="/" className="inline-flex items-center text-sm sm:text-base text-gray-400 hover:text-white transition-colors touch-manipulation">
            <ArrowRight size={16} className="mr-2 rotate-180" />
            Back to Home
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-6 sm:mt-8 px-4"
        >
          <p className="text-gray-400 text-xs sm:text-sm lg:text-base">
            Powered by Square • Enterprise Security • 24/7 Support
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}