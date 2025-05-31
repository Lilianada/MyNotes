import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp, 
  query, 
  where
} from 'firebase/firestore';
import { db } from './firebase';
import { Note } from '@/types';
import { countWords } from '../data-processing/word-count';
import { 
  createSlugFromTitle, 
  getUniqueSlug
} from './firebase-helpers';

/**
 * Firebase write operations for notes
 */
export class FirebaseCRUDWrite {
  
  /**
   * Create a new note
   */
  static async addNote(userId: string, noteTitle: string): Promise<Note> {
    try {
      // Generate a numeric ID for the note
      const numericId = Date.now();
      
      // Create a slug from the note title for the document ID
      const baseSlug = createSlugFromTitle(noteTitle);
      const slug = await getUniqueSlug(baseSlug);
      
      // Create initial history entry
      const initialHistory = [{
        timestamp: new Date(),  // Use regular Date instead of serverTimestamp in arrays
        editType: 'create'
      }];

      const noteData = {
        id: numericId,
        content: "",
        noteTitle,
        createdAt: serverTimestamp(),
        userId,
        slug,
        filePath: `notes/${slug}.md`,
        wordCount: 0,
        editHistory: initialHistory
      };
      
      // Create document with slug as the document ID
      const docRef = doc(db, 'notes', slug);
      await setDoc(docRef, noteData);
      
      return {
        id: numericId,
        content: "",
        noteTitle,
        createdAt: new Date(),
        filePath: noteData?.filePath,
        slug,
        wordCount: 0,
        editHistory: [{
          timestamp: new Date(),
          editType: 'create'
        }]
      };
    } catch (error) {
      console.error('Error adding note:', error);
      throw new Error(`Failed to create note: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update note content
   */
  static async updateNoteContent(id: number, content: string): Promise<void> {
    try {
      const notesRef = collection(db, 'notes');
      const q = query(notesRef, where("id", "==", id));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        throw new Error(`Note with ID ${id} not found`);
      }
      
      const docRef = doc(db, 'notes', snapshot.docs[0].id);
      const wordCount = countWords(content);
      
      // Get the current document to access its edit history
      const noteDoc = await getDoc(docRef);
      const noteData = noteDoc.data();
      
      // Create new history entry with regular Date object for arrays
      // Firebase doesn't support serverTimestamp() in arrays
      const newHistoryEntry = {
        timestamp: new Date(),
        editType: 'update'
      };
      
      // Get existing history or create empty array if none exists
      const existingHistory = noteData?.editHistory || [];
      
      // Add new history entry (keeping history limited to most recent 20 entries)
      const updatedHistory = [newHistoryEntry, ...existingHistory].slice(0, 20);
      
      // Update the document with content and new history
      await updateDoc(docRef, { 
        content,
        wordCount,
        updatedAt: serverTimestamp(), // This is fine outside arrays
        editHistory: updatedHistory
      });
    } catch (error) {
      console.error('Error updating note content:', error);
      throw new Error(`Failed to update note content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Update note title
   */
  static async updateNoteTitle(id: number, noteTitle: string): Promise<string> {
    try {
      const notesRef = collection(db, 'notes');
      const q = query(notesRef, where("id", "==", id));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        throw new Error(`Note with ID ${id} not found`);
      }
      
      const baseSlug = createSlugFromTitle(noteTitle);
      const newSlug = await getUniqueSlug(baseSlug);
      const filePath = `notes/${newSlug}.md`;
      
      const oldDocRef = doc(db, 'notes', snapshot.docs[0].id);
      const oldData = snapshot.docs[0].data();
      
      // Create new history entry with regular Date object for arrays
      // Firebase doesn't support serverTimestamp() in arrays
      const newHistoryEntry = {
        timestamp: new Date(),
        editType: 'title'
      };
      
      // Get existing history or create empty array if none exists
      const existingHistory = oldData.editHistory || [];
      
      // Add new history entry (keeping history limited to most recent 20 entries)
      const updatedHistory = [newHistoryEntry, ...existingHistory].slice(0, 20);
      
      // Update the existing document in place
      await updateDoc(oldDocRef, {
        noteTitle,
        slug: newSlug,
        filePath,
        updatedAt: serverTimestamp(),
        editHistory: updatedHistory
      });
      
      return filePath;
    } catch (error) {
      console.error('Error updating note title:', error);
      throw new Error(`Failed to update note title: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
