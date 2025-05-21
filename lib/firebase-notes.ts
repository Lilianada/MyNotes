import { Note, NoteCategory, NoteEditHistory } from '@/types';
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
  Timestamp,
  addDoc,
  collectionGroup
} from 'firebase/firestore';
import { countWords } from './word-count';

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
          updatedAt: data.updatedAt ? convertTimestamp(data.updatedAt) : undefined,
          filePath: data.filePath || undefined,
          slug: data.slug || "",
          category: data.category || undefined,
          tags: data.tags || [],
          parentId: data.parentId !== undefined ? data.parentId : null,
          linkedNoteIds: data.linkedNoteIds || [],
          wordCount: data.wordCount || (data.content ? countWords(data.content) : 0),
          publish: data.publish || false
        };
      });
    } catch (error) {
      // Specifically handle potential cross-origin errors
      if (error instanceof DOMException && error.name === "SecurityError") {
        console.error('Cross-origin security error getting notes:', error);
      } else {
        console.error('Error getting notes:', error);
      }
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
        filePath: `notes/${slug}.md`,
        wordCount: 0
      };
      
      // Create document with slug as the document ID
      const docRef = doc(db, 'notes', slug);
      await setDoc(docRef, noteData);
      
      // Add initial entry to edit history
      const historyRef = collection(db, 'notes', slug, 'history');
      await addDoc(historyRef, {
        timestamp: serverTimestamp(),
        editType: 'create'
      });
      
      return {
        id: numericId,
        content: "",
        noteTitle,
        createdAt: new Date(),
        filePath: noteData.filePath,
        slug,
        wordCount: 0
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
      const wordCount = countWords(content);
      
      await updateDoc(docRef, { 
        content,
        wordCount
      });
      
      // Add entry to edit history
      const historyRef = collection(db, 'notes', snapshot.docs[0].id, 'history');
      await addDoc(historyRef, {
        timestamp: serverTimestamp(),
        editType: 'update'
      });
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
      
      // Get existing history
      const historyRef = collection(db, 'notes', snapshot.docs[0].id, 'history');
      const historySnapshot = await getDocs(historyRef);
      const historyItems = historySnapshot.docs.map(doc => doc.data());
      
      // Create new note document with updated title
      const newDocRef = doc(db, 'notes', newSlug);
      await setDoc(newDocRef, {
        ...oldData,
        noteTitle,
        slug: newSlug,
        filePath
      });
      
      // Add title update to history
      const newHistoryRef = collection(db, 'notes', newSlug, 'history');
      
      // Copy existing history to new document
      for (const item of historyItems) {
        await addDoc(newHistoryRef, item);
      }
      
      // Add title update entry
      await addDoc(newHistoryRef, {
        timestamp: serverTimestamp(),
        editType: 'title'
      });
      
      // Delete old document after migration
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
  },
  
  async updateNoteCategory(id: number, category: NoteCategory | null): Promise<void> {
    try {
      const notesRef = collection(db, 'notes');
      const q = query(notesRef, where("id", "==", id));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        throw new Error(`Note with ID ${id} not found`);
      }
      
      const docRef = doc(db, 'notes', snapshot.docs[0].id);
      
      if (category) {
        await updateDoc(docRef, { category });
      } else {
        // Remove category if null
        await updateDoc(docRef, { 
          category: null 
        });
      }
    } catch (error) {
      console.error('Error updating note category:', error);
      throw new Error(`Failed to update note category: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
  
  async getNoteHistory(id: number): Promise<NoteEditHistory[]> {
    try {
      const notesRef = collection(db, 'notes');
      const q = query(notesRef, where("id", "==", id));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        throw new Error(`Note with ID ${id} not found`);
      }
      
      const historyRef = collection(db, 'notes', snapshot.docs[0].id, 'history');
      const historySnapshot = await getDocs(historyRef);
      
      return historySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          timestamp: convertTimestamp(data.timestamp),
          editType: data.editType
        };
      }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      console.error('Error getting note history:', error);
      return [];
    }
  },

  // Update any note data fields
  async updateNoteData(id: number, updatedNote: Note): Promise<void> {
    try {
      const notesRef = collection(db, 'notes');
      const q = query(notesRef, where("id", "==", id));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        throw new Error(`Note with ID ${id} not found`);
      }
      
      const docRef = doc(db, 'notes', snapshot.docs[0].id);
      
      // Process the note to be Firestore-friendly
      const processedNote: Record<string, any> = {};
      
      // Copy primitive fields and handle dates
      Object.entries(updatedNote).forEach(([key, value]) => {
        // Skip undefined values
        if (value === undefined) return;
        
        // Convert Date objects to Firestore timestamps
        if (value instanceof Date) {
          processedNote[key] = Timestamp.fromDate(value);
        } 
        // Handle category specifically
        else if (key === 'category') {
          // If null, explicitly set to null (don't skip)
          if (value === null) {
            processedNote[key] = null;
          } 
          // If valid category object, include it
          else if (value && typeof value === 'object') {
            processedNote[key] = value;
          }
          // If undefined, don't include
        } 
        // Copy other values directly
        else {
          processedNote[key] = value;
        }
      });
      
      // Update the document with the processed note data
      await updateDoc(docRef, processedNote);
      
      // Add to history
      const historyRef = collection(db, 'notes', snapshot.docs[0].id, 'history');
      await addDoc(historyRef, {
        timestamp: serverTimestamp(),
        editType: 'update'
      });
      
      console.log('Successfully updated note data in Firebase', { id, processedNote });
    } catch (error) {
      console.error('Error updating note data:', error);
      throw new Error(`Failed to update note data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  // Get a specific note by ID
  async getNote(id: number): Promise<Note | null> {
    try {
      const notesRef = collection(db, 'notes');
      const q = query(notesRef, where("id", "==", id));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return null;
      }
      
      const data = snapshot.docs[0].data();
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
        publish: data.publish || false
      };
    } catch (error) {
      console.error('Error getting note:', error);
      return null;
    }
  },

  // Get all child notes for a parent note ID
  async getChildNotes(userId: string, parentId: number): Promise<Note[]> {
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
          publish: data.publish || false
        };
      });
    } catch (error) {
      console.error('Error getting child notes:', error);
      return [];
    }
  },
};