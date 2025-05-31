import { 
  collection, 
  getDocs, 
  query, 
  where
} from 'firebase/firestore';
import { db } from './firebase';
import { Note } from '@/types';
import { countWords } from '../data-processing/word-count';
import { convertTimestamp, convertEditHistory } from './firebase-helpers';

/**
 * Relationship operations for Firebase notes (parent/child, linked notes)
 */
export class FirebaseRelationshipOperations {
  
  /**
   * Get all child notes for a parent note ID
   */
  static async getChildNotes(userId: string, parentId: number): Promise<Note[]> {
    try {
      const notesRef = collection(db, 'notes');
      const q = query(notesRef, 
        where("userId", "==", userId),
        where("parentId", "==", parentId)
      );
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
      console.error('Error getting child notes:', error);
      return [];
    }
  }
}
