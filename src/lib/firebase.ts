// This file should only contain CLIENT-SIDE Firebase initialization.
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged, type User } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDo_1JOfJAIzaSyDo_1JOfJAIzaSyDo_1JOfJ-SECRET",
  authDomain: "audio-transcription-serv-80134.firebaseapp.com",
  projectId: "audio-transcription-serv-80134",
  storageBucket: "audio-transcription-serv-80134.appspot.com",
  messagingSenderId: "1071065609653",
  appId: "1:1071065609653:web:545d1ff8f8a1a383d46328",
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
