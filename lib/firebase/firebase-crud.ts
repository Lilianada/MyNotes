import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  deleteField,
  serverTimestamp, 
  query, 
  where
} from 'firebase/firestore';
import { db } from '../firebase';
import { Note } from '@/types';
import { countWords } from '../word-count';
import { 
  createSlugFromTitle, 
  getUniqueSlug, 
  convertTimestamp, 
  convertEditHistory 
} from './firebase-helpers';

/**
 * Basic CRUD operations for Firebase notes
 */
export class FirebaseCRUDOperations {
  
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
      
      // Create new note document with updated title
      const newDocRef = doc(db, 'notes', newSlug);
      await setDoc(newDocRef, {
        ...oldData,
        noteTitle,
        slug: newSlug,
        filePath,
        updatedAt: serverTimestamp(),
        editHistory: updatedHistory
      });
      
      // Delete old document after migration
      await deleteDoc(oldDocRef);
      
      return filePath;
    } catch (error) {
      console.error('Error updating note title:', error);
      throw new Error(`Failed to update note title: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Delete a note
   */
  static async deleteNote(id: number): Promise<void> {
    try {
      const notesRef = collection(db, 'notes');
      const q = query(notesRef, where("id", "==", id));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        throw new Error(`Note with ID ${id} not found`);
      }
      
      const docRef = doc(db, 'notes', snapshot.docs[0].id);
      
      // First, delete all fields individually to ensure proper Firestore cleanup
      const fieldsToDelete = [
        'content', 'noteTitle', 'slug', 'filePath', 'category', 
        'wordCount', 'tags', 'parentId', 'linkedNoteIds', 'publish', 
        'description', 'editHistory', 'createdAt', 'updatedAt'
      ];
      
      // Delete each field individually
      const updateData: Record<string, any> = {};
      fieldsToDelete.forEach(field => {
        updateData[field] = deleteField();
      });
      
      await updateDoc(docRef, updateData);
      
      // Now delete the document itself
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting note:', error);
      throw new Error(`Failed to delete note: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  /**
   * Bulk delete multiple notes
   */
  static async bulkDeleteNotes(ids: number[]): Promise<{ successful: number[], failed: { id: number, error: string }[] }> {
    const successful: number[] = [];
    const failed: { id: number, error: string }[] = [];
    
    // Process deletions in batches of 10 to avoid overwhelming Firestore
    const batchSize = 10;
    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize);
      
      // Process each batch in parallel
      const results = await Promise.allSettled(
        batch.map(async (id) => {
          try {
            await FirebaseCRUDOperations.deleteNote(id);
            return { success: true, id };
          } catch (error) {
            return { 
              success: false, 
              id, 
              error: error instanceof Error ? error.message : 'Unknown error' 
            };
          }
        })
      );
      
      // Process results
      results.forEach((result, index) => {
        const id = batch[index];
        if (result.status === 'fulfilled' && result.value.success) {
          successful.push(id);
        } else {
          const errorMessage = result.status === 'fulfilled' 
            ? result.value.error 
            : 'Promise rejected';
          failed.push({ id, error: errorMessage || 'Unknown error' });
        }
      });
    }
    
    return { successful, failed };
  }
}
