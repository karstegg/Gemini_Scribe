
// This file should only contain CLIENT-SIDE Firebase initialization.
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged, type User } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCV_M_7aotJq3K9H-pT3rK1fVq-jQ-o5Bo",
  authDomain: "audio-transcription-serv-80134.firebaseapp.com",
  projectId: "audio-transcription-serv-80134",
  storageBucket: "audio-transcription-serv-80134.appspot.com",
  messagingSenderId: "1071065609653",
  appId: "1:1071065609653:web:545d1ff8f8a1a383d46328",
};

// Client-side Firebase App
// Initialize the app directly. The configuration is now guaranteed to be present.
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
