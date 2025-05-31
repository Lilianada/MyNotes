import { 
  collection, 
  query, 
  where, 
  getDocs, 
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { NoteEditHistory } from '@/types';

/**
 * Helper function to create a slug from a note title
 */
export const createSlugFromTitle = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") 
    .replace(/[\s_-]+/g, "-") 
    .replace(/^-+|-+$/g, "") 
    || "untitled"; 
};

/**
 * Helper function to get a unique slug by checking existing notes
 */
export const getUniqueSlug = async (baseSlug: string): Promise<string> => {
  const notesRef = collection(db, 'notes');
  const q = query(notesRef, where("slug", "==", baseSlug));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    return baseSlug;
  }
  
  let counter = 1;
  let newSlug = `${baseSlug}-${counter}`;
  
  while (true) {
    const q = query(notesRef, where("slug", "==", newSlug));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return newSlug;
    }
    
    counter++;
    newSlug = `${baseSlug}-${counter}`;
  }
};

/**
 * Helper function to convert Firebase timestamps to JavaScript Date objects
 */
export const convertTimestamp = (timestamp: any): Date => {
  if (!timestamp) return new Date();
  
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  
  return new Date(timestamp);
};

/**
 * Convert Firebase history entries to typed NoteEditHistory objects
 */
export const convertEditHistory = (history: any[]): NoteEditHistory[] => {
  if (!history || !Array.isArray(history)) return [];
  
  return history.map(entry => ({
    timestamp: convertTimestamp(entry.timestamp),
    editType: entry.editType
  }));
};
