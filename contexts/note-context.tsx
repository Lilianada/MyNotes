"use client";

import {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";
import { Note, NoteCategory, NoteEditHistory } from "@/types";
import { useAuth } from "@/contexts/auth-context";
import { NoteOperations } from "./note-operations";
import { 
  getMostRecentNote, 
  loadUserNotes, 
  syncLocalToFirebase 
} from "./note-storage";
import { localStorageNotesService } from "@/lib/local-storage-notes";
import { firebaseNotesService } from "@/lib/firebase-notes";

interface NoteContextType {
  notes: Note[];
  selectedNoteId: number | null;
  setNotes: (notes: Note[]) => void;
  addNote: (noteTitle: string) => Promise<Note>;
  updateNote: (id: number, content: string) => void;
  updateNoteTitle: (id: number, title: string) => void;
  updateNoteCategory: (id: number, category: NoteCategory | null) => Promise<void>;
  updateCategory: (category: NoteCategory) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
  getNoteHistory: (id: number) => Promise<NoteEditHistory[]>;
  deleteNote: (id: number) => void;
  selectNote: (id: number | null) => void;
  syncLocalNotesToFirebase: () => Promise<void>;
  // Tags and relationships
  updateNoteTags: (id: number, tags: string[]) => Promise<string[]>;  // Updated to return string[]
  updateTagAcrossNotes: (oldTag: string, newTag: string) => Promise<void>;
  deleteTagFromAllNotes: (tag: string) => Promise<void>;
  updateNoteParent: (id: number, parentId: number | null) => Promise<void>;
  updateNoteLinks: (id: number, linkedNoteIds: number[]) => Promise<void>;
  getChildNotes: (parentId: number) => Note[];
  getLinkedNotes: (noteId: number) => Note[];
}

const NoteContext = createContext<NoteContextType | undefined>(undefined);

export function NoteProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);
  const { user, isAdmin } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  // Initialize notes when the user state changes
  useEffect(() => {
    const initializeNotes = async () => {
      setIsLoading(true);
      try {
        // Load notes from the appropriate storage
        const { loadedNotes, notesLoadedFromStorage, error } = await loadUserNotes(
          isAdmin as boolean,
          user
        );

        // Check for errors
        if (error) {
          console.error("Error loading notes:", error);
          // Show error message to user (could use toast notification here)
        }

        // Handle the loaded notes
        if (loadedNotes.length > 0) {
          setNotes(loadedNotes);
          
          // Always select the most recent note when loading
          try {
            const mostRecentNote = getMostRecentNote(loadedNotes);
            console.log(`Using most recent note: ${mostRecentNote.id}`);
            setSelectedNoteId(mostRecentNote.id);
            
            // Update localStorage with the selected note
            if (typeof window !== 'undefined') {
              localStorage.setItem('lastSelectedNoteId', mostRecentNote.id.toString());
            }
          } catch (noteSelectionError) {
            console.error("Error selecting most recent note:", noteSelectionError);
            // Fallback to selecting the first note
            if (loadedNotes[0]) {
              setSelectedNoteId(loadedNotes[0].id);
            }
          }
        } else {
          // Only check one more time in production before giving up
          if (process.env.NODE_ENV === 'production' && !notesLoadedFromStorage) {
            // Check one more time after a delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Try loading notes one final time
            if (typeof window !== "undefined") {
              const finalCheckNotes = localStorageNotesService.getNotes();
              if (finalCheckNotes.length > 0) {
                setNotes(finalCheckNotes);
                // Select the most recent note
                const mostRecentNote = getMostRecentNote(finalCheckNotes);
                setSelectedNoteId(mostRecentNote.id);
                setIsLoading(false);
                return; // Exit early if we found notes
              }
            }
          }
          
          // We don't have any notes and couldn't find any after multiple attempts
          // Don't create a new note automatically, just set empty state
          setNotes([]);
          setSelectedNoteId(null);
          // Remove from localStorage since there are no notes
          if (typeof window !== 'undefined') {
            localStorage.removeItem('lastSelectedNoteId');
          }
        }
      } catch (error) {
        console.error("Failed to initialize notes:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Only initialize if the user state is settled
    if (user !== undefined) {
      initializeNotes();
    }
  }, [user, isAdmin]);

  const addNote = async (noteTitle: string): Promise<Note> => {
    const newNote = await NoteOperations.addNote(noteTitle, Boolean(isAdmin), user);

    // Add to state
    setNotes((prevNotes) => [...prevNotes, newNote]);
    setSelectedNoteId(newNote.id);

    return newNote;
  };

  const updateNote = async (id: number, content: string) => {
    // Find the note to update
    const noteToUpdate = notes.find((note) => note.id === id);

    if (!noteToUpdate) return;
    
    const now = new Date();
    
    // Update state immediately for responsive UI with updated timestamp
    setNotes((prevNotes) =>
      prevNotes.map((note) => (note.id === id ? { 
        ...note, 
        content, 
        updatedAt: now 
      } : note))
    );
    
    // Calculate word count and update in the background
    const { wordCount } = await NoteOperations.updateNote(
      id, 
      content, 
      noteToUpdate, 
      Boolean(isAdmin), 
      user
    );

    // Update word count after operation completes (keeping the updated timestamp)
    if (wordCount !== noteToUpdate.wordCount) {
      setNotes((prevNotes) =>
        prevNotes.map((note) => (note.id === id ? { 
          ...note, 
          wordCount,
          updatedAt: note.updatedAt || now 
        } : note))
      );
    }
  };

  const updateNoteTitle = async (id: number, title: string) => {
    // Find the note to update
    const noteToUpdate = notes.find((note) => note.id === id);

    if (!noteToUpdate) return;
    
    const now = new Date();

    // Update in state first for immediate UI update with timestamp
    setNotes((prevNotes) =>
      prevNotes.map((note) =>
        note.id === id ? { ...note, noteTitle: title, updatedAt: now } : note
      )
    );

    // Update the title
    const { filePath } = await NoteOperations.updateNoteTitle(
      id, 
      title, 
      noteToUpdate, 
      Boolean(isAdmin), 
      user
    );

    // Update the file path in state if provided
    if (filePath) {
      setNotes((prevNotes) =>
        prevNotes.map((note) => (note.id === id ? { ...note, filePath } : note))
      );
    }
  };

  const updateNoteCategory = async (id: number, category: NoteCategory | null): Promise<void> => {
    // Find the note to update
    const noteToUpdate = notes.find((note) => note.id === id);

    if (!noteToUpdate) return;
    
    const now = new Date();

    // Update in state first for immediate UI update with timestamp
    setNotes((prevNotes) =>
      prevNotes.map((note) => (note.id === id ? { ...note, category, updatedAt: now } : note))
    );

    try {
      await NoteOperations.updateNoteCategory(id, category, Boolean(isAdmin), user);
    } catch (error) {
      // Revert the state update if the operation fails
      setNotes((prevNotes) =>
        prevNotes.map((note) => (note.id === id ? { ...note, category: noteToUpdate.category } : note))
      );
      throw error;
    }
  };

  const deleteCategory = async (categoryId: string) => {
    try {
      // Remove the category from all notes
      await NoteOperations.removeCategory(categoryId, Boolean(isAdmin), user, notes);
      
      // Update the state for all notes that had this category
      setNotes(prevNotes => 
        prevNotes.map(note => 
          note.category && note.category.id === categoryId
            ? { ...note, category: null }
            : note
        )
      );
    } catch (error) {
      console.error("Failed to delete category:", error);
      throw error;
    }
  };

  const getNoteHistory = async (id: number): Promise<NoteEditHistory[]> => {
    return NoteOperations.getNoteHistory(id, Boolean(isAdmin), user);
  };

  const deleteNote = async (id: number) => {
    // First find the note to get its filePath before removing it
    const noteToDelete = notes.find((note) => note.id === id);

    if (!noteToDelete) return;

    // Remove from state first for immediate UI update
    setNotes((prevNotes) => prevNotes.filter((note) => note.id !== id));

    if (selectedNoteId === id) {
      // Select the next available note
      const remainingNotes = notes.filter((note) => note.id !== id);
      if (remainingNotes.length > 0) {
        // Find the most recently created note
        const newestNote = getMostRecentNote(remainingNotes);
        setSelectedNoteId(newestNote.id);
      } else {
        setSelectedNoteId(null);
      }
    }

    // Delete the note from storage
    await NoteOperations.deleteNote(id, noteToDelete, Boolean(isAdmin), user);
  };

  const selectNote = (id: number | null) => {
    setSelectedNoteId(id);
    // Don't save to localStorage anymore to prevent conflicts
  };

  const updateCategory = async (updatedCategory: NoteCategory): Promise<void> => {
    try {
      // First, update all notes that use this category
      const notesWithCategory = notes.filter(note => note.category?.id === updatedCategory.id);
      
      // Update each note's category separately
      const updatePromises = notesWithCategory.map(note => {
        return NoteOperations.updateNoteCategory(
          note.id,
          updatedCategory,
          Boolean(isAdmin),
          user
        );
      });
      
      // Wait for all updates to complete
      await Promise.all(updatePromises);
      
      // Now update the local state
      setNotes(prevNotes => 
        prevNotes.map(note => 
          note.category?.id === updatedCategory.id
            ? { ...note, category: updatedCategory }
            : note
        )
      );
    } catch (error) {
      console.error("Failed to update category:", error);
      throw error;
    }
  };

  const syncLocalNotesToFirebase = async (): Promise<void> => {
    if (!user || !firebaseNotesService) {
      console.error("Cannot sync notes - user is not authenticated or Firebase service is not available");
      return;
    }

    try {
      console.log("Starting sync of local notes to Firebase");
      const localNotes = localStorageNotesService.getNotes();
      
      // Sync the notes
      await syncLocalToFirebase(localNotes, user.uid);
      
      // After syncing, reload notes from Firebase
      const firebaseNotes = await firebaseNotesService.getNotes(user.uid);
      setNotes(firebaseNotes);
      
      // If there are notes, select the most recent one
      if (firebaseNotes.length > 0) {
        const mostRecentNote = getMostRecentNote(firebaseNotes);
        setSelectedNoteId(mostRecentNote.id);
      }
    } catch (error) {
      console.error("Error syncing notes to Firebase:", error);
    }
  };

  /**
   * Updates the tags for a specific note
   * @param noteId - The ID of the note to update
   * @param tags - Array of tags to set for the note
   * @returns The updated array of tags
   */
  const updateNoteTags = async (noteId: number, tags: string[]): Promise<string[]> => {
    try {
      // Validate input
      if (!noteId) {
        console.error('[TAG CONTEXT] Note ID is required for updateNoteTags');
        throw new Error('Note ID is required');
      }
      
      console.log(`[TAG CONTEXT] Starting tag update for note ${noteId}`);
      
      // Find the note to update
      const noteToUpdate = notes.find(note => note.id === noteId);
      if (!noteToUpdate) {
        console.error(`[TAG CONTEXT] Note with ID ${noteId} not found`);
        throw new Error(`Note with ID ${noteId} not found`);
      }
      
      // Log current tags
      console.log(`[TAG CONTEXT] Current tags for note ${noteId}:`, 
        JSON.stringify(noteToUpdate.tags || []));
      console.log(`[TAG CONTEXT] New tags to set:`, JSON.stringify(tags));
      
      // Enforce the 5-tag limit
      const MAX_TAGS = 5;
      if (Array.isArray(tags) && tags.length > MAX_TAGS) {
        console.warn(`[TAG CONTEXT] Tag limit exceeded. Max ${MAX_TAGS} allowed, got ${tags.length}`);
        tags = tags.slice(0, MAX_TAGS);
      }
      
      // Use the dedicated updateNoteTags method which returns the cleaned tags
      const cleanTags = await NoteOperations.updateNoteTags(noteId, tags, isAdmin, user);
      
      console.log(`[TAG CONTEXT] Tags updated in storage for note ${noteId}:`, JSON.stringify(cleanTags));
      
      // Update local state with the clean tags returned from storage
      console.log(`[TAG CONTEXT] Updating tags in local state for note ${noteId}`);
      setNotes(prevNotes => 
        prevNotes.map(note => 
          note.id === noteId ? {...note, tags: cleanTags, updatedAt: new Date()} : note
        )
      );
      
      console.log(`[TAG CONTEXT] Tag update complete for note ${noteId}`);
      
      // Return the updated tags so the caller can update its local state
      return cleanTags;
    } catch (error) {
      console.error("[TAG CONTEXT] Failed to update tags:", error);
      throw error;
    }
  };

  // Handle updating note parent
  const updateNoteParent = async (id: number, parentId: number | null): Promise<void> => {
    try {
      // Find the note to update
      const noteToUpdate = notes.find(note => note.id === id);
      if (!noteToUpdate) {
        throw new Error(`Note with ID ${id} not found`);
      }

      // Create updated note
      const updatedNote = { ...noteToUpdate, parentId, updatedAt: new Date() };

      // Save to storage
      await NoteOperations.updateNoteData(id, updatedNote, Boolean(isAdmin), user);

      // Update local state
      setNotes(prevNotes => 
        prevNotes.map(note => note.id === id ? updatedNote : note)
      );
    } catch (error) {
      console.error("Failed to update note parent:", error);
      throw error;
    }
  };

  // Handle updating note links (bidirectional)
  const updateNoteLinks = async (id: number, linkedNoteIds: number[]): Promise<void> => {
    try {
      // Find the note to update
      const noteToUpdate = notes.find(note => note.id === id);
      if (!noteToUpdate) {
        throw new Error(`Note with ID ${id} not found`);
      }

      // Create updated note
      const updatedNote = { ...noteToUpdate, linkedNoteIds, updatedAt: new Date() };

      // Save to storage
      await NoteOperations.updateNoteData(id, updatedNote, Boolean(isAdmin), user);

      // Update local state with this note's links
      const updatedNotes = notes.map(note => note.id === id ? updatedNote : note);

      // Implement bidirectional linking - update all linked notes to link back
      const promises = linkedNoteIds.map(async linkedId => {
        const linkedNote = updatedNotes.find(note => note.id === linkedId);
        if (!linkedNote) return;

        // If this note is not already in the linked note's links, add it
        if (!linkedNote.linkedNoteIds?.includes(id)) {
          const updatedLinks = [...(linkedNote.linkedNoteIds || []), id];
          const updatedLinkedNote = { 
            ...linkedNote, 
            linkedNoteIds: updatedLinks,
            updatedAt: new Date()
          };

          // Save to storage
          await NoteOperations.updateNoteData(linkedId, updatedLinkedNote, Boolean(isAdmin), user);

          // Update in our updatedNotes array
          return updatedLinkedNote;
        }
        return linkedNote;
      });

      // Wait for all bidirectional link updates
      const bidirectionalResults = await Promise.all(promises);

      // Create final notes array with all updates
      const finalUpdatedNotes = updatedNotes.map(note => {
        const updatedLinkedNote = bidirectionalResults.find(ln => ln && ln.id === note.id);
        return updatedLinkedNote || note;
      });

      // Update state with all changes
      setNotes(finalUpdatedNotes);
    } catch (error) {
      console.error("Failed to update note links:", error);
      throw error;
    }
  };

  // Get all child notes for a given parent
  const getChildNotes = (parentId: number): Note[] => {
    return notes.filter(note => note.parentId === parentId);
  };

  // Get all linked notes for a given note
  const getLinkedNotes = (noteId: number): Note[] => {
    const note = notes.find(n => n.id === noteId);
    if (!note || !note.linkedNoteIds || note.linkedNoteIds.length === 0) {
      return [];
    }
    return notes.filter(n => note.linkedNoteIds?.includes(n.id));
  };

  // Update a tag across all notes (rename)
  /**
   * Updates a tag name across all notes
   * @param oldTag - The original tag name to replace (empty for new tags)
   * @param newTag - The new tag name to use
   */
  const updateTagAcrossNotes = async (oldTag: string, newTag: string): Promise<void> => {
    try {
      // Validate input
      if (!newTag || newTag.trim() === '') {
        throw new Error('New tag name cannot be empty');
      }
      
      // Normalize tag names
      const normalizedOldTag = oldTag ? oldTag.trim().toLowerCase() : '';
      const normalizedNewTag = newTag.trim().toLowerCase();
      
      console.log(`[TAG OPERATION] Attempting to ${normalizedOldTag ? 'update' : 'create'} tag: ${normalizedOldTag || ''} → ${normalizedNewTag}`);
      
      // Check for duplicate tag names
      if (normalizedOldTag !== normalizedNewTag && 
          notes.some(note => note.tags?.includes(normalizedNewTag))) {
        console.error(`Tag "${normalizedNewTag}" already exists`);
        throw new Error(`Tag "${normalizedNewTag}" already exists`);
      }
      
      // Handle creating a new tag (oldTag is empty)
      if (normalizedOldTag === '') {
        console.log(`[TAG OPERATION] Successfully registered new tag: ${normalizedNewTag}`);
        // Now we just return as the tag will be added to the specific note through the separate function
        return;
      }
      
      // Find all notes that contain this tag
      const notesToUpdate = notes.filter(note => 
        note.tags && note.tags.includes(normalizedOldTag)
      );
      
      if (notesToUpdate.length === 0) {
        console.log(`No notes found with tag "${normalizedOldTag}"`);
        return;
      }
      
      console.log(`Updating tag "${normalizedOldTag}" to "${normalizedNewTag}" in ${notesToUpdate.length} notes`);
      
      // Update each note's tags
      const updatePromises = notesToUpdate.map(async note => {
        const updatedTags = note.tags?.map(tag => 
          tag === normalizedOldTag ? normalizedNewTag : tag
        ) || [];
        
        // Create updated note
        const updatedNote = { 
          ...note, 
          tags: updatedTags, 
          updatedAt: new Date() 
        };
        
        // Save to storage with proper error handling
        await NoteOperations.updateNoteData(note.id, updatedNote, Boolean(isAdmin), user);
        
        return updatedNote;
      });
      
      // Wait for all updates to complete
      const updatedNotes = await Promise.all(updatePromises);
      
      // Update local state
      setNotes(prevNotes => 
        prevNotes.map(note => {
          const updatedNote = updatedNotes.find(n => n.id === note.id);
          return updatedNote || note;
        })
      );
    } catch (error) {
      console.error("Failed to update tag across notes:", error);
      throw error;
    }
  };

  // Delete a tag from all notes
  /**
   * Removes a tag from all notes
   * @param tag - The tag to remove from all notes
   */
  const deleteTagFromAllNotes = async (tag: string): Promise<void> => {
    try {
      // Validate input
      if (!tag || tag.trim() === '') {
        throw new Error('Tag name is required');
      }
      
      // Normalize tag name
      const normalizedTag = tag.trim().toLowerCase();
      
      // Find all notes with this tag
      const notesToUpdate = notes.filter(note => 
        note.tags && note.tags.includes(normalizedTag)
      );
      
      if (notesToUpdate.length === 0) {
        console.log(`No notes found with tag "${normalizedTag}"`);
        return;
      }
      
      console.log(`Removing tag "${normalizedTag}" from ${notesToUpdate.length} notes`);

      // Update each note's tags
      const updatePromises = notesToUpdate.map(async note => {
        const updatedTags = (note.tags || []).filter(t => t !== normalizedTag);
        
        // Create updated note
        const updatedNote = { 
          ...note, 
          tags: updatedTags, 
          updatedAt: new Date() 
        };
        
        // Save to storage with proper error handling
        await NoteOperations.updateNoteData(note.id, updatedNote, Boolean(isAdmin), user);
        
        return updatedNote;
      });
      
      // Wait for all updates to complete
      const updatedNotes = await Promise.all(updatePromises);
      
      // Update local state
      setNotes(prevNotes => 
        prevNotes.map(note => {
          const updatedNote = updatedNotes.find(n => n.id === note.id);
          return updatedNote || note;
        })
      );
    } catch (error) {
      console.error("Failed to delete tag from all notes:", error);
      throw error;
    }
  };

  return (
    <NoteContext.Provider
      value={{
        notes,
        selectedNoteId,
        setNotes,
        addNote,
        updateNote,
        updateNoteTitle,
        updateNoteCategory,
        updateCategory,
        deleteCategory,
        deleteNote,
        selectNote,
        getNoteHistory,
        syncLocalNotesToFirebase,
        updateNoteTags,
        updateTagAcrossNotes,
        deleteTagFromAllNotes,
        updateNoteParent,
        updateNoteLinks,
        getChildNotes,
        getLinkedNotes
      }}
    >
      {children}
    </NoteContext.Provider>
  );
}

export function useNotes() {
  const context = useContext(NoteContext);
  if (context === undefined) {
    throw new Error("useNotes must be used within a NoteProvider");
  }
  return context;
}
