import { Note, NoteCategory, NoteEditHistory } from '@/types';
import { db } from '../firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  deleteField,
  serverTimestamp, 
  query, 
  where, 
  addDoc
} from 'firebase/firestore';
import { countWords } from '../word-count';
import { generateUniqueId, calculateNoteSize } from '../storage-utils';
import { 
  createSlugFromTitle, 
  getUniqueSlug, 
  convertTimestamp, 
  convertEditHistory 
} from './helpers';

/**
 * Get the appropriate collection name based on user type
 */
function getNotesCollection(isAdmin: boolean): string {
  return isAdmin ? 'notes' : 'userNotes';
}

/**
 * Retrieve all notes for a user
 */
export const getNotes = async (userId: string, isAdmin: boolean = false): Promise<Note[]> => {
  try {
    const collectionName = getNotesCollection(isAdmin);
    const notesRef = collection(db, collectionName);
    const q = query(notesRef, where("userId", "==", userId));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      const note: Note = {
        id: data.id, 
        uniqueId: data.uniqueId || generateUniqueId(), // Ensure all notes have unique IDs
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
        editHistory: data.editHistory ? convertEditHistory(data.editHistory) : [],
        archived: data.archived || false,
        fileSize: data.fileSize || calculateNoteSize(data as Note)
      };
      return note;
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
};

/**
 * Create a new note
 */
export const addNote = async (userId: string, noteTitle: string, isAdmin: boolean = false): Promise<Note> => {
  try {
    // Generate a numeric ID and unique ID for the note
    const numericId = Date.now();
    const uniqueId = generateUniqueId();
    
    // Create a slug from the note title for the document ID
    const baseSlug = createSlugFromTitle(noteTitle);
    const collectionName = getNotesCollection(isAdmin);
    const slug = await getUniqueSlug(baseSlug, collectionName);
    
    // Create initial history entry
    const initialHistory = [{
      timestamp: new Date(),
      editType: 'create'
    }];

    const noteData = {
      id: numericId,
      uniqueId,
      content: "",
      noteTitle,
      createdAt: serverTimestamp(),
      userId,
      slug,
      filePath: `notes/${slug}.md`,
      wordCount: 0,
      editHistory: initialHistory,
      archived: false,
      fileSize: 0 // Will be calculated and updated below
    };
    
    // Calculate file size for the actual note object
    const tempNote: Note = {
      id: numericId,
      uniqueId,
      content: "",
      noteTitle,
      createdAt: new Date(),
      slug,
      wordCount: 0,
      tags: [],
      editHistory: initialHistory as NoteEditHistory[],
      archived: false
    };
    
    const fileSize = calculateNoteSize(tempNote);
    noteData.fileSize = fileSize;
    
    // Create document with slug as the document ID
    const docRef = doc(db, collectionName, slug);
    await setDoc(docRef, noteData);
    
    return {
      ...tempNote,
      filePath: noteData.filePath,
      fileSize
    };
  } catch (error) {
    console.error('Error adding note:', error);
    throw error;
  }
};

/**
 * Get a single note by ID
 */
export const getNote = async (noteId: number): Promise<Note | null> => {
  try {
    const notesRef = collection(db, 'notes');
    const q = query(notesRef, where("id", "==", noteId));
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
      description: data.description || "",
      editHistory: data.editHistory ? convertEditHistory(data.editHistory) : []
    };
  } catch (error) {
    console.error('Error getting note by ID:', error);
    return null;
  }
};

/**
 * Get child notes for a given parent note
 */
export const getChildNotes = async (userId: string, parentId: number): Promise<Note[]> => {
  try {
    const notesRef = collection(db, 'notes');
    const q = query(
      notesRef, 
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
        description: data.description || "",
        editHistory: data.editHistory ? convertEditHistory(data.editHistory) : []
      };
    });
  } catch (error) {
    console.error('Error getting child notes:', error);
    return [];
  }
};
