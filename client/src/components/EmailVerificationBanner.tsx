import { useState } from "react";
import { Mail, X, RefreshCw, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";

interface EmailVerificationBannerProps {
  merchantEmail: string;
  onVerificationComplete?: () => void;
}

export default function EmailVerificationBanner({ merchantEmail, onVerificationComplete }: EmailVerificationBannerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const { toast } = useToast();

  // Check verification status
  const { data: verificationStatus, refetch: refetchStatus } = useQuery({
    queryKey: ['/api/merchant/verification-status'],
    queryFn: async () => {
      const response = await fetch('/api/merchant/verification-status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('merchantToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Resend verification email mutation
  const resendEmailMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/merchant/resend-verification', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('merchantToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Verification Email Sent",
        description: "Please check your email inbox and spam folder for the verification link.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Send Email",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    }
  });

  // Hide banner if email is verified
  if (verificationStatus?.emailVerified) {
    if (onVerificationComplete) {
      onVerificationComplete();
    }
    return null;
  }

  // Hide banner if user dismissed it
  if (!isVisible) {
    return null;
  }

  const handleResendEmail = () => {
    resendEmailMutation.mutate();
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  return (
    <Alert className="mb-6 border-amber-200 bg-amber-50">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertDescription className="flex items-center justify-between w-full">
        <div className="flex-1 pr-4">
          <div className="flex items-center gap-2 mb-2">
            <Mail className="h-4 w-4 text-amber-600" />
            <span className="font-semibold text-amber-800">Email Verification Required</span>
          </div>
          <p className="text-amber-700 text-sm mb-3">
            Please verify your email address <span className="font-medium">{merchantEmail}</span> to access all merchant features and start creating gift cards.
          </p>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleResendEmail}
              disabled={resendEmailMutation.isPending}
              size="sm"
              variant="outline"
              className="border-amber-300 text-amber-700 hover:bg-amber-100"
            >
              {resendEmailMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-3 w-3" />
                  Resend Email
                </>
              )}
            </Button>
            <span className="text-xs text-amber-600">
              Check your spam folder if you don't see the email
            </span>
          </div>
        </div>
        <Button
          onClick={handleDismiss}
          variant="ghost"
          size="sm"
          className="text-amber-600 hover:text-amber-700 hover:bg-amber-100 p-1"
        >
          <X className="h-4 w-4" />
        </Button>
      </AlertDescription>
    </Alert>
  );
}