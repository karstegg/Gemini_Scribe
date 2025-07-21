import { collection, addDoc, deleteDoc, doc, serverTimestamp, query, orderBy, onSnapshot, type Unsubscribe } from "firebase/firestore";
import { db, auth, authenticateUser, isFirebaseConfigured } from "./firebase";
import type { HistoryItem } from "@/types";

type HistoryWithoutId = Omit<HistoryItem, 'id' | 'createdAt'>;

export const addHistoryItemToFirestore = async (item: HistoryWithoutId) => {
  if (!isFirebaseConfigured() || !db || !auth) {
    throw new Error("Firebase is not configured. History cannot be saved.");
  }
  
  const user = await authenticateUser();
  if (!user) throw new Error("User is not authenticated.");

  const historyCollection = collection(db, `users/${user.uid}/history`);
  return await addDoc(historyCollection, {
    ...item,
    createdAt: serverTimestamp()
  });
};

export const deleteHistoryItemFromFirestore = async (itemId: string) => {
  if (!isFirebaseConfigured() || !db || !auth?.currentUser) {
    throw new Error("Firebase is not configured or user is not authenticated.");
  }
  
  const docRef = doc(db, `users/${auth.currentUser.uid}/history`, itemId);
  return await deleteDoc(docRef);
};

export const listenToHistory = (
    callback: (history: HistoryItem[]) => void,
    onError: (error: Error) => void
): Unsubscribe | (() => void) => {
    if (!isFirebaseConfigured() || !db || !auth?.currentUser) {
        onError(new Error("Firebase is not configured or user is not authenticated."));
        return () => {};
    }

    const historyCollection = collection(db, `users/${auth.currentUser.uid}/history`);
    const q = query(historyCollection, orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const history: HistoryItem[] = [];
        querySnapshot.forEach((doc) => {
            history.push({ id: doc.id, ...doc.data() } as HistoryItem);
        });
        callback(history);
    }, (error) => {
        console.error("Error listening to history collection: ", error);
        onError(error);
    });

    return unsubscribe;
};
