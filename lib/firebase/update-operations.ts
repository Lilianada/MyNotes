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
  getDoc,
  setDoc,
  deleteDoc
} from 'firebase/firestore';
import { createSlugFromTitle, getUniqueSlug } from './firebase-helpers';
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
    
    // Note: Edit history is now managed by EditHistoryService, not added here directly
    // This prevents excessive history entries and Firestore writes
    
    // Prepare update data
    const updateData = {
      content,
      updatedAt: serverTimestamp(),
      wordCount,
      fileSize: newFileSize
      // editHistory is intentionally omitted - managed by EditHistoryService
    };
    
    // Sanitize before sending to Firebase
    const sanitizedUpdateData = sanitizeForFirebase(updateData);
    // Re-add serverTimestamp since it gets processed by sanitization
    sanitizedUpdateData.updatedAt = serverTimestamp();
    
    await updateDoc(docRef, sanitizedUpdateData);
    
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
    const oldDocSnap = snapshot.docs[0];
    const oldDocRef = doc(notesRef, oldDocSnap.id);
    const currentData = oldDocSnap.data();

    // Generate slug from new title using the proper helper function
    const baseSlug = createSlugFromTitle(newTitle);
    const slug = await getUniqueSlug(baseSlug);
    // Generate file path based on the new slug
    const filePath = `notes/${slug}`;
    console.log(`Updating note ${noteId} with new filePath: ${filePath}`);
    // Note: Edit history is now managed by EditHistoryService, not added here directly
    // This prevents excessive history entries and Firestore writes

    // If the slug (doc ID) does NOT change, just update as before
    if (slug === currentData.slug) {
      const updateData = {
        noteTitle: newTitle,
        slug: slug,
        filePath: filePath, // Ensure filePath is updated even if slug doesn't change
        updatedAt: serverTimestamp()
        // editHistory is intentionally omitted - managed by EditHistoryService
      };
      const sanitizedUpdateData = sanitizeForFirebase(updateData);
      sanitizedUpdateData.updatedAt = serverTimestamp();
      await updateDoc(oldDocRef, sanitizedUpdateData);
      console.log(`Updated note in place with filePath: ${filePath}`);
      return;
    }

    // Otherwise, perform Firestore document rename (copy + delete)
    // Create new doc with new slug as ID
    const newDocRef = doc(notesRef, slug);
    
    // Prepare new data - only change the specific fields we need to update
    // This preserves all other properties including createdAt
    const newDocData = {
      ...currentData,
      noteTitle: newTitle,  // Update the title
      slug,                // Update the slug
      filePath: `notes/${slug}`,  // Explicitly set filePath based on new slug
      updatedAt: serverTimestamp() // Update the timestamp
      // All other properties remain unchanged
      // editHistory is preserved from the old document
    };
    
    console.log(`Document rename: Setting filePath to notes/${slug}`);
    
    // Sanitize data before sending to Firestore
    const sanitizedData = sanitizeForFirebase(newDocData);
    // Re-add serverTimestamp since it gets processed by sanitization
    sanitizedData.updatedAt = serverTimestamp();
    
    // Write new doc - always use setDoc for new document creation
    await setDoc(newDocRef, sanitizedData);
    
    // Delete old doc after successful creation of new doc
    await deleteDoc(oldDocRef);

    // Recalculate user storage to ensure stats are correct
    if (!isAdmin && userId) {
      try {
        const { recalculateUserStorage } = await import('./firebase-storage');
        await recalculateUserStorage(userId, false);
      } catch (err) {
        console.error('Error recalculating user storage after rename:', err);
      }
    }
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
    
    // Sanitize before sending to Firebase
    const sanitizedUpdateData = sanitizeForFirebase(updateData);
    // Re-add serverTimestamp since it gets processed by sanitization
    sanitizedUpdateData.updatedAt = serverTimestamp();
    
    await updateDoc(docRef, sanitizedUpdateData);
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
    
    const updateData = {
      tags,
      updatedAt: serverTimestamp()
    };
    
    // Sanitize before sending to Firebase
    const sanitizedUpdateData = sanitizeForFirebase(updateData);
    // Re-add serverTimestamp since it gets processed by sanitization
    sanitizedUpdateData.updatedAt = serverTimestamp();
    
    await updateDoc(docRef, sanitizedUpdateData);
    
    return tags;
  } catch (error) {
    console.error(`Error updating note tags ${noteId}:`, error);
    throw error;
  }
};

/**
 * Recursively remove undefined values from an object to prevent Firebase errors
 */
function sanitizeForFirebase(obj: any): any {
  if (obj === null || obj === undefined) {
    return null;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForFirebase(item)).filter(item => item !== undefined);
  }
  
  if (typeof obj === 'object') {
    const cleaned: any = {};
    Object.keys(obj).forEach(key => {
      const value = sanitizeForFirebase(obj[key]);
      if (value !== undefined) {
        cleaned[key] = value;
      }
    });
    return cleaned;
  }
  
  return obj;
}

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
    
    // Prepare update object with timestamp
    const updateData: any = {
      updatedAt: serverTimestamp()
    };
    
    // Only add defined values from updates to avoid undefined values in Firestore
    // Explicitly exclude createdAt to prevent it from being modified during updates
    Object.keys(updates).forEach(key => {
      if (key !== 'createdAt') { // Protect createdAt from being modified
        const value = (updates as any)[key];
        if (value !== undefined) {
          updateData[key] = value;
        }
      }
    });
    
    // If content is being updated, calculate word count
    if (updates.content !== undefined) {
      const wordCount = countWords(updates.content);
      if (wordCount !== undefined) {
        updateData.wordCount = wordCount;
      }
    }

    // Handle edit history if provided in updates
    if (updates.editHistory !== undefined) {
      // Sanitize edit history to remove any undefined values
      updateData.editHistory = sanitizeForFirebase(updates.editHistory);
    }
    
    // Final sanitization pass to ensure no undefined values slip through
    const sanitizedUpdateData = sanitizeForFirebase(updateData);
    
    // Re-add serverTimestamp since it gets processed by sanitization
    sanitizedUpdateData.updatedAt = serverTimestamp();
    
    await updateDoc(docRef, sanitizedUpdateData);
  } catch (error) {
    console.error(`Error updating note data ${noteId}:`, error);
    throw error;
  }
};
