"use client";

import { useEffect, useState, useCallback } from 'react';
import { Note, NoteCategory, NoteEditHistory } from '@/types';
import { firebaseNotesService } from '@/lib/firebase/firebase-notes';
import { localStorageNotesService } from '@/lib/storage/local-storage-notes';
import { editHistoryService } from '@/lib/edit-history/edit-history-service';
import { useAuth } from '@/contexts/auth-context';
import { useNotes } from '@/contexts/notes/note-context';

export type TabType = 'details' | 'category' | 'relationships' | 'tags' | 'metadata';

export function useNoteDetailsState(note: Note | null, isOpen: boolean) {
  const [activeTab, setActiveTab] = useState<TabType>('details');
  const [editHistory, setEditHistory] = useState<NoteEditHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<NoteCategory[]>([]);
  const [description, setDescription] = useState<string>('');
  const [publishStatus, setPublishStatus] = useState<boolean>(false);
  const [archived, setArchived] = useState<boolean>(false);
  
  const { user, isAdmin } = useAuth();
  const { notes } = useNotes();
  
  // Extract all unique categories from notes
  useEffect(() => {
    if (isOpen) {
      const uniqueCategories = notes.reduce((acc: NoteCategory[], current: Note) => {
        if (current.category && !acc.find(c => c.id === current.category?.id)) {
          acc.push(current.category);
        }
        return acc;
      }, []);
      setCategories(uniqueCategories);
    }
  }, [isOpen, notes]);
  
  useEffect(() => {
    if (isOpen && note) {
      loadEditHistory();
      setDescription(note.description || '');
      setPublishStatus(note.publish || false);
      setArchived(note.archived || false);
    }
  }, [isOpen, note]);
  
  const loadEditHistory = useCallback(async () => {
    if (!note) return;
    
    setIsLoading(true);
    
    try {
      // Use the enhanced edit history service
      const history = await editHistoryService.getHistory(note.id, isAdmin || false, user);
      setEditHistory(history);
    } catch (error) {
      console.error('Failed to load edit history:', error);
      // Fallback to direct service calls
      try {
        let fallbackHistory: NoteEditHistory[] = [];
        
        if (isAdmin && user && firebaseNotesService) {
          fallbackHistory = await firebaseNotesService.getNoteHistory(note.id);
        } else {
          fallbackHistory = localStorageNotesService.getNoteHistory(note.id);
        }
        
        setEditHistory(fallbackHistory);
      } catch (fallbackError) {
        console.error('Fallback history loading also failed:', fallbackError);
        setEditHistory([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [note, isAdmin, user]);

  return {
    activeTab,
    setActiveTab,
    editHistory,
    isLoading,
    categories,
    setCategories,
    description,
    setDescription,
    publishStatus,
    setPublishStatus,
    archived,
    setArchived,
    loadEditHistory, // Expose for manual refresh
  };
}

export function useNoteDetailsActions(note: Note | null, setActiveTab: (tab: TabType) => void) {
  const { 
    updateNoteCategory, 
    updateNoteTags,
    updateTagAcrossNotes,
    deleteTagFromAllNotes,
    updateNote,
    updateCategory,
    deleteCategory,
    archiveNote
  } = useNotes();
  
  const handleCategorySave = useCallback(async (category: NoteCategory | null) => {
    if (!note) return;
    
    try {
      await updateNoteCategory(note.id, category);
      setActiveTab('details');
    } catch (error) {
      console.error('Failed to update category:', error);
    }
  }, [note, updateNoteCategory, setActiveTab]);
  
  return {
    handleCategorySave,
    updateNoteTags,
    updateTagAcrossNotes,
    deleteTagFromAllNotes,
    updateNote,
    updateCategory,
    deleteCategory,
    archiveNote
  };
}

// Wrapper hook that combines state and actions for backward compatibility
export function useNoteDetailsHooks(note: Note | null, isOpen: boolean) {
  const stateHook = useNoteDetailsState(note, isOpen);
  const actionsHook = useNoteDetailsActions(note, stateHook.setActiveTab);
  
  // Combine and return all properties and methods
  return {
    ...stateHook,
    ...actionsHook,
  };
}
