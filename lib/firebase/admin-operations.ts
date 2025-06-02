import { Note } from '@/types';
import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';
import { generateUniqueId, calculateNoteSize } from '../storage/storage-utils';
import { convertTimestamp, convertEditHistory } from './helpers';
import { countWords } from '../data-processing/word-count';

/**
 * Retrieve all admin notes from the top-level notes collection
 * This function is only available to admin users
 */
export const getAllAdminNotes = async (): Promise<Note[]> => {
  try {
    // Admin notes are stored in the top-level notes collection
    const notesRef = collection(db, 'notes');
    const snapshot = await getDocs(notesRef);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      const note: Note = {
        id: data.id, 
        uniqueId: data.uniqueId || generateUniqueId(),
        content: data.content || "",
        noteTitle: data.noteTitle || "Untitled",
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: data.updatedAt ? convertTimestamp(data.updatedAt) : undefined,
        filePath: data.filePath || undefined,
        slug: data.slug || "",
        category: data.category || undefined,
        tags: data.tags || [],
        parentId: data.parentId !== undefined ? data.parentId : null,
        linkedNoteIds: data.linkedNoteIds || [],
        wordCount: data.wordCount || (data.content ? countWords(data.content) : 0),
        publish: data.publish || false,
        editHistory: data.editHistory ? convertEditHistory(data.editHistory) : [],
        archived: data.archived || false,
        fileSize: data.fileSize || calculateNoteSize(data as Note)
      };
      return note;
    });
  } catch (error) {
    console.error('Error getting admin notes:', error);
    return []; // Return empty array on error
  }
};

/**
 * Get all users who have notes in the system
 * This function is only available to admin users
 */
export const getAllUsersWithNotes = async () => {
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    
    return snapshot.docs.map(doc => {
      return {
        id: doc.id,
        ...doc.data()
      };
    });
  } catch (error) {
    console.error('Error getting users:', error);
    return [];
  }
};
