import { useEffect, useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface VerificationState {
  loading: boolean;
  success: boolean;
  error: string | null;
  alreadyVerified: boolean;
}

export default function MerchantVerify() {
  const [, params] = useRoute('/merchant-verify');
  const [, setLocation] = useLocation();
  const [state, setState] = useState<VerificationState>({
    loading: true,
    success: false,
    error: null,
    alreadyVerified: false
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (!token) {
      setState({
        loading: false,
        success: false,
        error: 'Verification token is missing from the URL',
        alreadyVerified: false
      });
      return;
    }

    // Verify the email
    fetch(`/api/merchant/verify-email?token=${token}`)
      .then(response => {
        if (response.redirected) {
          // Handle redirects
          const redirectUrl = new URL(response.url);
          const verified = redirectUrl.searchParams.get('verified');
          
          if (verified === 'success') {
            setState({
              loading: false,
              success: true,
              error: null,
              alreadyVerified: false
            });
          } else if (verified === 'already') {
            setState({
              loading: false,
              success: true,
              error: null,
              alreadyVerified: true
            });
          }
          return null;
        }
        
        return response.json();
      })
      .then(data => {
        if (data && !data.success) {
          setState({
            loading: false,
            success: false,
            error: data.error || 'Verification failed',
            alreadyVerified: false
          });
        }
      })
      .catch(error => {
        setState({
          loading: false,
          success: false,
          error: 'Network error during verification',
          alreadyVerified: false
        });
      });
  }, []);

  const handleContinue = () => {
    setLocation('/merchant-login');
  };

  if (state.loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Verifying Email</h2>
              <p className="text-gray-600 text-center">
                Please wait while we verify your email address...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (state.success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <CardTitle className="text-center text-green-900">
              {state.alreadyVerified ? 'Already Verified!' : 'Email Verified!'}
            </CardTitle>
            <CardDescription className="text-center">
              {state.alreadyVerified 
                ? 'Your email address was already verified. You can now access your merchant dashboard.'
                : 'Your email address has been successfully verified. You can now access all merchant features.'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2">What's next?</h3>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Access your merchant dashboard</li>
                  <li>• Create and manage gift cards</li>
                  <li>• View analytics and reports</li>
                  <li>• Process customer transactions</li>
                </ul>
              </div>
              <Button 
                onClick={handleContinue}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Continue to Login
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-rose-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <XCircle className="h-12 w-12 text-red-600" />
          </div>
          <CardTitle className="text-center text-red-900">
            Verification Failed
          </CardTitle>
          <CardDescription className="text-center">
            {state.error}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-900 mb-2">What can you do?</h3>
              <ul className="text-sm text-red-800 space-y-1">
                <li>• Check if the verification link has expired</li>
                <li>• Request a new verification email</li>
                <li>• Contact support if the problem persists</li>
              </ul>
            </div>
            <div className="space-y-2">
              <Button 
                onClick={handleContinue}
                className="w-full"
                variant="outline"
              >
                Go to Login Page
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}