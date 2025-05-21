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
  updateNoteTags: (id: number, tags: string[]) => Promise<void>;
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
    
    // Update state immediately for responsive UI
    setNotes((prevNotes) =>
      prevNotes.map((note) => (note.id === id ? { ...note, content } : note))
    );
    
    // Calculate word count and update in the background
    const { wordCount } = await NoteOperations.updateNote(
      id, 
      content, 
      noteToUpdate, 
      Boolean(isAdmin), 
      user
    );

    // Update word count after operation completes
    if (wordCount !== noteToUpdate.wordCount) {
      setNotes((prevNotes) =>
        prevNotes.map((note) => (note.id === id ? { ...note, wordCount } : note))
      );
    }
  };

  const updateNoteTitle = async (id: number, title: string) => {
    // Find the note to update
    const noteToUpdate = notes.find((note) => note.id === id);

    if (!noteToUpdate) return;

    // Update in state first for immediate UI update
    setNotes((prevNotes) =>
      prevNotes.map((note) =>
        note.id === id ? { ...note, noteTitle: title } : note
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

    // Update in state first for immediate UI update
    setNotes((prevNotes) =>
      prevNotes.map((note) => (note.id === id ? { ...note, category } : note))
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

  // Handle updating note tags
  const updateNoteTags = async (id: number, tags: string[]): Promise<void> => {
    try {
      console.log('Updating tags for note', id, tags);
      
      // Find the note to update
      const noteToUpdate = notes.find(note => note.id === id);
      if (!noteToUpdate) {
        console.error(`Note with ID ${id} not found`);
        throw new Error(`Note with ID ${id} not found`);
      }

      // Create updated note
      // Make sure tags is an array, not undefined
      const sanitizedTags = Array.isArray(tags) ? tags : [];
      console.log('Sanitized tags:', sanitizedTags);
      
      const updatedNote = { 
        ...noteToUpdate, 
        tags: sanitizedTags, 
        updatedAt: new Date() 
      };

      console.log('Updating local state with new note data:', updatedNote);
      
      // Update local state first for immediate feedback
      setNotes(prevNotes => 
        prevNotes.map(note => note.id === id ? updatedNote : note)
      );

      // Then save to storage
      try {
        await NoteOperations.updateNoteData(id, updatedNote, Boolean(isAdmin), user);
        console.log('Successfully saved tags to storage');
      } catch (error) {
        // If storage update fails, revert the state change
        console.error("Failed to update note tags in storage:", error);
        setNotes(prevNotes => 
          prevNotes.map(note => note.id === id ? noteToUpdate : note)
        );
        throw error;
      }
    } catch (error) {
      console.error("Failed to update note tags:", error);
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
  const updateTagAcrossNotes = async (oldTag: string, newTag: string): Promise<void> => {
    try {
      if (newTag.trim() === '') {
        throw new Error('New tag name cannot be empty');
      }

      // Skip if trying to create a new tag (when oldTag is empty)
      // and the tag already exists
      if (oldTag === '' && notes.some(note => note.tags?.includes(newTag))) {
        throw new Error(`Tag "${newTag}" already exists`);
      }

      // Find all notes with this tag
      let notesToUpdate: Note[] = [];
      
      if (oldTag === '') {
        // If oldTag is empty, we're just creating a new tag but not actually
        // updating any notes directly
        return;
      } else {
        notesToUpdate = notes.filter(note => 
          note.tags && note.tags.includes(oldTag)
        );
      }
      
      if (notesToUpdate.length === 0 && oldTag !== '') {
        throw new Error(`No notes found with tag "${oldTag}"`);
      }

      // Update each note's tags
      const updatePromises = notesToUpdate.map(async note => {
        const updatedTags = note.tags?.map(tag => 
          tag === oldTag ? newTag : tag
        ) || [];
        
        // Create updated note
        const updatedNote = { 
          ...note, 
          tags: updatedTags, 
          updatedAt: new Date() 
        };
        
        // Save to storage
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
  const deleteTagFromAllNotes = async (tag: string): Promise<void> => {
    try {
      // Find all notes with this tag
      const notesToUpdate = notes.filter(note => 
        note.tags && note.tags.includes(tag)
      );
      
      if (notesToUpdate.length === 0) {
        throw new Error(`No notes found with tag "${tag}"`);
      }

      // Update each note's tags
      const updatePromises = notesToUpdate.map(async note => {
        const updatedTags = (note.tags || []).filter(t => t !== tag);
        
        // Create updated note
        const updatedNote = { 
          ...note, 
          tags: updatedTags, 
          updatedAt: new Date() 
        };
        
        // Save to storage
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
