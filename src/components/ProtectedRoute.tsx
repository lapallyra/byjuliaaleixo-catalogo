import React from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { checkIsAdminDomain } from '../lib/utils';
import { LoadingScreen } from './LoadingScreen';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();

  React.useEffect(() => {
    console.log('[Guard] ProtectedRoute State:', { 
      path: location.pathname, 
      loading, 
      authenticated: !!user, 
      isAdmin,
      userEmail: user?.email 
    });
  }, [location.pathname, loading, user, isAdmin]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user || !isAdmin) {
    const isAdminDomain = checkIsAdminDomain();
    return <Navigate to={isAdminDomain ? "/login" : "/admin/login"} replace />;
  }

  return <>{children}</>;
};
