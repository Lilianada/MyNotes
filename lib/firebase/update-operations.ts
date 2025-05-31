import { Note, NoteCategory } from '@/types';
import { db } from '../firebase/firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  updateDoc, 
  serverTimestamp, 
  query, 
  where,
  getDoc
} from 'firebase/firestore';
import { countWords } from '../data-processing/word-count';
import { calculateNoteSize } from '../storage/storage-utils';
import { incrementStorage, decrementStorage } from './firebase-storage';

/**
 * Update a note's content
 */
export const updateNoteContent = async (noteId: number, content: string, userId?: string, isAdmin: boolean = false): Promise<void> => {
  try {
    // For non-admin users, userId is required for subcollection access
    if (!isAdmin && !userId) {
      throw new Error('User ID is required for non-admin users');
    }
    
    // Get the appropriate collection reference
    let notesRef;
    if (isAdmin) {
      notesRef = collection(db, 'notes');
    } else {
      notesRef = collection(db, 'users', userId!, 'notes');
    }
    
    const q = query(notesRef, where("id", "==", noteId));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      throw new Error(`Note with ID ${noteId} not found`);
    }
    
    const docRef = doc(notesRef, snapshot.docs[0].id);
    const currentData = snapshot.docs[0].data();
    
    // Calculate word count and new file size
    const wordCount = countWords(content);
    
    // Create temporary note object for size calculation
    const tempNote: Note = {
      ...currentData,
      content,
      wordCount
    } as Note;
    
    const newFileSize = calculateNoteSize(tempNote);
    const oldFileSize = currentData.fileSize || 0;
    const sizeDifference = newFileSize - oldFileSize;
    
    // Add to edit history with enhanced data
    const historyEntry: any = {
      timestamp: new Date(),
      editType: 'update',
      contentLength: content.length
    };
    
    // Only add contentSnapshot if content is longer than 100 characters
    if (content.length > 100) {
      historyEntry.contentSnapshot = content;
    }
    
    await updateDoc(docRef, {
      content,
      updatedAt: serverTimestamp(),
      wordCount,
      fileSize: newFileSize,
      "editHistory": currentData.editHistory
        ? [...currentData.editHistory, historyEntry]
        : [historyEntry]
    });
    
    // Update storage tracking for non-admin users if file size changed significantly
    if (!isAdmin && userId && Math.abs(sizeDifference) > 100) { // Only track if change is > 100 bytes
      try {
        if (sizeDifference > 0) {
          await incrementStorage(userId, sizeDifference);
        } else {
          await decrementStorage(userId, Math.abs(sizeDifference));
        }
      } catch (storageError) {
        console.error('Error updating storage tracking:', storageError);
        // Don't fail the update if storage tracking fails
      }
    }
  } catch (error) {
    console.error(`Error updating note ${noteId}:`, error);
    throw error;
  }
};

/**
 * Update a note's title
 */
export const updateNoteTitle = async (noteId: number, newTitle: string, userId?: string, isAdmin: boolean = false): Promise<void> => {
  try {
    // For non-admin users, userId is required for subcollection access
    if (!isAdmin && !userId) {
      throw new Error('User ID is required for non-admin users');
    }
    
    // Get the appropriate collection reference
    let notesRef;
    if (isAdmin) {
      notesRef = collection(db, 'notes');
    } else {
      notesRef = collection(db, 'users', userId!, 'notes');
    }
    
    const q = query(notesRef, where("id", "==", noteId));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      throw new Error(`Note with ID ${noteId} not found`);
    }
    
    const docRef = doc(notesRef, snapshot.docs[0].id);
    
    // Note: History is managed by EditHistoryService, not added here
    
    await updateDoc(docRef, {
      noteTitle: newTitle,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error(`Error updating note title ${noteId}:`, error);
    throw error;
  }
};

/**
 * Update a note's category
 */
export const updateNoteCategory = async (noteId: number, category: NoteCategory | null, userId?: string, isAdmin: boolean = false): Promise<void> => {
  try {
    // For non-admin users, userId is required for subcollection access
    if (!isAdmin && !userId) {
      throw new Error('User ID is required for non-admin users');
    }
    
    // Get the appropriate collection reference
    let notesRef;
    if (isAdmin) {
      notesRef = collection(db, 'notes');
    } else {
      notesRef = collection(db, 'users', userId!, 'notes');
    }
    
    const q = query(notesRef, where("id", "==", noteId));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      throw new Error(`Note with ID ${noteId} not found`);
    }
    
    const docRef = doc(notesRef, snapshot.docs[0].id);
    
    // Note: History is managed by EditHistoryService, not added here
    
    const updateData: any = {
      updatedAt: serverTimestamp()
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
export const updateNoteTags = async (noteId: number, tags: string[], userId?: string, isAdmin: boolean = false): Promise<string[]> => {
  try {
    // For non-admin users, userId is required for subcollection access
    if (!isAdmin && !userId) {
      throw new Error('User ID is required for non-admin users');
    }
    
    // Get the appropriate collection reference
    let notesRef;
    if (isAdmin) {
      notesRef = collection(db, 'notes');
    } else {
      notesRef = collection(db, 'users', userId!, 'notes');
    }
    
    const q = query(notesRef, where("id", "==", noteId));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      throw new Error(`Note with ID ${noteId} not found`);
    }
    
    const docRef = doc(notesRef, snapshot.docs[0].id);
    
    // Note: History is managed by EditHistoryService, not added here
    
    await updateDoc(docRef, {
      tags,
      updatedAt: serverTimestamp()
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
export const updateNoteData = async (noteId: number, updates: Partial<Note>, userId?: string, isAdmin: boolean = false): Promise<void> => {
  try {
    // For non-admin users, userId is required for subcollection access
    if (!isAdmin && !userId) {
      throw new Error('User ID is required for non-admin users');
    }
    
    // Get the appropriate collection reference
    let notesRef;
    if (isAdmin) {
      notesRef = collection(db, 'notes');
    } else {
      notesRef = collection(db, 'users', userId!, 'notes');
    }
    
    const q = query(notesRef, where("id", "==", noteId));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      throw new Error(`Note with ID ${noteId} not found`);
    }

    const docRef = doc(notesRef, snapshot.docs[0].id);
    const currentData = snapshot.docs[0].data();
    
    // Prepare update object with timestamp, filtering out undefined values
    const updateData: any = {
      updatedAt: serverTimestamp()
    };
    
    // Only add defined values from updates to avoid undefined values in Firestore
    Object.keys(updates).forEach(key => {
      const value = (updates as any)[key];
      if (value !== undefined) {
        updateData[key] = value;
      }
    });
    
    // If content is being updated, calculate word count
    if (updates.content !== undefined) {
      updateData.wordCount = countWords(updates.content);
    }

    // Handle edit history if provided in updates
    if (updates.editHistory !== undefined) {
      // Use the provided history (already pruned by the service)
      updateData.editHistory = updates.editHistory;
    }
    
    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error(`Error updating note data ${noteId}:`, error);
    throw error;
  }
};
