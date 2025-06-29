import { useState } from "react";
import { motion } from "framer-motion";
import { Gift, Shield, ArrowRight, Eye, EyeOff, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useLocation, Link } from "wouter";
import { loginAsMerchant } from "@/components/ProtectedRoute";

export default function MerchantLogin() {
  const [merchantId, setMerchantId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

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
        // Store token in localStorage for client-side auth checks
        localStorage.setItem('merchantToken', data.token);
        localStorage.setItem('merchantData', JSON.stringify(data.merchant));
        
        toast({
          title: "Login Successful",
          description: `Welcome back, ${data.merchant.businessName}!`,
        });
        
        // Redirect to home page where they can access the dashboard
        setLocation("/");
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

  const handleDemoLogin = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/merchant/demo-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('merchantToken', data.token);
        localStorage.setItem('merchantData', JSON.stringify(data.merchant));
        
        toast({
          title: "Demo Login Successful",
          description: `Welcome to ${data.merchant.businessName}!`,
        });
        
        // Trigger a page reload to update authentication state and redirect to home
        window.location.href = "/";
      } else {
        toast({
          title: "Demo Login Failed",
          description: data.error || "Please try again",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Demo login error:', error);
      toast({
        title: "Demo Login Failed",
        description: "Network error. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 flex items-center justify-center px-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/5 via-purple-500/3 to-indigo-500/5" />
        <div className="absolute top-20 right-20 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl">
          <CardHeader className="text-center pb-8">
            <motion.div 
              className="mx-auto w-20 h-20 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mb-6 shadow-2xl"
              whileHover={{ scale: 1.05, rotateY: 15 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Shield className="text-white" size={32} />
            </motion.div>
            
            <CardTitle className="text-3xl font-bold text-white mb-2">
              Merchant Login
            </CardTitle>
            <p className="text-gray-300">
              Access your SiZu GiftCard merchant dashboard
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 flex items-center">
                  <User size={16} className="mr-2" />
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  value={merchantId}
                  onChange={(e) => setMerchantId(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-cyan-400"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 flex items-center">
                  <Lock size={16} className="mr-2" />
                  Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-cyan-400 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-600 hover:via-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-cyan-500/25"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing In...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <span>Sign In</span>
                    <ArrowRight size={16} className="ml-2" />
                  </div>
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-transparent px-2 text-gray-400">or</span>
              </div>
            </div>

            <Button
              onClick={handleDemoLogin}
              variant="outline"
              className="w-full border-white/30 bg-white/5 text-white hover:bg-white/15 hover:border-white/40 transition-all duration-300 backdrop-blur-sm"
            >
              <Gift size={16} className="mr-2" />
              Try Demo Account
            </Button>

            <div className="text-center">
              <p className="text-sm text-gray-400">
                Don't have an account?{" "}
                <Link href="/merchant-register" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                  Sign up here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-8"
        >
          <p className="text-gray-400 text-sm">
            Powered by Square • Enterprise Security • 24/7 Support
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}