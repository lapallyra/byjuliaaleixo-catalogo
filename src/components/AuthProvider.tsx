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

export const MASTER_USER: User = {
  uid: 'master-byjuliaaleixo-uid',
  email: 'byjuliaaleixo@gmail.com',
  displayName: 'Júlia Aleixo',
  emailVerified: true,
  isAnonymous: false,
  metadata: {} as any,
  providerData: [],
  refreshToken: '',
  tenantId: null,
  delete: async () => {},
  getIdToken: async () => 'mock-token',
  getIdTokenResult: async () => ({} as any),
  reload: async () => {},
  toJSON: () => ({}),
  phoneNumber: null,
  photoURL: null,
  providerId: 'custom'
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [masterActive, setMasterActive] = useState<boolean>(() => {
    return localStorage.getItem('byjuliaaleixo_master_logged') === 'true';
  });
  const [loading, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [role, setRole] = useState<UserRole | null>(null);

  // Fallback admin emails if not found in db
  const ADMIN_EMAILS = ['juualleixo@gmail.com', 'lapallyra@gmail.com', 'byjuliaaleixo@gmail.com'];

  useEffect(() => {
    const handleStorageOrAuthChange = () => {
      const isMaster = localStorage.getItem('byjuliaaleixo_master_logged') === 'true';
      setMasterActive(isMaster);
    };

    window.addEventListener('auth-state-change', handleStorageOrAuthChange);
    window.addEventListener('storage', handleStorageOrAuthChange);
    return () => {
      window.removeEventListener('auth-state-change', handleStorageOrAuthChange);
      window.removeEventListener('storage', handleStorageOrAuthChange);
    };
  }, []);

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

  const activeUser = useMemo(() => {
    if (masterActive) return MASTER_USER;
    return user;
  }, [masterActive, user]);

  const activeRole = useMemo(() => {
    if (masterActive) return 'ADMINISTRADOR' as UserRole;
    return role;
  }, [masterActive, role]);

  const isAdmin = useMemo(() => {
    return activeRole === 'ADMINISTRADOR';
  }, [activeRole]);

  const logout = async () => {
    console.log('[Auth] Initiating logout');
    localStorage.removeItem('byjuliaaleixo_master_logged');
    setMasterActive(false);
    try {
      await auth.signOut();
    } catch (error) {
      console.error('[Auth] Logout error:', error);
    }
    setUser(null);
    window.location.href = '/'; 
  };

  const contextValue = useMemo(() => ({
    user: activeUser,
    loading: masterActive ? false : (!authInitialized || loading),
    isAdmin,
    role: activeRole,
    logout
  }), [activeUser, loading, isAdmin, activeRole, authInitialized, masterActive]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
