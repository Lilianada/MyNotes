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
 * Get the appropriate collection reference based on user type
 * For admins: use top-level 'notes' collection
 * For regular users: use subcollection 'users/{userId}/notes'
 */
function getNotesCollectionRef(userId: string, isAdmin: boolean) {
  if (isAdmin) {
    return collection(db, 'notes');
  } else {
    return collection(db, 'users', userId, 'notes');
  }
}

/**
 * Update a category across all notes
 */
export const updateCategory = async (category: NoteCategory, userId: string, isAdmin: boolean = false): Promise<boolean> => {
  try {
    if (!isAdmin && !userId) {
      throw new Error('User ID is required for non-admin operations');
    }

    // Find all notes with this category ID
    const notesRef = getNotesCollectionRef(userId, isAdmin);
    const q = query(notesRef, where("category.id", "==", category.id));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return true; // No notes with this category
    }
    
    // Create a batch to update all notes
    const batch = writeBatch(db);
    
    snapshot.docs.forEach(docSnapshot => {
      const collectionPath = isAdmin ? 'notes' : `users/${userId}/notes`;
      const docRef = doc(db, collectionPath, docSnapshot.id);
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
export const updateTagAcrossNotes = async (oldTag: string, newTag: string, userId: string, isAdmin: boolean = false): Promise<boolean> => {
  try {
    if (!isAdmin && !userId) {
      throw new Error('User ID is required for non-admin operations');
    }

    // Find all notes with this tag
    const notesRef = getNotesCollectionRef(userId, isAdmin);
    const q = query(notesRef, where("tags", "array-contains", oldTag));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return true; // No notes with this tag
    }
    
    // Create a batch to update all notes
    const batch = writeBatch(db);
    
    snapshot.docs.forEach(docSnapshot => {
      const collectionPath = isAdmin ? 'notes' : `users/${userId}/notes`;
      const docRef = doc(db, collectionPath, docSnapshot.id);
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
