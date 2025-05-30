"use client";

import {
  createContext,
  useContext,
  useEffect,
  ReactNode,
} from "react";
import { Note, NoteCategory, NoteEditHistory } from "@/types";
import { useAuth } from "@/contexts/auth-context";
import { useNoteState, useNoteOperations } from "./note-hooks";
import { initializeNotes } from "./note-initialization";
import { useNoteTags } from "./note-tags";
import { useNoteRelationships } from "./note-relationships";
import { useNoteCategories } from "./note-categories";

interface NoteContextType {
  notes: Note[];
  selectedNoteId: number | null;
  isLoading: boolean;  // Expose loading state to components
  setNotes: (notes: Note[]) => void;
  addNote: (noteTitle: string) => Promise<Note>;
  updateNote: (id: number, content: string) => void;
  updateNoteTitle: (id: number, title: string) => void;
  updateNoteCategory: (id: number, category: NoteCategory | null) => Promise<void>;
  updateCategory: (category: NoteCategory) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
  getNoteHistory: (id: number) => Promise<NoteEditHistory[]>;
  deleteNote: (id: number) => void;
  bulkDeleteNotes: (ids: number[]) => Promise<{ successful: number[], failed: { id: number, error: string }[] }>;
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

// Extend Window interface to include our dynamic properties
declare global {
  interface Window {
    [key: string]: any;
  }
}

export function NoteProvider({ children }: { children: ReactNode }) {
  const {
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
  } = useNoteState();

  const noteOperations = useNoteOperations(
    notes,
    setNotes,
    selectedNoteId,
    setSelectedNoteId,
    Boolean(isAdmin),
    user
  );

  const tagOperations = useNoteTags(
    notes,
    setNotes,
    Boolean(isAdmin),
    user
  );

  const relationshipOperations = useNoteRelationships(
    notes,
    setNotes,
    Boolean(isAdmin),
    user
  );

  const categoryOperations = useNoteCategories(
    notes,
    setNotes,
    Boolean(isAdmin),
    user
  );

  // Initialize notes when the user state changes
  useEffect(() => {
    // Only initialize if the user state is settled and we're not already loading
    if (user !== undefined) {
      // Determine the current context type (admin or regular)
      const currentContext = isAdmin ? 'admin' : 'regular';
      
      // If notes were already successfully loaded by another context, don't reload
      if (hasInitializedRef.current && notes.length > 0) {
        console.log(`Skipping initialization for ${currentContext} context - notes already loaded by ${initContextRef.current} context`);
        return;
      }
      
      // Add a semaphore mechanism to prevent multiple concurrent initializations
      const initializationKey = `notes_initialization_${user?.uid || 'anonymous'}_${currentContext}`;
      
      // Check if we're already initializing to prevent duplicate calls
      if (typeof window !== 'undefined' && !window[initializationKey]) {
        // Set flag to indicate initialization is in progress
        window[initializationKey] = true;
        
        console.log(`Starting notes initialization for ${currentContext} context`);

        // Initialize notes
        initializeNotes(
          Boolean(isAdmin),
          user,
          notes,
          setNotes,
          setSelectedNoteId,
          setIsLoading,
          hasInitializedRef,
          initContextRef
        )
          .then(() => {
            // We need to check notes.length in a setTimeout to ensure we have the latest state
            setTimeout(() => {
              if (notes.length > 0) {
                hasInitializedRef.current = true;
                initContextRef.current = currentContext;
                console.log(`Notes successfully initialized by ${currentContext} context`);
              }
            }, 0);
          })
          .finally(() => {
            // Clear the flag when initialization is complete
            if (typeof window !== 'undefined') {
              window[initializationKey] = false;
            }
          });
      }
    }
  }, [user, isAdmin, notes.length, hasInitializedRef, initContextRef, setNotes, setSelectedNoteId, setIsLoading]);

  return (
    <NoteContext.Provider
      value={{
        notes,
        selectedNoteId,
        isLoading,
        setNotes,
        ...noteOperations,
        ...tagOperations,
        ...relationshipOperations,
        ...categoryOperations
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
