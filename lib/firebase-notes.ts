import { Note } from '@/types';
import { db } from './firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp, 
  query, 
  where, 
  Timestamp 
} from 'firebase/firestore';

// Helper functions
const createSlugFromTitle = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") 
    .replace(/[\s_-]+/g, "-") 
    .replace(/^-+|-+$/g, "") 
    || "untitled"; 
};

const getUniqueSlug = async (baseSlug: string): Promise<string> => {
  const notesRef = collection(db, 'notes');
  const q = query(notesRef, where("slug", "==", baseSlug));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    return baseSlug;
  }
  
  let counter = 1;
  let newSlug = `${baseSlug}-${counter}`;
  
  while (true) {
    const q = query(notesRef, where("slug", "==", newSlug));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return newSlug;
    }
    
    counter++;
    newSlug = `${baseSlug}-${counter}`;
  }
};

const convertTimestamp = (timestamp: any): Date => {
  if (!timestamp) return new Date();
  
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  
  return new Date(timestamp);
};

// Export as a named export, not default export
export const firebaseNotesService = {
  async getNotes(userId: string): Promise<Note[]> {
    try {
      const notesRef = collection(db, 'notes');
      const q = query(notesRef, where("userId", "==", userId));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: data.id, 
          content: data.content || "",
          noteTitle: data.noteTitle || "Untitled",
          createdAt: convertTimestamp(data.createdAt),
          filePath: data.filePath || undefined,
          slug: data.slug || ""
        };
      });
    } catch (error) {
      console.error('Error getting notes:', error);
      return []; // Return empty array on error
    }
  },

  async addNote(userId: string, noteTitle: string): Promise<Note> {
    try {
      // Generate a numeric ID for the note
      const numericId = Date.now();
      
      // Create a slug from the note title for the document ID
      const baseSlug = createSlugFromTitle(noteTitle);
      const slug = await getUniqueSlug(baseSlug);
      
      const noteData = {
        id: numericId,
        content: "",
        noteTitle,
        createdAt: serverTimestamp(),
        userId,
        slug,
        filePath: `notes/${slug}.md`
      };
      
      // Create document with slug as the document ID
      const docRef = doc(db, 'notes', slug);
      await setDoc(docRef, noteData);
      
      return {
        id: numericId,
        content: "",
        noteTitle,
        createdAt: new Date(),
        filePath: noteData.filePath,
        slug
      };
    } catch (error) {
      console.error('Error adding note:', error);
      throw new Error(`Failed to create note: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  async updateNoteContent(id: number, content: string): Promise<void> {
    try {
      const notesRef = collection(db, 'notes');
      const q = query(notesRef, where("id", "==", id));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        throw new Error(`Note with ID ${id} not found`);
      }
      
      const docRef = doc(db, 'notes', snapshot.docs[0].id);
      await updateDoc(docRef, { content });
    } catch (error) {
      console.error('Error updating note content:', error);
      throw new Error(`Failed to update note content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
  
  async updateNoteTitle(id: number, noteTitle: string): Promise<string> {
    try {
      const notesRef = collection(db, 'notes');
      const q = query(notesRef, where("id", "==", id));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        throw new Error(`Note with ID ${id} not found`);
      }
      
      const baseSlug = createSlugFromTitle(noteTitle);
      const newSlug = await getUniqueSlug(baseSlug);
      const filePath = `notes/${newSlug}.md`;
      
      const oldDocRef = doc(db, 'notes', snapshot.docs[0].id);
      const oldData = snapshot.docs[0].data();
      
      const newDocRef = doc(db, 'notes', newSlug);
      await setDoc(newDocRef, {
        ...oldData,
        noteTitle,
        slug: newSlug,
        filePath
      });
      
      await deleteDoc(oldDocRef);
      
      return filePath;
    } catch (error) {
      console.error('Error updating note title:', error);
      throw new Error(`Failed to update note title: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
  
  async deleteNote(id: number): Promise<void> {
    try {
      const notesRef = collection(db, 'notes');
      const q = query(notesRef, where("id", "==", id));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        throw new Error(`Note with ID ${id} not found`);
      }
      
      const docRef = doc(db, 'notes', snapshot.docs[0].id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting note:', error);
      throw new Error(`Failed to delete note: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};