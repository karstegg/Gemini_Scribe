import { ref, uploadBytesResumable, type UploadTask } from 'firebase/storage';
import { storage } from './firebase';
import type { User } from 'firebase/auth';

if (!storage) {
  throw new Error("Firebase Storage is not configured. File uploads will not work.");
}

export const uploadFileToStorage = (
  file: File,
  user: User,
  onProgress: (progress: number) => void
): { task: UploadTask; fullPath: string } => {
  if (!user) {
    throw new Error('User is not authenticated.');
  }

  const userId = user.uid;
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
