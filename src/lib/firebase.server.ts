import {
  initializeApp as initializeAdminApp,
  getApps as getAdminApps,
  getApp as getAdminApp,
  cert,
  type App as AdminApp,
} from 'firebase-admin/app';
import { getStorage as getAdminStorage } from 'firebase-admin/storage';

const isFirebaseConfigured = () => {
  return (
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  );
};

let adminApp: AdminApp | null = null;

function getInitializedAdminApp(): AdminApp {
  if (adminApp) {
    return adminApp;
  }

  if (getAdminApps().length > 0) {
    adminApp = getAdminApp();
    return adminApp;
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS && isFirebaseConfigured()) {
    try {
      const serviceAccount = JSON.parse(
        process.env.GOOGLE_APPLICATION_CREDENTIALS
      );
      adminApp = initializeAdminApp({
        credential: cert(serviceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
      return adminApp;
    } catch (e: any) {
      console.error(
        'Failed to parse GOOGLE_APPLICATION_CREDENTIALS or initialize Firebase Admin SDK',
        e.message
      );
      throw new Error('Firebase Admin SDK initialization failed.');
    }
  } else {
    console.warn(
      'GOOGLE_APPLICATION_CREDENTIALS environment variable is not set or Firebase is not configured. Firebase Admin SDK will not be initialized.'
    );
    throw new Error('Firebase Admin SDK is not configured on the server.');
  }
}

export const adminStorage = () => {
  const app = getInitializedAdminApp();
  return getAdminStorage(app);
};
