import { NoteEditHistory } from '@/types';
import { db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  Timestamp
} from 'firebase/firestore';

/**
 * Creates a URL-friendly slug from a title
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
 * Ensures the slug is unique by appending numbers if needed
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
 * Convert Firebase Timestamp to JavaScript Date
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
