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
          console.log("Loading notes from Firebase for admin user");
          loadedNotes = await firebaseNotesService.getNotes(user.uid);
          notesLoadedFromStorage = loadedNotes.length > 0;
          
          // If no notes in Firebase but there are notes in localStorage, automatically sync them
          if (loadedNotes.length === 0 && typeof window !== "undefined") {
            const localNotes = localStorageNotesService.getNotes();
            if (localNotes.length > 0) {
              console.log("Found local notes but no Firebase notes - automatically syncing");
              
              // Sync local notes to Firebase immediately
              try {
                let syncedCount = 0;
                for (const note of localNotes) {
                  try {
                    // Create a new note with the title
                    const newNote = await firebaseNotesService.addNote(user.uid, note.noteTitle);
                    // Update its content
                    await firebaseNotesService.updateNoteContent(newNote.id, note.content);
                    syncedCount++;
                  } catch (err) {
                    console.error(`Failed to sync note "${note.noteTitle}":`, err);
                  }
                }
                console.log(`Successfully synced ${syncedCount} of ${localNotes.length} notes to Firebase`);
                
                // Load the newly synced notes from Firebase
                loadedNotes = await firebaseNotesService.getNotes(user.uid);
                notesLoadedFromStorage = loadedNotes.length > 0;
              } catch (syncError) {
                console.error("Error syncing notes to Firebase:", syncError);
                // Fall back to local notes if sync fails
                loadedNotes = localNotes;
                notesLoadedFromStorage = true;
              }
            }
          }
        } else if (user && firebaseNotesService) {
          // For regular authenticated users, also use Firebase
          console.log("Loading notes from Firebase for regular authenticated user");
          loadedNotes = await firebaseNotesService.getNotes(user.uid);
          notesLoadedFromStorage = loadedNotes.length > 0;
          
          // If no notes in Firebase but there are notes in localStorage, automatically sync them
          if (loadedNotes.length === 0 && typeof window !== "undefined") {
            const localNotes = localStorageNotesService.getNotes();
            if (localNotes.length > 0) {
              console.log("Found local notes but no Firebase notes - automatically syncing for regular user");
              
              // Sync local notes to Firebase immediately
              try {
                let syncedCount = 0;
                for (const note of localNotes) {
                  try {
                    // Create a new note with the title
                    const newNote = await firebaseNotesService.addNote(user.uid, note.noteTitle);
                    // Update its content
                    await firebaseNotesService.updateNoteContent(newNote.id, note.content);
                    syncedCount++;
                  } catch (err) {
                    console.error(`Failed to sync note "${note.noteTitle}":`, err);
                  }
                }
                console.log(`Successfully synced ${syncedCount} of ${localNotes.length} notes to Firebase`);
                
                // Load the newly synced notes from Firebase
                loadedNotes = await firebaseNotesService.getNotes(user.uid);
                notesLoadedFromStorage = loadedNotes.length > 0;
              } catch (syncError) {
                console.error("Error syncing notes to Firebase:", syncError);
                // Fall back to local notes if sync fails
                loadedNotes = localNotes;
                notesLoadedFromStorage = true;
              }
            }
          }
        } else if (typeof window !== "undefined") {
          // Use localStorage for anonymous users (not logged in)
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
          
          // Always select the most recent note when loading
          const mostRecentNote = getMostRecentNote(loadedNotes);
          console.log(`Using most recent note: ${mostRecentNote.id}`);
          setSelectedNoteId(mostRecentNote.id);
          
          // Update localStorage with the selected note
          if (typeof window !== 'undefined') {
            localStorage.setItem('lastSelectedNoteId', mostRecentNote.id.toString());
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
    
    // Calculate word count
    const wordCount = countWords(content);

    // Update in state first for immediate UI update
    setNotes((prevNotes) =>
      prevNotes.map((note) => (note.id === id ? { ...note, content, wordCount } : note))
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

  // Add updateNoteCategory method
  const updateNoteCategory = async (id: number, category: NoteCategory | null): Promise<void> => {
    // Find the note to update
    const noteToUpdate = notes.find((note) => note.id === id);

    if (!noteToUpdate) return;

    // Update in state first for immediate UI update
    setNotes((prevNotes) =>
      prevNotes.map((note) => (note.id === id ? { ...note, category } : note))
    );

    try {
      if (isAdmin && user && firebaseNotesService) {
        // Use Firebase for admins
        await firebaseNotesService.updateNoteCategory(id, category);
      } else {
        // Use localStorage for non-admins
        localStorageNotesService.updateNoteCategory(id, category);
      }
    } catch (error) {
      console.error("Failed to update note category:", error);
      // Revert the state update if the storage update fails
      setNotes((prevNotes) =>
        prevNotes.map((note) => (note.id === id ? { ...note, category: noteToUpdate.category } : note))
      );
      throw error;
    }
  };

  // Add getNoteHistory method
  const getNoteHistory = async (id: number): Promise<NoteEditHistory[]> => {
    try {
      if (isAdmin && user && firebaseNotesService) {
        // Use Firebase for admins
        return await firebaseNotesService.getNoteHistory(id);
      } else {
        // Use localStorage for non-admins
        return localStorageNotesService.getNoteHistory(id);
      }
    } catch (error) {
      console.error("Failed to get note history:", error);
      return [];
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
      } else {
        setSelectedNoteId(null);
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
    // Don't save to localStorage anymore to prevent conflicts
  };

  // Add syncLocalNotesToFirebase function to sync local notes to Firebase
  const syncLocalNotesToFirebase = async (): Promise<void> => {
    if (!user || !firebaseNotesService) {
      console.error("Cannot sync notes - user is not authenticated or Firebase service is not available");
      return;
    }

    try {
      console.log("Starting sync of local notes to Firebase");
      const localNotes = localStorageNotesService.getNotes();
      let syncedCount = 0;

      // Create a copy of each local note in Firebase
      for (const note of localNotes) {
        try {
          // First create a new note with the title
          const newNote = await firebaseNotesService.addNote(user.uid, note.noteTitle);
          
          // Then update its content
          await firebaseNotesService.updateNoteContent(newNote.id, note.content);
          
          syncedCount++;
        } catch (err) {
          console.error(`Failed to sync note "${note.noteTitle}":`, err);
        }
      }

      console.log(`Successfully synced ${syncedCount} of ${localNotes.length} notes to Firebase`);
      
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
