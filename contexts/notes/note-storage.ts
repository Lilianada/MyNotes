"use client";

import { Note, NoteCategory, NoteEditHistory } from "@/types";
import { firebaseNotesService } from "@/lib/firebase/firebase-notes";
import { localStorageNotesService } from "@/lib/storage/local-storage-notes";
import { loadNotesFromFiles } from "@/lib/notes/note-loader";

interface LoadNotesResult {
  loadedNotes: Note[];
  notesLoadedFromStorage: boolean;
  error: Error | null;
}

// Helper function to get the most recent note by creation date
export const getMostRecentNote = (notes: Note[]): Note => {
  if (!notes || notes.length === 0) {
    throw new Error("Cannot get most recent note from empty notes array");
  }
  
  return [...notes].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )[0];
};

// Empty initial note for new users
export const getEmptyNote = (): string => {
  return `# New Note

Start writing here...`;
};

/**
 * Loads notes from the appropriate storage based on user authentication status
 */
export const loadUserNotes = async (
  isAdmin: boolean, 
  user: { uid: string } | null | undefined
): Promise<LoadNotesResult> => {
  let loadedNotes: Note[] = [];
  let notesLoadedFromStorage = false;
  let error: Error | null = null;

  try {
    // Determine which storage method to use
    if (isAdmin && user && firebaseNotesService) {
      // Use Firebase for admins
      console.log("Loading notes from Firebase for admin user");
      try {
        loadedNotes = await firebaseNotesService.getNotes(user.uid);
        notesLoadedFromStorage = loadedNotes.length > 0;
      } catch (firebaseError) {
        console.error("Error loading notes from Firebase:", firebaseError);
        error = new Error(`Failed to load notes from Firebase: ${firebaseError instanceof Error ? firebaseError.message : String(firebaseError)}`);
        
        // Try to load from localStorage as fallback
        if (typeof window !== "undefined") {
          try {
            const localNotes = localStorageNotesService.getNotes();
            if (localNotes.length > 0) {
              loadedNotes = localNotes;
              notesLoadedFromStorage = true;
              console.log("Successfully loaded notes from localStorage as fallback");
            }
          } catch (localError) {
            console.error("Error loading fallback notes from localStorage:", localError);
          }
        }
      }
      
      // If no notes in Firebase but there are notes in localStorage, automatically sync them
      if (loadedNotes.length === 0 && typeof window !== "undefined") {
        try {
          const localNotes = localStorageNotesService.getNotes();
          if (localNotes.length > 0) {
            console.log("Found local notes but no Firebase notes - automatically syncing");
            
            // Sync local notes to Firebase immediately
            try {
              await syncLocalToFirebase(localNotes, user.uid);
              
              // Load the newly synced notes from Firebase
              loadedNotes = await firebaseNotesService.getNotes(user.uid);
              notesLoadedFromStorage = loadedNotes.length > 0;
            } catch (syncError) {
              console.error("Error syncing notes to Firebase:", syncError);
              error = new Error(`Failed to sync notes to Firebase: ${syncError instanceof Error ? syncError.message : String(syncError)}`);
              // Fall back to local notes if sync fails
              loadedNotes = localNotes;
              notesLoadedFromStorage = true;
            }
          }
        } catch (localStorageError) {
          console.error("Error accessing localStorage:", localStorageError);
          error = new Error(`Failed to access localStorage: ${localStorageError instanceof Error ? localStorageError.message : String(localStorageError)}`);
        }
      }
    } else if (user && firebaseNotesService) {
      // For regular authenticated users, also use Firebase
      console.log("Loading notes from Firebase for regular authenticated user");
      try {
        loadedNotes = await firebaseNotesService.getNotes(user.uid);
        notesLoadedFromStorage = loadedNotes.length > 0;
      } catch (firebaseError) {
        console.error("Error loading notes from Firebase for regular user:", firebaseError);
        error = new Error(`Failed to load notes from Firebase: ${firebaseError instanceof Error ? firebaseError.message : String(firebaseError)}`);
        
        // Try to load from localStorage as fallback
        if (typeof window !== "undefined") {
          try {
            const localNotes = localStorageNotesService.getNotes();
            if (localNotes.length > 0) {
              loadedNotes = localNotes;
              notesLoadedFromStorage = true;
              console.log("Successfully loaded notes from localStorage as fallback");
            }
          } catch (localError) {
            console.error("Error loading fallback notes from localStorage:", localError);
          }
        }
      }
      
      // If no notes in Firebase but there are notes in localStorage, automatically sync them
      if (loadedNotes.length === 0 && typeof window !== "undefined") {
        try {
          const localNotes = localStorageNotesService.getNotes();
          if (localNotes.length > 0) {
            console.log("Found local notes but no Firebase notes - automatically syncing for regular user");
            
            // Sync local notes to Firebase immediately
            try {
              await syncLocalToFirebase(localNotes, user.uid);
              
              // Load the newly synced notes from Firebase
              loadedNotes = await firebaseNotesService.getNotes(user.uid);
              notesLoadedFromStorage = loadedNotes.length > 0;
            } catch (syncError) {
              console.error("Error syncing notes to Firebase:", syncError);
              error = new Error(`Failed to sync notes to Firebase: ${syncError instanceof Error ? syncError.message : String(syncError)}`);
              // Fall back to local notes if sync fails
              loadedNotes = localNotes;
              notesLoadedFromStorage = true;
            }
          }
        } catch (localStorageError) {
          console.error("Error accessing localStorage:", localStorageError);
          error = new Error(`Failed to access localStorage: ${localStorageError instanceof Error ? localStorageError.message : String(localStorageError)}`);
        }
      }
    } else if (typeof window !== "undefined") {
      // Use localStorage for anonymous users (not logged in)
      try {
        loadedNotes = localStorageNotesService.getNotes();
        notesLoadedFromStorage = loadedNotes.length > 0;
      } catch (localStorageError) {
        console.error("Error loading notes from localStorage:", localStorageError);
        error = new Error(`Failed to load notes from localStorage: ${localStorageError instanceof Error ? localStorageError.message : String(localStorageError)}`);
      }

      // If localStorage is empty, try to get notes from the file system (for first-time users)
      if (loadedNotes.length === 0) {
        // In production, add a small delay to ensure any async loading has time to complete
        if (process.env.NODE_ENV === 'production') {
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Check localStorage again after the delay
          try {
            const retryNotes = localStorageNotesService.getNotes();
            if (retryNotes.length > 0) {
              loadedNotes = retryNotes;
              notesLoadedFromStorage = true;
            }
          } catch (retryError) {
            console.error("Error on retry loading from localStorage:", retryError);
          }
        }
        
        // If still no notes, try loading from files
        if (loadedNotes.length === 0) {
          try {
            loadedNotes = await loadNotesFromFiles();

            // Save to localStorage if we got notes from the file system
            if (loadedNotes.length > 0) {
              try {
                localStorage.setItem("notes", JSON.stringify(loadedNotes));
                notesLoadedFromStorage = true;
              } catch (saveError) {
                console.error("Failed to save loaded notes to localStorage:", saveError);
              }
            }
          } catch (fileLoadError) {
            console.error("Error loading notes from files:", fileLoadError);
            error = new Error(`Failed to load notes from files: ${fileLoadError instanceof Error ? fileLoadError.message : String(fileLoadError)}`);
          }
        }
      }
    }
  } catch (generalError) {
    console.error("Unexpected error loading notes:", generalError);
    error = new Error(`Unexpected error loading notes: ${generalError instanceof Error ? generalError.message : String(generalError)}`);
  }

  // If we still have no notes after all attempts, add a specific error
  if (loadedNotes.length === 0 && !error) {
    error = new Error("No notes could be loaded from any source");
  }

  return { loadedNotes, notesLoadedFromStorage, error };
};

/**
 * Syncs local notes to Firebase
 */
export const syncLocalToFirebase = async (
  localNotes: Note[],
  userId: string
): Promise<number> => {
  if (!firebaseNotesService) {
    throw new Error("Firebase notes service is not available");
  }

  if (!localNotes || localNotes.length === 0) {
    throw new Error("No local notes to sync");
  }

  if (!userId) {
    throw new Error("User ID is required for syncing notes");
  }

  let syncedCount = 0;
  for (const note of localNotes) {
    try {
      // Create a new note with the title
      const newNote = await firebaseNotesService.addNote(userId, note.noteTitle);
      
      // Update its content
      await firebaseNotesService.updateNoteContent(newNote.id, note.content);
      
      // Update category if present
      if (note.category) {
        await firebaseNotesService.updateNoteCategory(newNote.id, note.category);
      }
      
      syncedCount++;
    } catch (err) {
      console.error(`Failed to sync note "${note.noteTitle}":`, err);
    }
  }
  
  console.log(`Successfully synced ${syncedCount} of ${localNotes.length} notes to Firebase`);
  return syncedCount;
};
