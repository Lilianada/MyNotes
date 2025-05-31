import { NoteEditHistory } from '@/types';
import { db } from '../firebase/firebase';
import { 
  collection, 
  getDocs, 
  query, 
  where
} from 'firebase/firestore';
import { convertEditHistory } from './helpers';

/**
 * Get the appropriate collection reference based on user type
 * For admins: use top-level 'notes' collection
 * For regular users: use subcollection 'users/{userId}/notes'
 */
function getNotesCollectionRef(userId: string, isAdmin: boolean) {
  if (isAdmin) {
    return collection(db, 'notes');
  } else {
    return collection(db, 'users', userId, 'notes');
  }
}

/**
 * Get edit history for a note
 */
export const getNoteHistory = async (noteId: number, userId: string, isAdmin: boolean = false): Promise<NoteEditHistory[]> => {
  try {
    if (!isAdmin && !userId) {
      throw new Error('User ID is required for non-admin operations');
    }

    // Find the document by note ID
    const notesRef = getNotesCollectionRef(userId, isAdmin);
    const q = query(notesRef, where("id", "==", noteId));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return [];
    }
    
    const data = snapshot.docs[0].data();
    
    return data.editHistory ? convertEditHistory(data.editHistory) : [];
  } catch (error) {
    console.error(`Error getting note history for ${noteId}:`, error);
    return [];
  }
};
