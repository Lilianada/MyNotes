import { db } from '../firebase/firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  deleteDoc, 
  query, 
  where,
  writeBatch,
  getDoc
} from 'firebase/firestore';
import { decrementStorage } from './firebase-storage';
import { calculateNoteSize } from '../storage/storage-utils';

/**
 * Delete a note by ID
 */
export const deleteNote = async (noteId: number, userId?: string, isAdmin: boolean = false): Promise<{ success: boolean, error?: string }> => {
  try {
    // For non-admin users, userId is required for subcollection access
    if (!isAdmin && !userId) {
      return { success: false, error: 'User ID is required for non-admin users' };
    }
    
    // Get the appropriate collection reference
    const notesRef = getNotesCollectionRef(userId, isAdmin);
    
    const q = query(notesRef, where("id", "==", noteId));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return { success: false, error: 'Note not found' };
    }
    
    // Get note data for storage tracking
    const noteData = snapshot.docs[0].data();
    const noteFileSize = noteData.fileSize || 0;
    
    // Get document reference
    const docRef = doc(notesRef, snapshot.docs[0].id);
    
    // Delete the document
    await deleteDoc(docRef);
    
    // Update storage tracking for non-admin users
    if (!isAdmin && userId && noteFileSize > 0) {
      try {
        await decrementStorage(userId, noteFileSize);
      } catch (storageError) {
        console.error('Error updating storage tracking:', storageError);
        // Don't fail the deletion if storage tracking fails
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error(`Error deleting note ${noteId}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

/**
 * Delete multiple notes by ID
 */
export const deleteMultipleNotes = async (noteIds: number[], userId?: string, isAdmin: boolean = false): Promise<{ successful: number[], failed: { id: number, error: string }[] }> => {
  const successful: number[] = [];
  const failed: { id: number, error: string }[] = [];
  
  try {
    // For non-admin users, userId is required for subcollection access
    if (!isAdmin && !userId) {
      return { 
        successful: [], 
        failed: noteIds.map(id => ({ id, error: 'User ID is required for non-admin users' }))
      };
    }
    
    const batch = writeBatch(db);
    
    // Get the appropriate collection reference
    const notesRef = getNotesCollectionRef(userId, isAdmin);
    
    let totalStorageDecrement = 0;
    let notesFound: number[] = [];
    
    // For each note ID, find the corresponding document and add to batch
    for (const noteId of noteIds) {
      try {
        const q = query(notesRef, where("id", "==", noteId));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          const noteData = snapshot.docs[0].data();
          const noteFileSize = noteData.fileSize || 0;
          totalStorageDecrement += noteFileSize;
          
          const docRef = doc(notesRef, snapshot.docs[0].id);
          batch.delete(docRef);
          notesFound.push(noteId);
        } else {
          failed.push({ id: noteId, error: 'Note not found' });
        }
      } catch (error) {
        failed.push({ 
          id: noteId, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }
    
    // Only commit if we have notes to delete
    if (notesFound.length > 0) {
      await batch.commit();
      successful.push(...notesFound);
      
      // Update storage tracking for non-admin users
      if (!isAdmin && userId && totalStorageDecrement > 0) {
        try {
          await decrementStorage(userId, totalStorageDecrement);
        } catch (storageError) {
          console.error('Error updating storage tracking:', storageError);
          // Don't fail the deletion if storage tracking fails
        }
      }
    }
    
    return { successful, failed };
  } catch (error) {
    console.error(`Error batch deleting notes:`, error);
    // Mark all notes as failed if batch operation fails
    noteIds.forEach(id => {
      if (!successful.includes(id) && !failed.find(f => f.id === id)) {
        failed.push({ 
          id, 
          error: error instanceof Error ? error.message : 'Batch operation failed' 
        });
      }
    });
    return { successful, failed };
  }
};

/**
 * Bulk delete notes (alias for deleteMultipleNotes)
 */
export const bulkDeleteNotes = deleteMultipleNotes;

/**
 * Get the appropriate notes collection reference based on user type
 */
const getNotesCollectionRef = (userId?: string, isAdmin: boolean = false) => {
  if (isAdmin) {
    return collection(db, 'notes');
  } else {
    if (!userId) {
      throw new Error('User ID is required for non-admin users');
    }
    return collection(db, 'users', userId, 'notes');
  }
};

/**
 * Delete a category by ID (removes from all notes)
 */
export const deleteCategory = async (categoryId: string, userId?: string, isAdmin: boolean = false): Promise<boolean> => {
  try {
    // For non-admin users, userId is required for subcollection access
    if (!isAdmin && !userId) {
      console.error('User ID is required for non-admin users');
      return false;
    }
    
    // Get the appropriate collection reference
    const notesRef = getNotesCollectionRef(userId, isAdmin);
    
    // Find all notes with this category
    const q = query(notesRef, where("category.id", "==", categoryId));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return true; // No notes with this category
    }
    
    // Create a batch to update all notes
    const batch = writeBatch(db);
    
    snapshot.docs.forEach(docSnapshot => {
      const docRef = doc(notesRef, docSnapshot.id);
      // Set category to null for all affected notes
      batch.update(docRef, { category: null });
    });
    
    // Commit the batch
    await batch.commit();
    
    return true;
  } catch (error) {
    console.error(`Error deleting category ${categoryId}:`, error);
    return false;
  }
};

/**
 * Remove tag from all notes
 */
export const deleteTagFromAllNotes = async (tag: string, userId?: string, isAdmin: boolean = false): Promise<boolean> => {
  try {
    // For non-admin users, userId is required for subcollection access
    if (!isAdmin && !userId) {
      console.error('User ID is required for non-admin users');
      return false;
    }
    
    // Get the appropriate collection reference
    const notesRef = getNotesCollectionRef(userId, isAdmin);
    
    // Find all notes with this tag
    const q = query(notesRef, where("tags", "array-contains", tag));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return true; // No notes with this tag
    }
    
    // Create a batch to update all notes
    const batch = writeBatch(db);
    
    snapshot.docs.forEach(docSnapshot => {
      const docRef = doc(notesRef, docSnapshot.id);
      const data = docSnapshot.data();
      
      // Remove the tag from the array
      const updatedTags = data.tags.filter((t: string) => t !== tag);
      
      batch.update(docRef, { tags: updatedTags });
    });
    
    // Commit the batch
    await batch.commit();
    
    return true;
  } catch (error) {
    console.error(`Error removing tag ${tag} from all notes:`, error);
    return false;
  }
};
