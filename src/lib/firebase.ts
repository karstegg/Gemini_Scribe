
// This file should only contain CLIENT-SIDE Firebase initialization.
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged, type User } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Debug logging - remove after fixing
console.log('🔧 Firebase Config Debug:', {
  apiKey: firebaseConfig.apiKey ? `✅ ${firebaseConfig.apiKey.substring(0, 10)}...` : '❌ Missing',
  authDomain: firebaseConfig.authDomain || '❌ Missing',
  projectId: firebaseConfig.projectId || '❌ Missing',
  storageBucket: firebaseConfig.storageBucket || '❌ Missing',
});

// Validate Firebase configuration
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
  console.error('Firebase configuration is missing. Please check your environment variables.');
  console.error('Required variables: NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, NEXT_PUBLIC_FIREBASE_PROJECT_ID');
  throw new Error('Firebase configuration is missing. Please check your environment variables.');
}

// Client-side Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export const authenticateUser = (): Promise<User> => {
  return new Promise((resolve, reject) => {
    if (!auth) {
        return reject(new Error("Firebase Auth is not available."));
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      if (user) {
        resolve(user);
      } else {
        signInAnonymously(auth)
          .then((cred) => resolve(cred.user))
          .catch(reject);
      }
    }, reject); // Add reject handler for onAuthStateChanged
  });
};
