import { ReactNode, useEffect } from 'react';
import { useLocation } from 'wouter';

interface ProtectedRouteProps {
  children: ReactNode;
  role: 'admin' | 'merchant';
}

// Validate JWT token structure and expiration
function validateJWTToken(token: string): boolean {
  try {
    if (!token || !token.startsWith('eyJ')) {
      return false;
    }
    
    const payload = JSON.parse(atob(token.split('.')[1]));
    console.log('🔍 Validating merchant token:', {
      role: payload.role,
      email: payload.email,
      merchantId: payload.merchantId,
      exp: new Date(payload.exp * 1000).toISOString(),
      isValid: payload.exp > Date.now() / 1000
    });
    
    return payload.role === 'merchant' && payload.exp > Date.now() / 1000;
  } catch (error) {
    console.error('❌ Token validation failed:', error);
    return false;
  }
}

export default function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (role === 'admin') {
      const token = localStorage.getItem('adminToken');
      if (token !== 'sizu-admin-2025') {
        setLocation('/admin-login');
        return;
      }
    }
    
    if (role === 'merchant') {
      const token = localStorage.getItem('merchantToken');
      if (!token || !validateJWTToken(token)) {
        console.log('❌ Invalid or missing merchant token, redirecting to login');
        localStorage.removeItem('merchantToken');
        localStorage.removeItem('merchantData');
        setLocation('/merchant-login');
        return;
      }
      console.log('✅ Valid merchant token confirmed');
    }
  }, [role, setLocation]);

  // Check authentication before rendering
  if (role === 'admin') {
    const token = localStorage.getItem('adminToken');
    if (token !== 'sizu-admin-2025') {
      return null;
    }
  }
  
  if (role === 'merchant') {
    const token = localStorage.getItem('merchantToken');
    if (!token || !validateJWTToken(token)) {
      return null;
    }
  }

  return <>{children}</>;
}