'use server';

import { getFileDownloadURL } from '@/lib/storageService.server';

/**
 * A server action that can be called from client components to get a
 * secure, temporary download URL for a file in Firebase Storage.
 * @param fullPath The full path to the file in Firebase Storage.
 * @returns A promise that resolves to the download URL string.
 */
export async function getDownloadUrlAction(fullPath: string): Promise<string> {
  return getFileDownloadURL(fullPath);
}
