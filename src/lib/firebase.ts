import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, signOut } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const login = async () => {
  try {
    console.log('[Auth] Attempting login with popup');
    const result = await signInWithPopup(auth, googleProvider);
    console.log('[Auth] Login success:', result.user.email);
    return result.user;
  } catch (error: any) {
    console.error('[Auth] Login error details:', {
      code: error.code,
      message: error.message,
      name: error.name
    });
    if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
      console.log('[Auth] Login popup closed by user.');
      return null;
    }
    // Fallback to redirect if popup is blocked or network request failed in iframe/preview
    if (error.code === 'auth/popup-blocked' || error.code === 'auth/network-request-failed') {
      console.log('[Auth] Popup/Network request failed, redirecting...');
      try {
        await signInWithRedirect(auth, googleProvider);
        return null;
      } catch (redirectErr) {
        console.error('[Auth] Redirect fallback error:', redirectErr);
        throw error;
      }
    }
    throw error; 
  }
};

export const loginWithRedirect = () => {
  console.log('[Auth] Attempting login with redirect');
  return signInWithRedirect(auth, googleProvider);
};

export const logout = () => signOut(auth);
