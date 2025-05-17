"use client";

import {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";
import { Note } from "@/types";
import { loadNotesFromFiles } from "@/lib/note-loader";
import { saveNoteToFile, createEmptyNoteFile } from "@/app/actions";
import { firebaseNotesService } from "@/lib/firebase-notes";
import { localStorageNotesService } from "@/lib/local-storage-notes";
import { useAuth } from "@/contexts/auth-context";
import { get } from "http";

interface NoteContextType {
  notes: Note[];
  selectedNoteId: number | null;
  setNotes: (notes: Note[]) => void;
  addNote: (noteTitle: string) => Promise<Note>;
  updateNote: (id: number, content: string) => void;
  updateNoteTitle: (id: number, title: string) => void;
  deleteNote: (id: number) => void;
  selectNote: (id: number | null) => void;
}

const NoteContext = createContext<NoteContextType | undefined>(undefined);

// Helper function to get the most recent note by creation date
const getMostRecentNote = (notes: Note[]): Note => {
  return [...notes].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )[0];
};

// Empty initial note for new users
const getEmptyNote = () => {
  return `# New Note

Start writing here...`;
};

export function NoteProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);
  const { user, isAdmin } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeNotes = async () => {
      setIsLoading(true);
      try {
        let loadedNotes: Note[] = [];
        let notesLoadedFromStorage = false;

        // Determine which storage method to use
        if (isAdmin && user && firebaseNotesService) {
          // Use Firebase for admins
          loadedNotes = await firebaseNotesService.getNotes(user.uid);
          notesLoadedFromStorage = loadedNotes.length > 0;
        } else if (typeof window !== "undefined") {
          // Use localStorage for non-admins
          loadedNotes = localStorageNotesService.getNotes();
          notesLoadedFromStorage = loadedNotes.length > 0;

          // If localStorage is empty, try to get notes from the file system (for first-time users)
          if (loadedNotes.length === 0) {
            // In production, add a small delay to ensure any async loading has time to complete
            if (process.env.NODE_ENV === 'production') {
              await new Promise(resolve => setTimeout(resolve, 500));
              
              // Check localStorage again after the delay
              const retryNotes = localStorageNotesService.getNotes();
              if (retryNotes.length > 0) {
                loadedNotes = retryNotes;
                notesLoadedFromStorage = true;
              }
            }
            
            // If still no notes, try loading from files
            if (loadedNotes.length === 0) {
              loadedNotes = await loadNotesFromFiles();

              // Save to localStorage if we got notes from the file system
              if (loadedNotes.length > 0) {
                localStorage.setItem("notes", JSON.stringify(loadedNotes));
                notesLoadedFromStorage = true;
              }
            }
          }
        }

        // If we have notes, set them up
        if (loadedNotes.length > 0) {
          setNotes(loadedNotes);
          
          // Try to restore the previously selected note from localStorage
          const lastSelectedNoteId = typeof window !== 'undefined' ? 
            localStorage.getItem('lastSelectedNoteId') : null;
          
          if (lastSelectedNoteId) {
            const noteId = parseInt(lastSelectedNoteId, 10);
            // Only restore if the note still exists
            if (loadedNotes.some(note => note.id === noteId)) {
              setSelectedNoteId(noteId);
            } else {
              // If the saved note doesn't exist anymore, select the most recent note
              const mostRecentNote = getMostRecentNote(loadedNotes);
              setSelectedNoteId(mostRecentNote.id);
              // Update localStorage with the new selected note
              if (typeof window !== 'undefined') {
                localStorage.setItem('lastSelectedNoteId', mostRecentNote.id.toString());
              }
            }
          } else {
            // No saved note in localStorage, select the most recent note
            const mostRecentNote = getMostRecentNote(loadedNotes);
            setSelectedNoteId(mostRecentNote.id);
            // Save to localStorage for persistence
            if (typeof window !== 'undefined') {
              localStorage.setItem('lastSelectedNoteId', mostRecentNote.id.toString());
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
                // Save to localStorage
                localStorage.setItem('lastSelectedNoteId', mostRecentNote.id.toString());
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
    let newNote: Note;

    try {
      if (isAdmin && user) {
        // Use Firebase for admins
        newNote = await firebaseNotesService.addNote(user.uid, noteTitle);
      } else {
        // Use localStorage for non-admins
        newNote = localStorageNotesService.addNote(noteTitle);

        // Also create the file for backwards compatibility
        const result = await createEmptyNoteFile(noteTitle);
        if (result.success) {
          newNote.filePath = result.filePath;
        }
      }

      // Add to state
      setNotes((prevNotes) => [...prevNotes, newNote]);
      setSelectedNoteId(newNote.id);

      return newNote;
    } catch (error) {
      console.error("Failed to add note:", error);
      throw new Error("Failed to create note");
    }
  };

  const updateNote = async (id: number, content: string) => {
    // Find the note to update
    const noteToUpdate = notes.find((note) => note.id === id);

    if (!noteToUpdate) return;

    // Update in state first for immediate UI update
    setNotes((prevNotes) =>
      prevNotes.map((note) => (note.id === id ? { ...note, content } : note))
    );

    try {
      if (isAdmin && user) {
        // Use Firebase for admins
        await firebaseNotesService.updateNoteContent(id, content);
      } else {
        // Use localStorage for non-admins
        localStorageNotesService.updateNoteContent(id, content);

        // Also update file for backwards compatibility
        await saveNoteToFile(
          content,
          id,
          noteToUpdate.noteTitle,
          noteToUpdate.slug
        );
      }
    } catch (error) {
      console.error("Failed to update note content:", error);
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

    try {
      let filePath: string;

      if (isAdmin && user) {
        // Use Firebase for admins
        filePath = await firebaseNotesService.updateNoteTitle(id, title);
      } else {
        // Use localStorage for non-admins
        filePath = localStorageNotesService.updateNoteTitle(id, title);

        // Also update file for backwards compatibility
        const result = await saveNoteToFile(
          noteToUpdate.content,
          id,
          title,
          noteToUpdate.slug
        );
        if (result.success && result.filePath) {
          filePath = result.filePath;
        }
      }

      // Update the file path in state
      setNotes((prevNotes) =>
        prevNotes.map((note) => (note.id === id ? { ...note, filePath } : note))
      );
    } catch (error) {
      console.error("Failed to update note title:", error);
    }
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
        const newestNote = [...remainingNotes].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0];
        setSelectedNoteId(newestNote.id);
        
        // Update localStorage with the new selected note
        if (typeof window !== 'undefined') {
          localStorage.setItem('lastSelectedNoteId', newestNote.id.toString());
        }
      } else {
        setSelectedNoteId(null);
        // Remove from localStorage since there are no notes left
        if (typeof window !== 'undefined') {
          localStorage.removeItem('lastSelectedNoteId');
        }
      }
    }

    // Delete the note from storage
    try {
      if (isAdmin && user) {
        // Use Firebase for admins
        await firebaseNotesService.deleteNote(id);
      } else {
        // Use localStorage for non-admins
        localStorageNotesService.deleteNote(id);

        // Also delete file for backwards compatibility
        if (noteToDelete.filePath) {
          const { deleteNoteFile } = await import("@/app/delete-actions");
          await deleteNoteFile(noteToDelete.filePath);
        }
      }
    } catch (error) {
      console.error("Failed to delete note:", error);
    }
  };

  const selectNote = (id: number | null) => {
    setSelectedNoteId(id);
    // Save selected note ID to localStorage for persistence
    if (id !== null && typeof window !== 'undefined') {
      localStorage.setItem('lastSelectedNoteId', id.toString());
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
        deleteNote,
        selectNote,
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
