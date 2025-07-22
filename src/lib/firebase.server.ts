
import {
  initializeApp as initializeAdminApp,
  getApps as getAdminApps,
  cert,
  type App as AdminApp,
} from 'firebase-admin/app';
import { getStorage as getAdminStorage } from 'firebase-admin/storage';
import serviceAccount from '../../serviceAccountKey.json';

let adminApp: AdminApp | null = null;

// A robust singleton function to get the initialized Firebase Admin app.
function getInitializedAdminApp(): AdminApp {
  // If the app is already initialized, return it.
  if (adminApp) {
    return adminApp;
  }

  // If other parts of the code initialized it, use that.
  if (getAdminApps().length > 0) {
    adminApp = getAdminApps()[0];
    return adminApp;
  }
  
  // Directly use the imported service account object.
  // This bypasses any issues with environment variable loading or parsing.
  const firebaseAdminConfig = {
    credential: cert(serviceAccount as any),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  };

  adminApp = initializeAdminApp(firebaseAdminConfig);

  return adminApp;
}

/**
 * Gets the Firebase Admin Storage instance.
 * For server-side use only.
 */
export const adminStorage = () => {
  const app = getInitializedAdminApp();
  return getAdminStorage(app);
};
