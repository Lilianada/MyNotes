import { Note, NoteCategory, NoteEditHistory } from '@/types';
import { db, auth } from './firebase';
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

// Convert Firebase history entries to typed NoteEditHistory objects
const convertEditHistory = (history: any[]): NoteEditHistory[] => {
  if (!history || !Array.isArray(history)) return [];
  
  return history.map(entry => ({
    timestamp: convertTimestamp(entry.timestamp),
    editType: entry.editType
  }));
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
          publish: data.publish || false,
          editHistory: data.editHistory ? convertEditHistory(data.editHistory) : []
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
      
      // Create initial history entry
      const initialHistory = [{
        timestamp: new Date(),  // Use regular Date instead of serverTimestamp in arrays
        editType: 'create'
      }];

      const noteData = {
        id: numericId,
        content: "",
        noteTitle,
        createdAt: serverTimestamp(),
        userId,
        slug,
        filePath: `notes/${slug}.md`,
        wordCount: 0,
        editHistory: initialHistory
      };
      
      // Create document with slug as the document ID
      const docRef = doc(db, 'notes', slug);
      await setDoc(docRef, noteData);
      
      return {
        id: numericId,
        content: "",
        noteTitle,
        createdAt: new Date(),
        filePath: noteData?.filePath,
        slug,
        wordCount: 0,
        editHistory: [{
          timestamp: new Date(),
          editType: 'create'
        }]
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
      
      // Get the current document to access its edit history
      const noteDoc = await getDoc(docRef);
      const noteData = noteDoc.data();
      
      // Create new history entry with regular Date object for arrays
      // Firebase doesn't support serverTimestamp() in arrays
      const newHistoryEntry = {
        timestamp: new Date(),
        editType: 'update'
      };
      
      // Get existing history or create empty array if none exists
      const existingHistory = noteData?.editHistory || [];
      
      // Add new history entry (keeping history limited to most recent 20 entries)
      const updatedHistory = [newHistoryEntry, ...existingHistory].slice(0, 20);
      
      // Update the document with content and new history
      await updateDoc(docRef, { 
        content,
        wordCount,
        updatedAt: serverTimestamp(), // This is fine outside arrays
        editHistory: updatedHistory
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
      
      // Create new history entry with regular Date object for arrays
      // Firebase doesn't support serverTimestamp() in arrays
      const newHistoryEntry = {
        timestamp: new Date(),
        editType: 'title'
      };
      
      // Get existing history or create empty array if none exists
      const existingHistory = oldData.editHistory || [];
      
      // Add new history entry (keeping history limited to most recent 20 entries)
      const updatedHistory = [newHistoryEntry, ...existingHistory].slice(0, 20);
      
      // Create new note document with updated title
      const newDocRef = doc(db, 'notes', newSlug);
      await setDoc(newDocRef, {
        ...oldData,
        noteTitle,
        slug: newSlug,
        filePath,
        updatedAt: serverTimestamp(),
        editHistory: updatedHistory
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
      
      // Get the current document to access its edit history
      const noteDoc = await getDoc(docRef);
      const noteData = noteDoc.data();
      
      // Create new history entry with regular Date object
      const newHistoryEntry = {
        timestamp: new Date(),
        editType: 'category'
      };
      
      // Get existing history or create empty array if none exists
      const existingHistory = noteData?.editHistory || [];
      
      // Add new history entry (keeping history limited to most recent 20 entries)
      const updatedHistory = [newHistoryEntry, ...existingHistory].slice(0, 20);
      
      if (category) {
        await updateDoc(docRef, { 
          category, 
          updatedAt: serverTimestamp(),
          editHistory: updatedHistory
        });
      } else {
        // Remove category if null
        await updateDoc(docRef, { 
          category: null,
          updatedAt: serverTimestamp(),
          editHistory: updatedHistory
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
      
      // Get the note document
      const noteDoc = await getDoc(doc(db, 'notes', snapshot.docs[0].id));
      const noteData = noteDoc.data();
      
      // If the note has no edit history, return an empty array
      if (!noteData?.editHistory || !Array.isArray(noteData?.editHistory)) {
        return [];
      }
      
      // Convert and return the edit history
      return convertEditHistory(noteData?.editHistory);
    } catch (error) {
      console.error('Error getting note history:', error);
      return [];
    }
  },

  async updateNoteTags(id: number, tags: string[]): Promise<string[]> {
    try {
      const notesRef = collection(db, 'notes');
      const q = query(notesRef, where("id", "==", id));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        throw new Error(`Note with ID ${id} not found`);
      }
      
      const docRef = doc(db, 'notes', snapshot.docs[0].id);
      
      // Get the current document to access its edit history
      const noteDoc = await getDoc(docRef);
      const noteData = noteDoc.data();
      
      // Create new history entry
      const newHistoryEntry = {
        timestamp: new Date(),
        editType: 'tags'
      };
      
      // Get existing history or create empty array if none exists
      const existingHistory = noteData?.editHistory || [];
      
      // Add new history entry (keeping history limited to most recent 20 entries)
      const updatedHistory = [newHistoryEntry, ...existingHistory].slice(0, 20);
      
      // Ensure tags are properly cleaned
      const cleanTags = Array.isArray(tags) ? 
        [...tags].filter(Boolean).map(tag => tag.trim().toLowerCase()) : [];
      
      await updateDoc(docRef, { 
        tags: cleanTags,
        updatedAt: serverTimestamp(),
        editHistory: updatedHistory
      });
      
      // Return the clean tags array so callers have access to the normalized values
      return cleanTags;
    } catch (error) {
      console.error('Error updating note tags:', error);
      throw new Error(`Failed to update note tags: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  async updateNoteData(id: number, updatedNote: Partial<Note>): Promise<void> {
    try {
      const notesRef = collection(db, 'notes');
      const q = query(notesRef, where("id", "==", id));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        throw new Error(`Note with ID ${id} not found`);
      }
      
      const docRef = doc(db, 'notes', snapshot.docs[0].id);
      const currentDoc = await getDoc(docRef);
      const currentData = currentDoc.data();
      
      // Determine edit type based on what fields are being updated
      let editType: NoteEditHistory['editType'] = 'update';
      if (updatedNote.noteTitle !== undefined) editType = 'title';
      else if (updatedNote.tags !== undefined) editType = 'tags';
      else if (updatedNote.category !== undefined) editType = 'category';
      
      // Create new history entry
      const newHistoryEntry = {
        timestamp: new Date(),
        editType
      };
      
      // Get existing history or create empty array if none exists
      const existingHistory = currentData?.editHistory || [];
      
      // Add new history entry (keeping history limited to most recent 20 entries)
      const updatedHistory = [newHistoryEntry, ...existingHistory].slice(0, 20);
      
      // Special handling for tags - ensure it's always an array
      const cleanData: Record<string, any> = {};
      
      // Process each field for Firestore
      if (updatedNote.noteTitle !== undefined) cleanData.noteTitle = updatedNote.noteTitle;
      if (updatedNote.content !== undefined) cleanData.content = updatedNote.content;
      if (updatedNote.category !== undefined) cleanData.category = updatedNote.category;
      if (updatedNote.parentId !== undefined) cleanData.parentId = updatedNote.parentId;
      
      // Special handling for tags - make a direct copy
      if (updatedNote.tags !== undefined) {
        cleanData.tags = Array.isArray(updatedNote.tags) ? [...updatedNote.tags] : [];
        console.log(`[FIREBASE] Setting tags for note ${id} to:`, JSON.stringify(cleanData.tags));
      }
      
      // Handle linked notes
      if (updatedNote.linkedNoteIds !== undefined) {
        cleanData.linkedNoteIds = Array.isArray(updatedNote.linkedNoteIds) ? 
          [...updatedNote.linkedNoteIds] : [];
      }
      
      // Update the document with new data and history
      await updateDoc(docRef, {
        ...cleanData,
        updatedAt: serverTimestamp(),
        editHistory: updatedHistory
      });
      
      console.log(`[FIREBASE] Note ${id} updated successfully in Firestore`);
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
        publish: data.publish || false,
        editHistory: data.editHistory ? convertEditHistory(data.editHistory) : []
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
          publish: data.publish || false,
          editHistory: data.editHistory ? convertEditHistory(data.editHistory) : []
        };
      });
    } catch (error) {
      console.error('Error getting child notes:', error);
      return [];
    }
  },
};

export default firebaseNotesService;
