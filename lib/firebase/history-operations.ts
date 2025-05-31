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
 * Get edit history for a note
 */
export const getNoteHistory = async (noteId: number): Promise<NoteEditHistory[]> => {
  try {
    // Find the document by note ID
    const notesRef = collection(db, 'notes');
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
