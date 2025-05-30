import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  updateDoc, 
  serverTimestamp, 
  query, 
  where
} from 'firebase/firestore';
import { db } from '../firebase';
import { Note, NoteCategory, NoteEditHistory } from '@/types';
import { convertEditHistory } from './firebase-helpers';

/**
 * Data operations for Firebase notes (categories, tags, metadata, history)
 */
export class FirebaseDataOperations {
  
  /**
   * Update note category
   */
  static async updateNoteCategory(id: number, category: NoteCategory | null): Promise<void> {
    try {
      const notesRef = collection(db, 'notes');
      const q = query(notesRef, where("id", "==", id));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        throw new Error(`Note with ID ${id} not found`);
      }
      
      const docRef = doc(db, 'notes', snapshot.docs[0].id);
      
      // Get the current document to access its edit history
      const noteDoc = await getDoc(docRef);
      const noteData = noteDoc.data();
      
      // Create new history entry with regular Date object
      const newHistoryEntry = {
        timestamp: new Date(),
        editType: 'category'
      };
      
      // Get existing history or create empty array if none exists
      const existingHistory = noteData?.editHistory || [];
      
      // Add new history entry (keeping history limited to most recent 20 entries)
      const updatedHistory = [newHistoryEntry, ...existingHistory].slice(0, 20);
      
      if (category) {
        await updateDoc(docRef, { 
          category, 
          updatedAt: serverTimestamp(),
          editHistory: updatedHistory
        });
      } else {
        // Remove category if null
        await updateDoc(docRef, { 
          category: null,
          updatedAt: serverTimestamp(),
          editHistory: updatedHistory
        });
      }
    } catch (error) {
      console.error('Error updating note category:', error);
      throw new Error(`Failed to update note category: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Get note edit history
   */
  static async getNoteHistory(id: number): Promise<NoteEditHistory[]> {
    try {
      const notesRef = collection(db, 'notes');
      const q = query(notesRef, where("id", "==", id));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        throw new Error(`Note with ID ${id} not found`);
      }
      
      // Get the note document
      const noteDoc = await getDoc(doc(db, 'notes', snapshot.docs[0].id));
      const noteData = noteDoc.data();
      
      // If the note has no edit history, return an empty array
      if (!noteData?.editHistory || !Array.isArray(noteData?.editHistory)) {
        return [];
      }
      
      // Convert and return the edit history
      return convertEditHistory(noteData?.editHistory);
    } catch (error) {
      console.error('Error getting note history:', error);
      return [];
    }
  }

  /**
   * Update note tags
   */
  static async updateNoteTags(id: number, tags: string[]): Promise<string[]> {
    try {
      const notesRef = collection(db, 'notes');
      const q = query(notesRef, where("id", "==", id));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        throw new Error(`Note with ID ${id} not found`);
      }
      
      const docRef = doc(db, 'notes', snapshot.docs[0].id);
      
      // Get the current document to access its edit history
      const noteDoc = await getDoc(docRef);
      const noteData = noteDoc.data();
      
      // Create new history entry
      const newHistoryEntry = {
        timestamp: new Date(),
        editType: 'tags'
      };
      
      // Get existing history or create empty array if none exists
      const existingHistory = noteData?.editHistory || [];
      
      // Add new history entry (keeping history limited to most recent 20 entries)
      const updatedHistory = [newHistoryEntry, ...existingHistory].slice(0, 20);
      
      // Ensure tags are properly cleaned
      const cleanTags = Array.isArray(tags) ? 
        [...tags].filter(Boolean).map(tag => tag.trim().toLowerCase()) : [];
      
      await updateDoc(docRef, { 
        tags: cleanTags,
        updatedAt: serverTimestamp(),
        editHistory: updatedHistory
      });
      
      // Return the clean tags array so callers have access to the normalized values
      return cleanTags;
    } catch (error) {
      console.error('Error updating note tags:', error);
      throw new Error(`Failed to update note tags: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update note data with any field changes
   */
  static async updateNoteData(id: number, updatedNote: Partial<Note>): Promise<void> {
    try {
      const notesRef = collection(db, 'notes');
      const q = query(notesRef, where("id", "==", id));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        throw new Error(`Note with ID ${id} not found`);
      }
      
      const docRef = doc(db, 'notes', snapshot.docs[0].id);
      const currentDoc = await getDoc(docRef);
      const currentData = currentDoc.data();
      
      // Determine edit type based on what fields are being updated
      let editType: NoteEditHistory['editType'] = 'update';
      if (updatedNote.noteTitle !== undefined) editType = 'title';
      else if (updatedNote.tags !== undefined) editType = 'tags';
      else if (updatedNote.category !== undefined) editType = 'category';
      
      // Create new history entry
      const newHistoryEntry = {
        timestamp: new Date(),
        editType
      };
      
      // Get existing history or create empty array if none exists
      const existingHistory = currentData?.editHistory || [];
      
      // Add new history entry (keeping history limited to most recent 20 entries)
      const updatedHistory = [newHistoryEntry, ...existingHistory].slice(0, 20);
      
      // Special handling for tags - ensure it's always an array
      const cleanData: Record<string, any> = {};
      
      // Process each field for Firestore
      if (updatedNote.noteTitle !== undefined) cleanData.noteTitle = updatedNote.noteTitle;
      if (updatedNote.content !== undefined) cleanData.content = updatedNote.content;
      if (updatedNote.category !== undefined) cleanData.category = updatedNote.category;
      if (updatedNote.parentId !== undefined) cleanData.parentId = updatedNote.parentId;
      
      // Special handling for tags - make a direct copy
      if (updatedNote.tags !== undefined) {
        cleanData.tags = Array.isArray(updatedNote.tags) ? [...updatedNote.tags] : [];
        console.log(`[FIREBASE] Setting tags for note ${id} to:`, JSON.stringify(cleanData.tags));
      }
      
      // Handle linked notes
      if (updatedNote.linkedNoteIds !== undefined) {
        cleanData.linkedNoteIds = Array.isArray(updatedNote.linkedNoteIds) ? 
          [...updatedNote.linkedNoteIds] : [];
      }
      
      // Update the document with new data and history
      await updateDoc(docRef, {
        ...cleanData,
        updatedAt: serverTimestamp(),
        editHistory: updatedHistory
      });
      
      console.log(`[FIREBASE] Note ${id} updated successfully in Firestore`);
    } catch (error) {
      console.error('Error updating note data:', error);
      throw new Error(`Failed to update note data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
