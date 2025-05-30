import { db } from '../firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  deleteDoc, 
  query, 
  where,
  writeBatch
} from 'firebase/firestore';

/**
 * Delete a note by ID
 */
export const deleteNote = async (noteId: number): Promise<boolean> => {
  try {
    // Find the document by note ID
    const notesRef = collection(db, 'notes');
    const q = query(notesRef, where("id", "==", noteId));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return false;
    }
    
    // Get document reference
    const docRef = doc(db, 'notes', snapshot.docs[0].id);
    
    // Delete the document
    await deleteDoc(docRef);
    
    return true;
  } catch (error) {
    console.error(`Error deleting note ${noteId}:`, error);
    return false;
  }
};

/**
 * Delete multiple notes by ID
 */
export const deleteMultipleNotes = async (noteIds: number[]): Promise<boolean> => {
  try {
    const batch = writeBatch(db);
    const notesRef = collection(db, 'notes');
    
    // For each note ID, find the corresponding document and add to batch
    for (const noteId of noteIds) {
      const q = query(notesRef, where("id", "==", noteId));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const docRef = doc(db, 'notes', snapshot.docs[0].id);
        batch.delete(docRef);
      }
    }
    
    // Commit the batch
    await batch.commit();
    
    return true;
  } catch (error) {
    console.error(`Error batch deleting notes:`, error);
    return false;
  }
};

/**
 * Bulk delete notes (alias for deleteMultipleNotes)
 */
export const bulkDeleteNotes = deleteMultipleNotes;

/**
 * Delete a category by ID (removes from all notes)
 */
export const deleteCategory = async (categoryId: string): Promise<boolean> => {
  try {
    // Find all notes with this category
    const notesRef = collection(db, 'notes');
    const q = query(notesRef, where("category.id", "==", categoryId));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return true; // No notes with this category
    }
    
    // Create a batch to update all notes
    const batch = writeBatch(db);
    
    snapshot.docs.forEach(docSnapshot => {
      const docRef = doc(db, 'notes', docSnapshot.id);
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
export const deleteTagFromAllNotes = async (tag: string): Promise<boolean> => {
  try {
    // Find all notes with this tag
    const notesRef = collection(db, 'notes');
    const q = query(notesRef, where("tags", "array-contains", tag));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return true; // No notes with this tag
    }
    
    // Create a batch to update all notes
    const batch = writeBatch(db);
    
    snapshot.docs.forEach(docSnapshot => {
      const docRef = doc(db, 'notes', docSnapshot.id);
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
