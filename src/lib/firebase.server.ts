import {
  initializeApp as initializeAdminApp,
  getApps as getAdminApps,
  getApp as getAdminApp,
  cert,
  type App as AdminApp,
} from 'firebase-admin/app';
import { getStorage as getAdminStorage } from 'firebase-admin/storage';

const isFirebaseConfigured = () => {
  // Server-side configuration only needs the service account and the storage bucket.
  return (
    process.env.GOOGLE_APPLICATION_CREDENTIALS &&
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  );
};

let adminApp: AdminApp | null = null;

function getInitializedAdminApp(): AdminApp {
  if (adminApp) {
    return adminApp;
  }

  // Use the existence of admin apps as the primary check for initialization.
  if (getAdminApps().length > 0) {
    adminApp = getAdminApp();
    return adminApp;
  }
  
  // If no app is initialized, proceed with configuration check.
  if (isFirebaseConfigured()) {
    try {
      const serviceAccount = JSON.parse(
        process.env.GOOGLE_APPLICATION_CREDENTIALS!
      );
      adminApp = initializeAdminApp({
        credential: cert(serviceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
      return adminApp;
    } catch (e: any) {
      console.error(
        'Failed to parse GOOGLE_APPLICATION_CREDENTIALS or initialize Firebase Admin SDK.',
        e.message
      );
      // Throw a specific error that will be caught by the calling flow.
      throw new Error('Firebase Admin SDK initialization failed.');
    }
  } else {
    // This is the critical error path. If the variables aren't set, we can't proceed.
    console.error(
      'Firebase Admin SDK is not configured. Check GOOGLE_APPLICATION_CREDENTIALS and NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET environment variables.'
    );
    throw new Error('Firebase Admin SDK is not configured on the server.');
  }
}

export const adminStorage = () => {
  const app = getInitializedAdminApp();
  return getAdminStorage(app);
};
