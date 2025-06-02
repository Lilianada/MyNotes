"use client";

import { Note } from "@/types";
import { 
  getMostRecentNote, 
  loadUserNotes 
} from "./note-storage";
import { localStorageNotesService } from "@/lib/storage/local-storage-notes";
import { addUniqueIdsToLocalNotes } from "@/lib/notes/sync-service";

/**
 * Selects which note to open based on user preferences and available notes
 * @param notes - Array of available notes
 * @param lastSelectedNoteId - The last selected note ID from user preferences
 * @returns The note that should be opened
 */
function selectNoteToOpen(notes: Note[], lastSelectedNoteId: number | null | undefined): Note {
  // If we have a last selected note ID and it exists in the notes, use it
  if (lastSelectedNoteId !== null && lastSelectedNoteId !== undefined) {
    const lastSelectedNote = notes.find(note => note.id === lastSelectedNoteId);
    if (lastSelectedNote) {
      return lastSelectedNote;
    }
  }
  
  // Fall back to the most recent note
  const mostRecentNote = getMostRecentNote(notes);
  return mostRecentNote;
}

export async function initializeNotes(
  isAdmin: boolean,
  user: { uid: string } | null | undefined,
  notes: Note[],
  setNotes: (notes: Note[] | ((prev: Note[]) => Note[])) => void,
  setSelectedNoteId: (id: number | null) => void,
  setIsLoading: (loading: boolean) => void,
  hasInitializedRef: React.MutableRefObject<boolean>,
  initContextRef: React.MutableRefObject<string>,
  lastSelectedNoteId?: number | null
) {
  const currentContext = isAdmin ? 'admin' : 'regular';
  
  setIsLoading(true);
  try {
    // Double-check if another context has already loaded notes while we were waiting
    if (notes.length > 0 && hasInitializedRef.current) {
      setIsLoading(false);
      return;
    }
    
    // If notes are already loaded but initialization flag isn't set, fix the state
    if (notes.length > 0 && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      initContextRef.current = currentContext;
      setIsLoading(false);
      return;
    }
      
    // Start with a generous timeout of 15 seconds for initial load
    const MAX_RETRY_ATTEMPTS = 2;
    const INITIAL_TIMEOUT = 15000; // 15 seconds
    
    // Track attempts
    let attempts = 0;
    let loadedNotes: Note[] = [];
    let notesLoadedFromStorage = false;
    let error: Error | undefined;
    let success = false;
    
    // Try to load notes with retries if needed
    while (!success && attempts < MAX_RETRY_ATTEMPTS) {
      attempts++;
      
      // Check if another context has loaded notes while we were in the retry loop
      if (notes.length > 0 && hasInitializedRef.current) {
        setIsLoading(false);
        return;
      }
      
      try {
        // Create a timeout promise with progressively longer timeouts
        const timeout = INITIAL_TIMEOUT * attempts;
        const loadNotesPromise = loadUserNotes(isAdmin as boolean, user);
        
        // Create a timeout promise
        const timeoutPromise = new Promise<{ loadedNotes: Note[], notesLoadedFromStorage: boolean, error: Error }>((_, reject) => {
          setTimeout(() => reject(new Error(`Loading notes timed out after ${timeout/1000} seconds`)), timeout);
        });
        
        // First check if there are notes in local storage in case Firebase is timing out
        let localNotes: Note[] = [];
        try {
          if (typeof window !== "undefined") {
            const localStorageService = await import('@/lib/storage/local-storage-notes').then(m => m.localStorageNotesService);
            localNotes = localStorageService.getNotes();
          }
        } catch (localStorageError) {
          // Silent error handling
        }
        
        // Race between the load operation and the timeout
        const result = await Promise.race([
          loadNotesPromise,
          timeoutPromise.catch(timeoutError => {
            // If we found notes in local storage, use them as a fallback
            if (localNotes.length > 0) {
              return { loadedNotes: localNotes, notesLoadedFromStorage: true, error: undefined };
            }
            
            return { loadedNotes: [], notesLoadedFromStorage: false, error: timeoutError };
          }),
        ]) as { loadedNotes: Note[], notesLoadedFromStorage: boolean, error?: Error };

        // Process the result from the race
        if (result.error) {
          error = result.error;
          
          if (attempts >= MAX_RETRY_ATTEMPTS) {
            // This was our last attempt - show error toast
            if (typeof window !== "undefined" && window.document) {
              const { toast } = await import("@/components/ui/use-toast");
              
              // Check if we already have notes loaded from another context
              if (notes.length > 0 && hasInitializedRef.current) {
                toast({
                  title: "Notes already loaded",
                  description: `Using notes loaded from your ${initContextRef.current} account.`,
                  variant: "default",
                });
              } else {
                toast({
                  title: "Error loading notes",
                  description: `Couldn't load your notes after ${attempts} attempts. Please try refreshing the page.`,
                  variant: "destructive",
                });
              }
            }
          } else {
            // Prepare for next attempt without logging
            continue; // Try again with next attempt
          }
        } else {
          // Set values from result
          loadedNotes = result.loadedNotes;
          notesLoadedFromStorage = result.notesLoadedFromStorage;
          
          if (loadedNotes.length > 0) {
            success = true;
            break; // Exit the retry loop
          }
        }
      } catch (attemptError) {
        error = attemptError instanceof Error ? attemptError : new Error(String(attemptError));
      }
    }

    // After all attempts, check for errors
    if (error && !success) {
      // Show error message to user
      if (typeof window !== "undefined" && window.document) {
        const { toast } = await import("@/components/ui/use-toast");
        toast({
          title: "Error loading notes",
          description: "There was an issue loading your notes. Please try refreshing the page.",
          variant: "destructive",
        });
      }
    }

    // Handle the loaded notes
    if (loadedNotes.length > 0) {
      // Ensure all notes have unique IDs (important for sync functionality)
      try {
        await addUniqueIdsToLocalNotes();
        
        // Get the updated notes from local storage if they were modified
        if (typeof window !== "undefined") {
          const updatedLocalNotes = localStorageNotesService.getNotes();
          if (updatedLocalNotes.length > 0) {
            loadedNotes = updatedLocalNotes;
          }
        }
      } catch (uniqueIdError) {
        // Continue with original notes if unique ID assignment fails
      }
      
      // Mark initialization as successful
      hasInitializedRef.current = true;
      initContextRef.current = isAdmin ? 'admin' : 'regular';
      
      setNotes(loadedNotes);
      
      // Select the appropriate note based on user preferences
      try {
        const noteToSelect = selectNoteToOpen(loadedNotes, lastSelectedNoteId);
        setSelectedNoteId(noteToSelect.id);
        
        // If we had to use a fallback method to load notes, inform the user
        if (attempts > 1 && typeof window !== "undefined" && window.document) {
          const { toast } = await import("@/components/ui/use-toast");
          toast({
            title: "Notes loaded from backup",
            description: "Your notes were loaded from a backup source.",
          });
        } else if (success && typeof window !== "undefined" && window.document) {
          // Show success toast on first successful attempt
          const { toast } = await import("@/components/ui/use-toast");
          toast({
            title: "Notes loaded successfully",
            description: `Loaded ${loadedNotes.length} notes from your ${isAdmin ? 'admin' : 'regular'} account`,
            variant: "default",
          });
        }
      } catch (noteSelectionError) {
        // Fallback to selecting the first note
        if (loadedNotes[0]) {
          setSelectedNoteId(loadedNotes[0].id);
        }
      }
    } else {
      // Only check one more time in production before giving up
      if (process.env.NODE_ENV === 'production' && !notesLoadedFromStorage) {
        // Show a toast that we're doing one final check
        if (typeof window !== "undefined" && window.document) {
          const { toast } = await import("@/components/ui/use-toast");
          toast({
            title: "Searching for notes...",
            description: "Checking alternate storage locations for your notes.",
          });
        }
        
        try {
          // Check one more time after a delay with a timeout
          const finalCheckPromise = new Promise<Note[]>(async (resolve) => {
            await new Promise(wait => setTimeout(wait, 1000));
            
            if (typeof window !== "undefined") {
              const finalCheckNotes = localStorageNotesService.getNotes();
              resolve(finalCheckNotes);
            } else {
              resolve([]);
            }
          });
          
          // Add a timeout to the final check
          const finalCheckTimeout = new Promise<Note[]>((_, reject) => {
            setTimeout(() => reject(new Error('Final check timed out')), 3000);
          });
          
          const finalCheckNotes = await Promise.race([finalCheckPromise, finalCheckTimeout])
            .catch(() => [] as Note[]);
            
          if (Array.isArray(finalCheckNotes) && finalCheckNotes.length > 0) {
            // Ensure all notes have unique IDs before setting them
            let notesToSet = finalCheckNotes;
            try {
              console.log(`[${currentContext}] Ensuring backup notes have unique IDs`);
              await addUniqueIdsToLocalNotes();
              
              // Get the updated notes from local storage
              if (typeof window !== "undefined") {
                const updatedBackupNotes = localStorageNotesService.getNotes();
                if (updatedBackupNotes.length > 0) {
                  notesToSet = updatedBackupNotes;
                  console.log(`[${currentContext}] Updated backup notes with unique IDs: ${notesToSet.length} notes`);
                }
              }
            } catch (uniqueIdError) {
              console.error(`[${currentContext}] Error adding unique IDs to backup notes:`, uniqueIdError);
              // Continue with original notes if unique ID assignment fails
            }
            
            setNotes(notesToSet);
            
            // Select the appropriate note based on user preferences
            const noteToSelect = selectNoteToOpen(notesToSet, lastSelectedNoteId);
            setSelectedNoteId(noteToSelect.id);
            
            // Show success toast
            if (typeof window !== "undefined" && window.document) {
              const { toast } = await import("@/components/ui/use-toast");
              toast({
                title: "Notes recovered successfully",
                description: `Found ${notesToSet.length} notes in backup storage.`,
              });
            }
            
            setIsLoading(false);
            return; // Exit early if we found notes
          }
        } catch (finalCheckError) {
          console.error("Error during final note check:", finalCheckError);
        }
      }
      
      // Perform one final check to see if notes were loaded by another context
      // while we were still processing
      if (notes.length > 0 && hasInitializedRef.current) {
        console.log(`[${currentContext}] Skipping empty state initialization - notes already loaded by ${initContextRef.current} context`);
        
        // Show an informational toast
        if (typeof window !== "undefined" && window.document) {
          const { toast } = await import("@/components/ui/use-toast");
          toast({
            title: "Using existing notes",
            description: `Using ${notes.length} notes loaded from your ${initContextRef.current} account.`,
          });
        }
      } else {
        // We don't have any notes and couldn't find any after multiple attempts
        // Don't create a new note automatically, just set empty state
        console.log(`[${currentContext}] No notes found, setting empty state`);
        setNotes([]);
        setSelectedNoteId(null);
        
        // Remove from localStorage since there are no notes
        if (typeof window !== 'undefined') {
          localStorage.removeItem('lastSelectedNoteId');
          
          // Notify the user that they need to create their first note
          const { toast } = await import("@/components/ui/use-toast");
          toast({
            title: "No notes found",
            description: "It looks like you're new here! Create your first note to get started.",
          });
        }
      }
    }
  } catch (error) {
    console.error("Failed to initialize notes:", error);
    
    // Show a friendly error message to the user
    if (typeof window !== "undefined" && window.document) {
      try {
        const { toast } = await import("@/components/ui/use-toast");
        toast({
          title: "Error loading notes",
          description: "We encountered an unexpected error while loading your notes. Please refresh the page or try again later.",
          variant: "destructive",
        });
      } catch (toastError) {
        console.error("Failed to show error toast:", toastError);
      }
    }
    
    // IMPORTANT: Never reset notes after a loading error
    // This is the main fix to prevent notes from disappearing
    console.log("Not setting empty state after error - keeping any existing notes");
    
    // If we have no notes at all yet, only then set empty state
    if (notes.length === 0 && !hasInitializedRef.current) {
      console.log("No notes exist yet, setting initial empty state");
      setNotes([]);
      setSelectedNoteId(null);
    }
  } finally {
    setIsLoading(false);
  }
}
