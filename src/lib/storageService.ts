import { ref, uploadBytesResumable, type UploadTask } from 'firebase/storage';
import { storage, auth, adminStorage } from './firebase';
import type { User } from 'firebase/auth';

if (!storage) {
  throw new Error("Firebase Storage is not configured. File uploads will not work.");
}

export const uploadFileToStorage = (
  file: File,
  onProgress: (progress: number) => void
): { task: UploadTask; fullPath: string } => {
  if (!auth?.currentUser) {
    throw new Error('User is not authenticated.');
  }

  const userId = auth.currentUser.uid;
  const fileId = `${Date.now()}-${file.name}`;
  const fullPath = `uploads/${userId}/${fileId}`;
  const storageRef = ref(storage, fullPath);

  const task = uploadBytesResumable(storageRef, file);

  task.on('state_changed', 
    (snapshot) => {
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      onProgress(progress);
    }
  );

  return { task, fullPath };
};

export const getFileDownloadURL = async (fullPath: string): Promise<string> => {
    if (!adminStorage) {
        throw new Error("Firebase Admin SDK is not configured.");
    }
    // Use the Admin SDK to get a download URL. This bypasses security rules.
    // The URL is valid for 15 minutes by default.
    const file = adminStorage.bucket().file(fullPath);
    const [url] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    });
    return url;
}
