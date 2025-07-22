
import {
  initializeApp as initializeAdminApp,
  getApps as getAdminApps,
  cert,
  type App as AdminApp,
  getApp,
} from 'firebase-admin/app';
import { getStorage as getAdminStorage } from 'firebase-admin/storage';
import serviceAccount from '../../serviceAccountKey.json';

let adminApp: AdminApp | null = null;

/**
 * A robust singleton function to get the initialized Firebase Admin app.
 * This function ensures the app is initialized only once.
 * For server-side use only.
 */
function getInitializedAdminApp(): AdminApp {
  // If the app is already initialized, return it.
  if (adminApp) {
    return adminApp;
  }

  // If other parts of the code initialized it, use that.
  const existingApps = getAdminApps();
  if (existingApps.length > 0) {
    adminApp = getApp();
    return adminApp;
  }
  
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

  if (!storageBucket) {
    throw new Error('Firebase Admin SDK is not configured: Missing NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET environment variable.');
  }

  try {
    // Directly use the imported service account object.
    // This bypasses any issues with environment variable loading or parsing.
    const firebaseAdminConfig = {
      credential: cert(serviceAccount as any),
      storageBucket: storageBucket,
    };

    adminApp = initializeAdminApp(firebaseAdminConfig);
    return adminApp;

  } catch (error: any) {
    throw new Error(`Firebase Admin SDK initialization failed: ${error.message}`);
  }
}

/**
 * Gets the Firebase Admin Storage instance.
 * For server-side use only.
 */
export const adminStorage = () => {
  const app = getInitializedAdminApp();
  return getAdminStorage(app);
};
