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

// Helper function to create a slug from a title
const createSlugFromTitle = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // Remove non-word chars
    .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, "") // Trim hyphens from start and end
    || "untitled"; // Fallback for empty titles
};

// Get a unique slug by appending a number if necessary
const getUniqueSlug = async (baseSlug: string): Promise<string> => {
  // Check if a note with this slug already exists
  const notesRef = collection(db, 'notes');
  const q = query(notesRef, where("slug", "==", baseSlug));
  const snapshot = await getDocs(q);
  
  // If no document exists with this slug, it's unique
  if (snapshot.empty) {
    return baseSlug;
  }
  
  // Otherwise, append a number to make it unique
  let counter = 1;
  let newSlug = `${baseSlug}-${counter}`;
  
  // Keep checking until we find a unique slug
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

// Convert Firestore timestamp to Date
const convertTimestamp = (timestamp: any): Date => {
  if (!timestamp) return new Date();
  
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  
  return new Date(timestamp);
};

export const firebaseNotesService = {
  // Get all notes
  async getNotes(userId: string): Promise<Note[]> {
    try {
      const notesRef = collection(db, 'notes');
      const q = query(notesRef, where("userId", "==", userId));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: data.id, // Use the numeric ID stored in the document
          content: data.content || "",
          noteTitle: data.noteTitle || "Untitled",
          createdAt: convertTimestamp(data.createdAt),
          filePath: data.filePath || undefined,
          slug: data.slug || createSlugFromTitle(data.noteTitle || "Untitled-note")
        };
      });
    } catch (error) {
      console.error('Error getting notes:', error);
      throw error;
    }
  },

  // Add a new note
  async addNote(userId: string, noteTitle: string): Promise<Note> {
    try {
      // Generate a numeric ID for the note
      const numericId = Date.now();
      
      // Create a slug from the note title for the document ID
      const baseSlug = createSlugFromTitle(noteTitle);
      const slug = await getUniqueSlug(baseSlug);
      
      const noteData = {
        id: numericId, // Store the numeric ID in the document
        content: "",
        noteTitle,
        createdAt: serverTimestamp(),
        filePath: `notes/${slug}.md`, // Example file path
        userId,
        slug
      };
      
      // Create document with slug as the document ID
      const docRef = doc(db, 'notes', slug);
      await setDoc(docRef, noteData);
      
      return {
        id: numericId, // Return the numeric ID as part of the Note
        content: noteData.content,
        noteTitle: noteData.noteTitle,
        createdAt: new Date(),
        filePath: noteData.filePath || undefined,
        slug: noteData.slug
      };
    } catch (error) {
      console.error('Error adding note:', error);
      throw new Error(`Failed to create note: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  // Update a note's content
  async updateNoteContent(noteId: number, content: string): Promise<void> {
    try {
      // Find the document by numeric ID
      const notesRef = collection(db, 'notes');
      const q = query(notesRef, where("id", "==", noteId));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        throw new Error(`Note with ID ${noteId} not found`);
      }
      
      // Update the first matching document
      const docRef = doc(db, 'notes', snapshot.docs[0].id);
      await updateDoc(docRef, { content });
    } catch (error) {
      console.error('Error updating note content:', error);
      throw new Error(`Failed to update note content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
  
  // Update a note's title
  async updateNoteTitle(noteId: number, noteTitle: string): Promise<void> {
    try {
      // Find the document by numeric ID
      const notesRef = collection(db, 'notes');
      const q = query(notesRef, where("id", "==", noteId));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        throw new Error(`Note with ID ${noteId} not found`);
      }
      
      // Generate new slug from updated title
      const baseSlug = createSlugFromTitle(noteTitle);
      const newSlug = await getUniqueSlug(baseSlug);
      
      const oldDocRef = doc(db, 'notes', snapshot.docs[0].id);
      const oldData = snapshot.docs[0].data();
      
      // Create new document with updated slug
      const newDocRef = doc(db, 'notes', newSlug);
      await setDoc(newDocRef, {
        ...oldData,
        noteTitle,
        slug: newSlug
      });
      
      // Delete the old document
      await deleteDoc(oldDocRef);
    } catch (error) {
      console.error('Error updating note title:', error);
      throw new Error(`Failed to update note title: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
  
  // Delete a note
  async deleteNote(noteId: number): Promise<void> {
    try {
      // Find the document by numeric ID
      const notesRef = collection(db, 'notes');
      const q = query(notesRef, where("id", "==", noteId));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        throw new Error(`Note with ID ${noteId} not found`);
      }
      
      // Delete the document
      const docRef = doc(db, 'notes', snapshot.docs[0].id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting note:', error);
      throw new Error(`Failed to delete note: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};