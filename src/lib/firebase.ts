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
    throw error;
  }
};

export const loginWithRedirect = () => {
  console.log('[Auth] Attempting login with redirect');
  return signInWithRedirect(auth, googleProvider);
};

export const logout = () => signOut(auth);
