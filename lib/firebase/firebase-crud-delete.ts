import { 
  collection, 
  doc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  deleteField,
  query, 
  where
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Firebase delete operations for notes
 */
export class FirebaseCRUDDelete {
  
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
            await FirebaseCRUDDelete.deleteNote(id);
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
