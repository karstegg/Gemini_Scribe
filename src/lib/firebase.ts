import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged, type User } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { initializeApp as initializeAdminApp, getApps as getAdminApps, getApp as getAdminApp, cert, type App as AdminApp } from "firebase-admin/app";
import { getStorage as getAdminStorage } from "firebase-admin/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function isFirebaseConfigured() {
    return firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.storageBucket;
}

// Client-side Firebase App
const app = isFirebaseConfigured() 
    ? !getApps().length ? initializeApp(firebaseConfig) : getApp() 
    : null;

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const storage = app ? getStorage(app) : null;

// Server-side Firebase Admin App
let adminApp: AdminApp | null = null;
if (process.env.GOOGLE_APPLICATION_CREDENTIALS && isFirebaseConfigured()) {
    if (!getAdminApps().length) {
        adminApp = initializeAdminApp({
            credential: cert(JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS)),
            storageBucket: firebaseConfig.storageBucket,
        });
    } else {
        adminApp = getAdminApp();
    }
}
export const adminStorage = adminApp ? getAdminStorage(adminApp) : null;


export const authenticateUser = (): Promise<User | null> => {
  return new Promise((resolve, reject) => {
    if (!auth) {
        return reject(new Error("Firebase is not configured."));
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
    });
  });
};

export { isFirebaseConfigured };
