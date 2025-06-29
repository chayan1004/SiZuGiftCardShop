import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole: 'admin' | 'merchant';
  redirectTo?: string;
}

interface AuthContext {
  isAuthenticated: boolean;
  role: 'admin' | 'merchant' | 'public';
  merchantId?: string;
  token?: string;
}

export function ProtectedRoute({ children, requiredRole, redirectTo = '/' }: ProtectedRouteProps) {
  const [, setLocation] = useLocation();
  const [authState, setAuthState] = useState<AuthContext>({
    isAuthenticated: false,
    role: 'public'
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const checkAuthentication = () => {
      // Check for admin token
      const adminToken = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
      if (adminToken === 'sizu-admin-2025') {
        setAuthState({
          isAuthenticated: true,
          role: 'admin',
          token: adminToken
        });
        setIsLoading(false);
        return;
      }

      // Check for merchant token (JWT or legacy format)
      const merchantToken = localStorage.getItem('merchantToken') || 
                           sessionStorage.getItem('merchantToken') ||
                           document.cookie.split(';').find(c => c.trim().startsWith('merchantToken='))?.split('=')[1];
      
      const merchantData = localStorage.getItem('merchantData');
      
      if (merchantToken) {
        // Handle JWT tokens (new format)
        if (merchantToken.startsWith('eyJ')) {
          try {
            // Decode JWT payload (simple base64 decode for client-side check)
            const payload = JSON.parse(atob(merchantToken.split('.')[1]));
            if (payload.role === 'merchant' && payload.merchantId) {
              setAuthState({
                isAuthenticated: true,
                role: 'merchant',
                merchantId: payload.merchantId,
                token: merchantToken
              });
              setIsLoading(false);
              return;
            }
          } catch (error) {
            console.error('Failed to decode JWT token:', error);
          }
        }
        
        // Try to get merchant data from localStorage (fallback)
        if (merchantData) {
          try {
            const merchant = JSON.parse(merchantData);
            setAuthState({
              isAuthenticated: true,
              role: 'merchant',
              merchantId: merchant.merchantId,
              token: merchantToken
            });
            setIsLoading(false);
            return;
          } catch (error) {
            console.error('Failed to parse merchant data:', error);
          }
        }
        
        // Fallback for legacy token format
        if (merchantToken.startsWith('merchant-')) {
          const merchantId = merchantToken.replace('merchant-', '');
          setAuthState({
            isAuthenticated: true,
            role: 'merchant',
            merchantId,
            token: merchantToken
          });
          setIsLoading(false);
          return;
        }
      }

      // No valid authentication found
      setAuthState({
        isAuthenticated: false,
        role: 'public'
      });
      setIsLoading(false);
    };

    checkAuthentication();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    // Check if user is not authenticated
    if (!authState.isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: `Please log in as ${requiredRole} to access this page`,
        variant: "destructive"
      });
      setLocation(redirectTo);
      return;
    }

    // Check if user has wrong role
    if (authState.role !== requiredRole) {
      toast({
        title: "Access Denied",
        description: `This page requires ${requiredRole} access. You are logged in as ${authState.role}`,
        variant: "destructive"
      });
      setLocation(redirectTo);
      return;
    }
  }, [authState, isLoading, requiredRole, redirectTo, setLocation, toast]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-white">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Only render children if properly authenticated with correct role
  if (authState.isAuthenticated && authState.role === requiredRole) {
    return <>{children}</>;
  }

  // This should not render due to redirects above, but safety fallback
  return null;
}

// Hook to access auth context in components
export function useAuth(): AuthContext {
  const [authState, setAuthState] = useState<AuthContext>({
    isAuthenticated: false,
    role: 'public'
  });

  useEffect(() => {
    // Check for admin token
    const adminToken = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
    if (adminToken === 'sizu-admin-2025') {
      setAuthState({
        isAuthenticated: true,
        role: 'admin',
        token: adminToken
      });
      return;
    }

    // Check for merchant token
    const merchantToken = localStorage.getItem('merchantToken') || 
                         sessionStorage.getItem('merchantToken') ||
                         document.cookie.split(';').find(c => c.trim().startsWith('merchantToken='))?.split('=')[1];
    
    if (merchantToken) {
      // Handle JWT tokens (new format)
      if (merchantToken.startsWith('eyJ')) {
        try {
          const payload = JSON.parse(atob(merchantToken.split('.')[1]));
          if (payload.role === 'merchant' && payload.merchantId) {
            setAuthState({
              isAuthenticated: true,
              role: 'merchant',
              merchantId: payload.merchantId,
              token: merchantToken
            });
            return;
          }
        } catch (error) {
          console.error('Failed to decode JWT token:', error);
        }
      }
      
      // Fallback for legacy token format
      if (merchantToken.startsWith('merchant-')) {
        const merchantId = merchantToken.replace('merchant-', '');
        setAuthState({
          isAuthenticated: true,
          role: 'merchant',
          merchantId,
          token: merchantToken
        });
        return;
      }
    }

    // No authentication
    setAuthState({
      isAuthenticated: false,
      role: 'public'
    });
  }, []);

  return authState;
}

// Login functions for testing
export const loginAsAdmin = (token: string = 'sizu-admin-2025') => {
  localStorage.setItem('adminToken', token);
  window.location.reload();
};

export const loginAsMerchant = (merchantId: string) => {
  const token = `merchant-${merchantId}`;
  localStorage.setItem('merchantToken', token);
  window.location.reload();
};

export const logout = async () => {
  try {
    // Call backend logout to clear cookies
    await fetch('/api/merchant/logout', {
      method: 'POST',
      credentials: 'include'
    });
  } catch (error) {
    console.error('Logout API error:', error);
  }
  
  // Clear local storage
  localStorage.removeItem('adminToken');
  localStorage.removeItem('merchantToken');
  localStorage.removeItem('merchantData');
  sessionStorage.removeItem('adminToken');
  sessionStorage.removeItem('merchantToken');
  sessionStorage.removeItem('merchantData');
  
  // Clear cookies manually as fallback
  document.cookie = 'merchantToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  
  window.location.href = '/';
};