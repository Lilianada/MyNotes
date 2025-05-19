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
  getNoteHistory: (id: number) => Promise<NoteEditHistory[]>;
  deleteNote: (id: number) => void;
  selectNote: (id: number | null) => void;
  syncLocalNotesToFirebase: () => Promise<void>;
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
    
    // Update the note
    const { wordCount } = await NoteOperations.updateNote(
      id, 
      content, 
      noteToUpdate, 
      Boolean(isAdmin), 
      user
    );

    // Update in state for immediate UI update
    setNotes((prevNotes) =>
      prevNotes.map((note) => (note.id === id ? { ...note, content, wordCount } : note))
    );
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
        deleteNote,
        selectNote,
        getNoteHistory,
        syncLocalNotesToFirebase,
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
