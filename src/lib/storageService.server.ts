'use server';

import { adminStorage } from './firebase.server';

export const getFileDownloadURL = async (fullPath: string): Promise<string> => {
    if (!adminStorage) {
        throw new Error("Firebase Admin SDK is not configured on the server.");
    }
    // Use the Admin SDK to get a download URL. This bypasses security rules.
    // The URL is valid for 15 minutes by default.
    try {
        const file = adminStorage.bucket().file(fullPath);
        const [url] = await file.getSignedUrl({
            action: 'read',
            expires: Date.now() + 15 * 60 * 1000, // 15 minutes
        });
        return url;
    } catch (error: any) {
        console.error(`[GeminiScribe] Failed to get signed URL for ${fullPath}:`, error);
        // Re-throw a more specific error to help with debugging.
        if (error.code === 404) {
            throw new Error(`File not found in storage at path: ${fullPath}`);
        }
        throw new Error(`Could not generate download URL for the file. Details: ${error.message}`);
    }
}
