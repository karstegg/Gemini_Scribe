
import {
  initializeApp as initializeAdminApp,
  getApps as getAdminApps,
  cert,
  type App as AdminApp,
  getApp,
} from 'firebase-admin/app';
import { getStorage as getAdminStorage } from 'firebase-admin/storage';

// Force environment variable loading for server-side execution
if (typeof window === 'undefined') {
  require('dotenv').config({ path: '.env.local' });
}

let adminApp: AdminApp | null = null;

/**
 * Helper function to fix private key formatting issues, which are common
 * when loading from environment variables.
 * @param key The private key string.
 * @returns A correctly formatted PEM key.
 */
function fixPrivateKey(key: string): string {
  // Replace literal \n with actual newlines.
  return key.replace(/\\n/g, '\n');
}

/**
 * A robust singleton function to get the initialized Firebase Admin app.
 * This function ensures the app is initialized only once and provides multiple
 * secure ways to load credentials from environment variables.
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
    let credentials;
    
    // Option 1: Base64 encoded credentials (RECOMMENDED for reliability)
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64) {
      const decoded = Buffer.from(process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64, 'base64').toString('utf-8');
      credentials = JSON.parse(decoded);
    }
    // Option 2: Full JSON string from a single environment variable
    else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);
    }
    // Option 3: Individual environment variables for each credential field
    else if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PROJECT_ID) {
      credentials = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: fixPrivateKey(process.env.FIREBASE_PRIVATE_KEY),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
      };
    }
    else {
      // If no credentials are found, import from the local file as a last resort for local dev.
      // This is not recommended for production.
      try {
        const serviceAccount = require('../../../serviceAccountKey.json');
        credentials = serviceAccount;
      } catch (e) {
         throw new Error('No valid Firebase credentials found in environment variables and serviceAccountKey.json could not be found.');
      }
    }

    // The cert function expects the private key to be correctly formatted.
    // If it's loaded from a JSON string or individual vars, it might need fixing.
    if (credentials.private_key) {
      credentials.private_key = fixPrivateKey(credentials.private_key);
    }

    const firebaseAdminConfig = {
      credential: cert(credentials),
      storageBucket: storageBucket,
    };

    adminApp = initializeAdminApp(firebaseAdminConfig);
    return adminApp;

  } catch (error: any) {
    console.error('[Firebase Admin] Initialization error:', error);
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
