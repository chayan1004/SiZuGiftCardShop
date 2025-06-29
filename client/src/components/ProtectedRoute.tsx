import { ReactNode, useEffect } from 'react';
import { useLocation } from 'wouter';

interface ProtectedRouteProps {
  children: ReactNode;
  role: 'admin' | 'merchant';
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
      if (!token) {
        setLocation('/merchant-login');
        return;
      }
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
    if (!token) {
      return null;
    }
  }

  return <>{children}</>;
}