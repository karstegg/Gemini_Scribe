// This file should only contain SERVER-SIDE Firebase Admin initialization.
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

// Server-side Firebase Admin App
let adminApp: AdminApp | null = null;

// Check if credentials are provided and Firebase is configured
if (process.env.GOOGLE_APPLICATION_CREDENTIALS && isFirebaseConfigured()) {
    try {
        const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);
        if (!getAdminApps().length) {
            adminApp = initializeAdminApp({
                credential: cert(serviceAccount),
                storageBucket: firebaseConfig.storageBucket,
            });
        } else {
            adminApp = getAdminApp();
        }
    } catch (e: any) {
        console.error("Failed to parse GOOGLE_APPLICATION_CREDENTIALS or initialize Firebase Admin SDK", e.message);
    }
} else {
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        console.warn("GOOGLE_APPLICATION_CREDENTIALS environment variable is not set. Firebase Admin SDK will not be initialized.");
    }
}

export const adminStorage = adminApp ? getAdminStorage(adminApp) : null;
