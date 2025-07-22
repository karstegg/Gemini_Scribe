import {
  initializeApp as initializeAdminApp,
  getApps as getAdminApps,
  cert,
  type App as AdminApp,
} from 'firebase-admin/app';
import { getStorage as getAdminStorage } from 'firebase-admin/storage';

let adminApp: AdminApp | null = null;

/**
 * A singleton function to get the initialized Firebase Admin app.
 * It initializes the app only if it hasn't been already.
 * This function is for server-side use only.
 */
function getInitializedAdminApp(): AdminApp {
  if (adminApp) {
    return adminApp;
  }

  // Check if the app is already initialized (e.g., by another module)
  if (getAdminApps().length > 0) {
    adminApp = getAdminApps()[0];
    return adminApp;
  }

  // If not initialized, create a new instance.
  // This relies on GOOGLE_APPLICATION_CREDENTIALS and NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  // being set in the environment. `cert()` will throw if the credentials are not valid.
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
    // This will catch errors from JSON.parse or cert() if env vars are missing/malformed.
    console.error(
      'Firebase Admin SDK initialization failed. Ensure GOOGLE_APPLICATION_CREDENTIALS (as JSON string) and NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET are set correctly in your environment.',
      e.message
    );
    throw new Error('Firebase Admin SDK is not configured on the server.');
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
