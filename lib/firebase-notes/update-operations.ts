import { Note, NoteCategory } from '@/types';
import { db } from '../firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  updateDoc, 
  serverTimestamp, 
  query, 
  where 
} from 'firebase/firestore';
import { countWords } from '../word-count';

/**
 * Update a note's content
 */
export const updateNoteContent = async (noteId: number, content: string): Promise<void> => {
  try {
    // Find the document by note ID
    const notesRef = collection(db, 'notes');
    const q = query(notesRef, where("id", "==", noteId));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      throw new Error(`Note with ID ${noteId} not found`);
    }
    
    const docRef = doc(db, 'notes', snapshot.docs[0].id);
    
    // Calculate word count
    const wordCount = countWords(content);
    
    // Add to edit history with enhanced data
    const historyEntry = {
      timestamp: new Date(),
      editType: 'update',
      contentLength: content.length,
      contentSnapshot: content.length > 100 ? content : undefined // Store snapshot for longer content
    };
    
    await updateDoc(docRef, {
      content,
      updatedAt: serverTimestamp(),
      wordCount,
      "editHistory": snapshot.docs[0].data().editHistory
        ? [...snapshot.docs[0].data().editHistory, historyEntry]
        : [historyEntry]
    });
  } catch (error) {
    console.error(`Error updating note ${noteId}:`, error);
    throw error;
  }
};

/**
 * Update a note's title
 */
export const updateNoteTitle = async (noteId: number, newTitle: string): Promise<void> => {
  try {
    // Find the document by note ID
    const notesRef = collection(db, 'notes');
    const q = query(notesRef, where("id", "==", noteId));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      throw new Error(`Note with ID ${noteId} not found`);
    }
    
    const docRef = doc(db, 'notes', snapshot.docs[0].id);
    
    // Add to edit history
    const historyEntry = {
      timestamp: new Date(),
      editType: 'title'
    };
    
    await updateDoc(docRef, {
      noteTitle: newTitle,
      updatedAt: serverTimestamp(),
      "editHistory": snapshot.docs[0].data().editHistory
        ? [...snapshot.docs[0].data().editHistory, historyEntry]
        : [historyEntry]
    });
  } catch (error) {
    console.error(`Error updating note title ${noteId}:`, error);
    throw error;
  }
};

/**
 * Update a note's category
 */
export const updateNoteCategory = async (noteId: number, category: NoteCategory | null): Promise<void> => {
  try {
    // Find the document by note ID
    const notesRef = collection(db, 'notes');
    const q = query(notesRef, where("id", "==", noteId));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      throw new Error(`Note with ID ${noteId} not found`);
    }
    
    const docRef = doc(db, 'notes', snapshot.docs[0].id);
    
    // Add to edit history
    const historyEntry = {
      timestamp: new Date(),
      editType: 'category'
    };
    
    const updateData: any = {
      updatedAt: serverTimestamp(),
      "editHistory": snapshot.docs[0].data().editHistory
        ? [...snapshot.docs[0].data().editHistory, historyEntry]
        : [historyEntry]
    };
    
    // If category is null, remove the category field
    if (category === null) {
      updateData.category = null;
    } else {
      updateData.category = category;
    }
    
    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error(`Error updating note category ${noteId}:`, error);
    throw error;
  }
};

/**
 * Update a note's tags
 */
export const updateNoteTags = async (noteId: number, tags: string[]): Promise<string[]> => {
  try {
    // Find the document by note ID
    const notesRef = collection(db, 'notes');
    const q = query(notesRef, where("id", "==", noteId));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      throw new Error(`Note with ID ${noteId} not found`);
    }
    
    const docRef = doc(db, 'notes', snapshot.docs[0].id);
    
    // Add to edit history
    const historyEntry = {
      timestamp: new Date(),
      editType: 'tags'
    };
    
    await updateDoc(docRef, {
      tags,
      updatedAt: serverTimestamp(),
      "editHistory": snapshot.docs[0].data().editHistory
        ? [...snapshot.docs[0].data().editHistory, historyEntry]
        : [historyEntry]
    });
    
    return tags;
  } catch (error) {
    console.error(`Error updating note tags ${noteId}:`, error);
    throw error;
  }
};

/**
 * Update note data with arbitrary fields
 */
export const updateNoteData = async (noteId: number, updates: Partial<Note>): Promise<void> => {
  try {
    // Find the document by note ID
    const notesRef = collection(db, 'notes');
    const q = query(notesRef, where("id", "==", noteId));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      throw new Error(`Note with ID ${noteId} not found`);
    }

    const docRef = doc(db, 'notes', snapshot.docs[0].id);
    const currentData = snapshot.docs[0].data();
    
    // Prepare update object with timestamp
    const updateData: any = {
      ...updates,
      updatedAt: serverTimestamp()
    };
    
    // If content is being updated, calculate word count
    if (updates.content !== undefined) {
      updateData.wordCount = countWords(updates.content);
    }

    // Handle edit history if provided in updates
    if (updates.editHistory !== undefined) {
      // Use the provided history (already pruned by the service)
      updateData.editHistory = updates.editHistory;
    } else if (updates.content !== undefined) {
      // Auto-create history entry for content updates if not provided
      const historyEntry = {
        timestamp: new Date(),
        editType: 'update',
        contentLength: updates.content.length,
        contentSnapshot: updates.content.length > 100 ? updates.content : undefined
      };
      
      const existingHistory = currentData?.editHistory || [];
      updateData.editHistory = [historyEntry, ...existingHistory].slice(0, 20); // Keep last 20
    }
    
    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error(`Error updating note data ${noteId}:`, error);
    throw error;
  }
};
