import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  logout: () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);

  // Admin list - for now hardcoded as requested by the rules/blueprint logic
  const ADMIN_EMAILS = ['juualleixo@gmail.com', 'lapallyra@gmail.com'];

  useEffect(() => {
    console.log('[Auth] Initializing onAuthStateChanged');
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log('[Auth] Auth state changed:', firebaseUser ? `${firebaseUser.email} (UID: ${firebaseUser.uid})` : 'No user');
      setUser(firebaseUser);
      setLoading(false);
      setAuthInitialized(true);
    });

    return () => unsubscribe();
  }, []);

  const isAdmin = useMemo(() => {
    const userEmail = user?.email?.toLowerCase();
    const isPrimaryAdmin = !!userEmail && ADMIN_EMAILS.some(email => email.toLowerCase() === userEmail);
    console.log('[Auth] Calculating isAdmin:', { 
      email: user?.email, 
      isPrimaryAdmin,
      isInitialized: authInitialized,
      loading
    });
    return isPrimaryAdmin;
  }, [user, authInitialized, loading]);

  const logout = async () => {
    console.log('[Auth] Initiating logout');
    try {
      await auth.signOut();
      window.location.href = '/'; 
    } catch (error) {
      console.error('[Auth] Logout error:', error);
    }
  };

  const contextValue = useMemo(() => ({
    user,
    loading: !authInitialized || loading,
    isAdmin,
    logout
  }), [user, loading, isAdmin, authInitialized]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
