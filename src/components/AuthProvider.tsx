import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { User, onAuthStateChanged, getRedirectResult } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { UserRole } from '../types';
import { saveCustomer } from '../services/firebaseService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  role: UserRole | null;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  role: null,
  logout: () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [role, setRole] = useState<UserRole | null>(null);

  // Fallback admin emails if not found in db
  const ADMIN_EMAILS = ['juualleixo@gmail.com', 'lapallyra@gmail.com', 'byjuliaaleixo@gmail.com'];

  useEffect(() => {
    // Check for redirect login result
    getRedirectResult(auth).then(async (result) => {
      if (result?.user) {
        console.log('[Auth] Successfully logged in via redirect:', result.user.email);
        try {
          await saveCustomer({
            name: result.user.displayName || 'Cliente Ateliê',
            email: result.user.email || '',
            phone: result.user.phoneNumber || '',
            contacts: [{ id: '1', phone: result.user.phoneNumber || '', email: result.user.email || '', type: 'Principal', isMain: true }]
          }, { bypassCpfCheck: true });
        } catch (e) {
          console.warn('[Auth] Redirect customer sync warning:', e);
        }
      }
    }).catch((err) => {
      console.warn('[Auth] Redirect result check warning:', err);
    });

    console.log('[Auth] Initializing onAuthStateChanged');
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('[Auth] Auth state changed:', firebaseUser ? `${firebaseUser.email} (UID: ${firebaseUser.uid})` : 'No user');
      
      setUser(firebaseUser);
      
      if (firebaseUser?.email) {
        try {
          const q = query(collection(db, 'admin_users'), where('email', '==', firebaseUser.email.toLowerCase()));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data();
            if (userData.active) {
              setRole(userData.role as UserRole);
            } else {
              setRole(null); // Inactive
            }
          } else if (ADMIN_EMAILS.includes(firebaseUser.email.toLowerCase())) {
            setRole('ADMINISTRADOR');
          } else {
            setRole(null);
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          if (ADMIN_EMAILS.includes(firebaseUser.email.toLowerCase())) {
            setRole('ADMINISTRADOR');
          }
        }
      } else {
        setRole(null);
      }
      
      setLoading(false);
      setAuthInitialized(true);
    });

    return () => unsubscribe();
  }, []);

  const isAdmin = useMemo(() => {
    return role === 'ADMINISTRADOR';
  }, [role]);

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
    role,
    logout
  }), [user, loading, isAdmin, role, authInitialized]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
