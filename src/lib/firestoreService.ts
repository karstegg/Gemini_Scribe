import { collection, addDoc, deleteDoc, doc, serverTimestamp, query, orderBy, onSnapshot, type Unsubscribe } from "firebase/firestore";
import { db, auth, authenticateUser } from "./firebase";
import type { HistoryItem } from "@/types";

type HistoryWithoutId = Omit<HistoryItem, 'id' | 'createdAt'>;

export const addHistoryItemToFirestore = async (item: HistoryWithoutId) => {
  if (!db || !auth) throw new Error("Firestore is not initialized.");
  
  const user = await authenticateUser();
  if (!user) throw new Error("User is not authenticated.");

  const historyCollection = collection(db, `users/${user.uid}/history`);
  return await addDoc(historyCollection, {
    ...item,
    createdAt: serverTimestamp()
  });
};

export const deleteHistoryItemFromFirestore = async (itemId: string) => {
  if (!db || !auth?.currentUser) throw new Error("Firestore is not initialized or user is not authenticated.");
  
  const docRef = doc(db, `users/${auth.currentUser.uid}/history`, itemId);
  return await deleteDoc(docRef);
};

export const listenToHistory = (
    callback: (history: HistoryItem[]) => void,
    onError: (error: Error) => void
): Unsubscribe | (() => void) => {
    if (!db || !auth?.currentUser) {
        onError(new Error("Firestore is not initialized or user is not authenticated."));
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
