"use client";

import { useState, useRef } from "react";
import { Note, NoteEditHistory } from "@/types";
import { useAuth } from "@/contexts/auth-context";
import { NoteOperations } from "./note-operations";
import { 
  getMostRecentNote, 
  syncLocalToFirebase 
} from "./note-storage";
import { localStorageNotesService } from "@/lib/storage/local-storage-notes";
import { firebaseNotesService } from "@/lib/firebase/firebase-notes";
import { syncLocalNotesToFirebase } from "@/lib/notes/sync-service";
import { calculateNoteSize } from "@/lib/storage/storage-utils";
import { getUserStorage, incrementStorage } from "@/lib/firebase/firebase-storage";
import { useToast } from "@/hooks/use-toast";
import { useStorage } from "@/contexts/storage-context";

export function useNoteState() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAdmin } = useAuth();
  
  // Add refs to track initialization
  const hasInitializedRef = useRef<boolean>(false);
  const initContextRef = useRef<string>("");

  return {
    notes,
    setNotes,
    selectedNoteId,
    setSelectedNoteId,
    isLoading,
    setIsLoading,
    user,
    isAdmin,
    hasInitializedRef,
    initContextRef
  };
}

export function useNoteOperations(
  notes: Note[],
  setNotes: (notes: Note[] | ((prev: Note[]) => Note[])) => void,
  selectedNoteId: number | null,
  setSelectedNoteId: (id: number | null) => void,
  isAdmin: boolean,
  user: { uid: string } | null | undefined
) {
  const { toast } = useToast();
  const { refreshStorage } = useStorage();
  
  const addNote = async (noteTitle: string): Promise<Note> => {
    const newNote = await NoteOperations.addNote(noteTitle, Boolean(isAdmin), user);

    // Add to state
    setNotes((prevNotes) => [...prevNotes, newNote]);
    setSelectedNoteId(newNote.id);

    // Refresh storage tracking for non-admin users
    if (user && !isAdmin) {
      refreshStorage();
    }

    return newNote;
  };

  const updateNote = async (id: number, content: string) => {
    // Find the note to update
    const noteToUpdate = notes.find((note) => note.id === id);

    if (!noteToUpdate) return;
    
    const now = new Date();
    
    // Extract metadata from content if it contains frontmatter
    let description = noteToUpdate.description;
    let publish = noteToUpdate.publish;
    
    // Parse frontmatter if present
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
    const frontmatterMatch = content.match(frontmatterRegex);
    
    if (frontmatterMatch) {
      const frontmatter = frontmatterMatch[1];
      // Extract description if present
      const descriptionMatch = frontmatter.match(/description:\s*"(.*)"/i);
      if (descriptionMatch) {
        description = descriptionMatch[1];
      }
      
      // Extract publish status if present
      const publishMatch = frontmatter.match(/publish:\s*(true|false)/i);
      if (publishMatch) {
        publish = publishMatch[1].toLowerCase() === 'true';
      }
    }
    
    // Update state immediately for responsive UI with updated timestamp
    setNotes((prevNotes) =>
      prevNotes.map((note) => (note.id === id ? { 
        ...note, 
        content, 
        description,
        publish,
        updatedAt: now 
      } : note))
    );
    
    // Calculate word count and update in the background
    const { wordCount } = await NoteOperations.updateNote(
      id, 
      content, 
      {...noteToUpdate, description, publish}, 
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
    
    // Refresh storage tracking for non-admin users
    if (user && !isAdmin) {
      refreshStorage();
    }
  };

  const bulkDeleteNotes = async (ids: number[]): Promise<{ successful: number[], failed: { id: number, error: string }[] }> => {
    if (ids.length === 0) {
      return { successful: [], failed: [] };
    }

    // Find the notes to delete
    const notesToDelete = notes.filter(note => ids.includes(note.id));

    // Remove from state first for immediate UI update
    setNotes((prevNotes) => prevNotes.filter((note) => !ids.includes(note.id)));

    // If the selected note is being deleted, select another one
    if (selectedNoteId && ids.includes(selectedNoteId)) {
      const remainingNotes = notes.filter((note) => !ids.includes(note.id));
      if (remainingNotes.length > 0) {
        const newestNote = getMostRecentNote(remainingNotes);
        setSelectedNoteId(newestNote.id);
      } else {
        setSelectedNoteId(null);
      }
    }

    // Delete the notes from storage
    try {
      const result = await NoteOperations.bulkDeleteNotes(ids, notesToDelete, Boolean(isAdmin), user);
      
      // Refresh storage tracking for non-admin users
      if (user && !isAdmin) {
        refreshStorage();
      }
      
      return result;
    } catch (error) {
      console.error("Failed to bulk delete notes:", error);
      // Return error result for all notes
      return {
        successful: [],
        failed: ids.map(id => ({ id, error: error instanceof Error ? error.message : 'Unknown error' }))
      };
    }
  };

  const selectNote = (id: number | null) => {
    setSelectedNoteId(id);
    // Don't save to localStorage anymore to prevent conflicts
  };

  const getNoteHistory = async (id: number): Promise<NoteEditHistory[]> => {
    return NoteOperations.getNoteHistory(id, Boolean(isAdmin), user);
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

  const archiveNote = async (id: number, archived: boolean = true): Promise<void> => {
    // Find the note to update
    const noteToUpdate = notes.find((note) => note.id === id);

    if (!noteToUpdate) return;
    
    const now = new Date();

    // Update in state first for immediate UI update
    setNotes((prevNotes) =>
      prevNotes.map((note) =>
        note.id === id ? { ...note, archived, updatedAt: now } : note
      )
    );

    // If we're archiving the currently selected note, switch to another note
    if (archived && selectedNoteId === id) {
      const remainingNotes = notes.filter((note) => note.id !== id && !note.archived);
      if (remainingNotes.length > 0) {
        // Find the most recently created note
        const newestNote = getMostRecentNote(remainingNotes);
        setSelectedNoteId(newestNote.id);
      } else {
        setSelectedNoteId(null);
      }
    }

    // Update the note in storage
    await NoteOperations.updateNoteData(
      id, 
      { archived },
      Boolean(isAdmin), 
      user
    );
  };

  const updateNoteData = async (id: number, updatedNote: Partial<Note>): Promise<void> => {
    // Find the note to update
    const noteToUpdate = notes.find((note) => note.id === id);

    if (!noteToUpdate) return;
    
    const now = new Date();

    // Update in state first for immediate UI update
    setNotes((prevNotes) =>
      prevNotes.map((note) =>
        note.id === id ? { ...note, ...updatedNote, updatedAt: now } : note
      )
    );

    // Update the note in storage
    await NoteOperations.updateNoteData(
      id, 
      updatedNote,
      Boolean(isAdmin), 
      user
    );
  };

  return {
    addNote,
    updateNote,
    updateNoteTitle,
    deleteNote,
    bulkDeleteNotes,
    selectNote,
    getNoteHistory,
    syncLocalNotesToFirebase,
    archiveNote,
    updateNoteData
  };
}
