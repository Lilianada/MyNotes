"use client";

import {
  createContext,
  useContext,
  useEffect,
  ReactNode,
} from "react";
import { Note, NoteCategory, NoteEditHistory } from "@/types";
import { useAuth } from "@/contexts/auth-context";
import { useUserPreferences } from "@/contexts/user-preferences-context";
import { useNoteState, useNoteOperations } from "./note-hooks";
import { initializeNotes } from "./note-initialization";
import { useNoteTags } from "./note-tags";
import { useNoteRelationships } from "./note-relationships";
import { useNoteCategories } from "./note-categories";
import { editHistoryService } from "@/lib/edit-history/edit-history-service";

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
  archiveNote: (id: number, archived?: boolean) => Promise<void>;
  updateNoteData: (id: number, updatedNote: Partial<Note>) => Promise<void>;
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

  // Get auth loading state to ensure we don't initialize before auth is ready
  const { loading: authLoading } = useAuth();
  
  // Get user preferences for note selection
  const { preferences, setLastSelectedNoteId } = useUserPreferences();

  const noteOperations = useNoteOperations(
    notes,
    setNotes,
    selectedNoteId,
    setSelectedNoteId,
    Boolean(isAdmin),
    user
  );

  // Enhanced selectNote that also saves to user preferences
  const enhancedSelectNote = (id: number | null) => {
    noteOperations.selectNote(id);
    setLastSelectedNoteId(id);
  };

  // Enhanced addNote that also saves to user preferences
  const enhancedAddNote = async (noteTitle: string): Promise<Note> => {
    const newNote = await noteOperations.addNote(noteTitle);
    setLastSelectedNoteId(newNote.id);
    return newNote;
  };

  // Save selected note ID to user preferences whenever it changes
  useEffect(() => {
    if (selectedNoteId !== null) {
      setLastSelectedNoteId(selectedNoteId);
    }
  }, [selectedNoteId, setLastSelectedNoteId]);

  const tagOperations = useNoteTags(
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
    // Wait for auth to be fully loaded before initializing
    if (authLoading) {
      return;
    }
    
    // Only initialize if the user state is settled and we're not already loading
    if (user !== undefined) {
      const currentContext = isAdmin ? 'admin' : 'regular';
      
      // If notes were already successfully loaded, don't reload unless user/admin status changed
      if (hasInitializedRef.current && notes.length > 0 && initContextRef.current === currentContext) {
        return;
      }
      
      // If admin status changed, allow re-initialization
      if (hasInitializedRef.current && initContextRef.current !== currentContext) {
        console.log(`Admin status changed from ${initContextRef.current} to ${currentContext}, reinitializing`);
        hasInitializedRef.current = false;
        initContextRef.current = "";
      }
      
      // Use a single initialization key per user
      const userInitializationKey = `notes_initialization_${user?.uid || 'anonymous'}`;
      
      // Check if we're already initializing to prevent duplicate calls
      if (typeof window !== 'undefined' && !window[userInitializationKey]) {
        // Set flag to indicate initialization is in progress
        window[userInitializationKey] = true;

        // Initialize notes
        initializeNotes(
          Boolean(isAdmin),
          user,
          notes,
          setNotes,
          setSelectedNoteId,
          setIsLoading,
          hasInitializedRef,
          initContextRef,
          preferences.lastSelectedNoteId
        )
          .then(() => {
            // We need to check notes.length in a setTimeout to ensure we have the latest state
            setTimeout(() => {
              if (notes.length > 0) {
                hasInitializedRef.current = true;
                initContextRef.current = currentContext;
              }
            }, 0);
          })
          .finally(() => {
            // Clear the flag when initialization is complete
            if (typeof window !== 'undefined') {
              window[userInitializationKey] = false;
            }
          });
      } else if (typeof window !== 'undefined' && window[userInitializationKey]) {
        console.log(`Initialization already in progress for ${currentContext} context`);
      }
    }
  }, [user, isAdmin, authLoading, notes.length, hasInitializedRef, initContextRef, setNotes, setSelectedNoteId, setIsLoading]);

  // Cleanup effect when user signs out
  useEffect(() => {
    // If user becomes null (signed out), clear all state
    if (user === null) {
      // Clear notes and selection
      setNotes([]);
      setSelectedNoteId(null);
      
      // Reset initialization flags
      hasInitializedRef.current = false;
      initContextRef.current = "";
      
      // Clear edit history tracking
      editHistoryService.cleanup();
      
      // Clear any pending initialization flags
      if (typeof window !== 'undefined') {
        Object.keys(window).forEach(key => {
          if (key.startsWith('notes_initialization_')) {
            window[key] = false;
          }
        });
      }
      
      setIsLoading(false);
    }
  }, [user, setNotes, setSelectedNoteId, setIsLoading, hasInitializedRef, initContextRef]);

  return (
    <NoteContext.Provider
      value={{
        notes,
        selectedNoteId,
        isLoading,
        setNotes,
        ...noteOperations,
        addNote: enhancedAddNote, // Override with our enhanced version
        selectNote: enhancedSelectNote, // Override with our enhanced version
        ...tagOperations,
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
