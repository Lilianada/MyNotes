import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  query, 
  where
} from 'firebase/firestore';
import { db } from './firebase';
import { Note } from '@/types';
import { countWords } from '../data-processing/word-count';
import { 
  convertTimestamp, 
  convertEditHistory 
} from './firebase-helpers';

/**
 * Firebase read operations for notes
 */
export class FirebaseCRUDRead {
  
  /**
   * Retrieve all notes for a user
   */
  static async getNotes(userId: string): Promise<Note[]> {
    try {
      const notesRef = collection(db, 'notes');
      const q = query(notesRef, where("userId", "==", userId));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: data.id, 
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
          editHistory: data.editHistory ? convertEditHistory(data.editHistory) : []
        };
      });
    } catch (error) {
      // Specifically handle potential cross-origin errors
      if (error instanceof DOMException && error.name === "SecurityError") {
        console.error('Cross-origin security error getting notes:', error);
      } else {
        console.error('Error getting notes:', error);
      }
      return []; // Return empty array on error
    }
  }

  /**
   * Get a single note by ID
   */
  static async getNote(id: number): Promise<Note | null> {
    try {
      const notesRef = collection(db, 'notes');
      const q = query(notesRef, where("id", "==", id));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return null;
      }
      
      const data = snapshot.docs[0].data();
      return {
        id: data.id, 
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
        editHistory: data.editHistory ? convertEditHistory(data.editHistory) : []
      };
    } catch (error) {
      console.error('Error getting note:', error);
      return null;
    }
  }
}
