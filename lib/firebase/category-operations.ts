import { NoteCategory } from '@/types';
import { db } from '../firebase/firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  updateDoc, 
  query, 
  where,
  writeBatch
} from 'firebase/firestore';

/**
 * Update a category across all notes
 */
export const updateCategory = async (category: NoteCategory): Promise<boolean> => {
  try {
    // Find all notes with this category ID
    const notesRef = collection(db, 'notes');
    const q = query(notesRef, where("category.id", "==", category.id));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return true; // No notes with this category
    }
    
    // Create a batch to update all notes
    const batch = writeBatch(db);
    
    snapshot.docs.forEach(docSnapshot => {
      const docRef = doc(db, 'notes', docSnapshot.id);
      // Update the category object with the new properties
      batch.update(docRef, { category });
    });
    
    // Commit the batch
    await batch.commit();
    
    return true;
  } catch (error) {
    console.error(`Error updating category ${category.id}:`, error);
    return false;
  }
};

/**
 * Update a tag across all notes
 */
export const updateTagAcrossNotes = async (oldTag: string, newTag: string): Promise<boolean> => {
  try {
    // Find all notes with this tag
    const notesRef = collection(db, 'notes');
    const q = query(notesRef, where("tags", "array-contains", oldTag));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return true; // No notes with this tag
    }
    
    // Create a batch to update all notes
    const batch = writeBatch(db);
    
    snapshot.docs.forEach(docSnapshot => {
      const docRef = doc(db, 'notes', docSnapshot.id);
      const data = docSnapshot.data();
      
      // Replace the tag in the array
      const updatedTags = data.tags.map((t: string) => t === oldTag ? newTag : t);
      
      batch.update(docRef, { tags: updatedTags });
    });
    
    // Commit the batch
    await batch.commit();
    
    return true;
  } catch (error) {
    console.error(`Error updating tag ${oldTag} to ${newTag}:`, error);
    return false;
  }
};
