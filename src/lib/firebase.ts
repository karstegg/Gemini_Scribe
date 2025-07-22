// This file should only contain CLIENT-SIDE Firebase initialization.
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged, type User } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "jAiszaSyA-_9TT93a74n5c6k_H8j_V8-PzZtYwE",
  authDomain: "audio-transcription-serv-80134.firebaseapp.com",
  projectId: "audio-transcription-serv-80134",
  storageBucket: "audio-transcription-serv-80134.appspot.com",
  messagingSenderId: "1062602787834",
  appId: "1:1062602787834:web:0b72183c5095d6a2f183c4",
};

export function isFirebaseConfigured() {
    // This function will now check if the required env vars are provided.
    return firebaseConfig.apiKey &&
           firebaseConfig.projectId &&
           firebaseConfig.storageBucket;
}

// Client-side Firebase App
const app = isFirebaseConfigured() 
    ? !getApps().length ? initializeApp(firebaseConfig) : getApp() 
    : null;

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const storage = app ? getStorage(app) : null;

export const authenticateUser = (): Promise<User | null> => {
  return new Promise((resolve, reject) => {
    if (!auth) {
        return reject(new Error("Firebase is not configured. Please check your environment variables."));
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
