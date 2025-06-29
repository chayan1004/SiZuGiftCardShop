import { useState } from "react";
import { motion } from "framer-motion";
import { Gift, Shield, ArrowRight, Eye, EyeOff, Lock, User, Building2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useLocation, Link } from "wouter";

interface ValidationErrors {
  [key: string]: string;
}

export default function MerchantRegister() {
  const [formData, setFormData] = useState({
    businessName: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const validatePassword = (password: string) => {
    const errors: string[] = [];
    if (password.length < 8) errors.push("at least 8 characters");
    if (!/[A-Z]/.test(password)) errors.push("one uppercase letter");
    if (!/[a-z]/.test(password)) errors.push("one lowercase letter");
    if (!/\d/.test(password)) errors.push("one number");
    return errors;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: "" }));
    }

    // Real-time password validation
    if (field === "password") {
      const errors = validatePassword(value);
      if (errors.length > 0) {
        setValidationErrors(prev => ({ 
          ...prev, 
          password: `Password must contain ${errors.join(", ")}` 
        }));
      }
    }

    // Real-time confirm password validation
    if (field === "confirmPassword" || (field === "password" && formData.confirmPassword)) {
      const passwordToCheck = field === "password" ? value : formData.password;
      const confirmPasswordToCheck = field === "confirmPassword" ? value : formData.confirmPassword;
      
      if (confirmPasswordToCheck && passwordToCheck !== confirmPasswordToCheck) {
        setValidationErrors(prev => ({ 
          ...prev, 
          confirmPassword: "Passwords don't match" 
        }));
      } else {
        setValidationErrors(prev => ({ ...prev, confirmPassword: "" }));
      }
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setValidationErrors({});

    try {
      const response = await fetch('/api/merchant/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        // Store token and merchant data for immediate access
        localStorage.setItem('merchantToken', data.token);
        localStorage.setItem('merchantData', JSON.stringify(data.merchant));
        
        toast({
          title: "Registration Successful!",
          description: `Welcome to SiZu GiftCard, ${data.merchant.businessName}!`,
        });
        
        // Redirect to merchant dashboard
        setLocation("/merchant-dashboard");
      } else {
        if (data.details) {
          // Handle validation errors
          const errors: ValidationErrors = {};
          data.details.forEach((detail: any) => {
            errors[detail.field] = detail.message;
          });
          setValidationErrors(errors);
        } else {
          toast({
            title: "Registration Failed",
            description: data.error || "Please check your information and try again",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Registration Failed",
        description: "Network error. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = validatePassword(formData.password);
  const isPasswordValid = passwordStrength.length === 0 && formData.password.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 flex items-center justify-center px-4 py-8">
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
        className="w-full max-w-lg relative z-10"
      >
        <Card className="bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl">
          <CardHeader className="text-center pb-8">
            <motion.div 
              className="mx-auto w-20 h-20 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mb-6 shadow-2xl"
              whileHover={{ scale: 1.05, rotateY: 15 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Building2 className="text-white" size={32} />
            </motion.div>
            
            <CardTitle className="text-3xl font-bold text-white mb-2">
              Create Merchant Account
            </CardTitle>
            <p className="text-gray-300">
              Join SiZu GiftCard and start selling digital gift cards today
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 flex items-center">
                  <Building2 size={16} className="mr-2" />
                  Business Name
                </label>
                <Input
                  type="text"
                  placeholder="Enter your business name"
                  value={formData.businessName}
                  onChange={(e) => handleInputChange('businessName', e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-cyan-400"
                  required
                />
                {validationErrors.businessName && (
                  <p className="text-red-400 text-sm">{validationErrors.businessName}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 flex items-center">
                  <User size={16} className="mr-2" />
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-cyan-400"
                  required
                />
                {validationErrors.email && (
                  <p className="text-red-400 text-sm">{validationErrors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 flex items-center">
                  <Lock size={16} className="mr-2" />
                  Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-cyan-400 pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                
                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-xs">
                      {isPasswordValid ? (
                        <CheckCircle size={14} className="text-green-400" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-gray-400" />
                      )}
                      <span className={isPasswordValid ? "text-green-400" : "text-gray-400"}>
                        Strong password
                      </span>
                    </div>
                    {passwordStrength.length > 0 && (
                      <p className="text-orange-400 text-xs">
                        Need: {passwordStrength.join(", ")}
                      </p>
                    )}
                  </div>
                )}
                
                {validationErrors.password && (
                  <p className="text-red-400 text-sm">{validationErrors.password}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 flex items-center">
                  <Lock size={16} className="mr-2" />
                  Confirm Password
                </label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-cyan-400 pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {validationErrors.confirmPassword && (
                  <p className="text-red-400 text-sm">{validationErrors.confirmPassword}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading || !isPasswordValid || formData.password !== formData.confirmPassword}
                className="w-full bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-600 hover:via-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-cyan-500/25"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Account...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <span>Create Account</span>
                    <ArrowRight size={16} className="ml-2" />
                  </div>
                )}
              </Button>
            </form>

            <div className="text-center">
              <p className="text-sm text-gray-400">
                Already have an account?{" "}
                <Link href="/merchant-login" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                  Sign in here
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
            Secure registration • Instant access • Square integration available
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}