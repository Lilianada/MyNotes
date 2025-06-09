import { useCallback, useEffect, useMemo } from 'react'
import { useUIStore } from './ui-store'
import { useNoteStore } from './note-store'
import { useAuth } from '@/contexts/auth-context'
import { useUserPreferences } from '@/contexts/user-preferences-context'
import { Note } from '@/types'

// Type definition for the filter options
export type FilterOptions = {
  tag?: string
  category?: string
  archived?: boolean
  published?: boolean
  search?: string
}

// Type definition for the sort options
export type SortField = 'createdAt' | 'updatedAt' | 'noteTitle' | 'wordCount'
export type SortOrder = 'asc' | 'desc'

/**
 * Combined hook that provides a simplified API for components
 * This helps avoid prop drilling and consolidates state management
 */
export function useAppState() {
  const { user, isAdmin, loading: authLoading } = useAuth()
  const { preferences, setLastSelectedNoteId } = useUserPreferences()
  
  // UI state
  const {
    isSidebarOpen,
    setSidebarOpen,
    toggleSidebar,
    isCreatingNote,
    setCreatingNote,
    selectedNoteId,
    selectNote: selectNoteUI
  } = useUIStore()
  
  // Note state
  const {
    notes,
    setNotes,
    isLoading,
    setIsLoading,
    addNote: addNoteBase,
    updateNote: updateNoteBase,
    updateNoteTitle: updateNoteTitleBase,
    deleteNote: deleteNoteBase,
    getChildNotes,
    getLinkedNotes,
    bulkDeleteNotes: bulkDeleteNotesBase
  } = useNoteStore()
  
  // Enhanced selectNote that also saves to user preferences
  const selectNote = useCallback((id: number | null) => {
    selectNoteUI(id)
    if (id !== null) {
      setLastSelectedNoteId(id)
    }
  }, [selectNoteUI, setLastSelectedNoteId])
  
  // Enhanced addNote that also selects the new note
  const addNote = useCallback(async (noteTitle: string): Promise<Note> => {
    const newNote = await addNoteBase(noteTitle, user, Boolean(isAdmin))
    selectNote(newNote.id)
    return newNote
  }, [addNoteBase, user, isAdmin, selectNote])
  
  // Simplified update methods that handle user and isAdmin automatically
  const updateNote = useCallback((id: number, content: string) => {
    return updateNoteBase(id, content, user, Boolean(isAdmin))
  }, [updateNoteBase, user, isAdmin])
  
  const updateNoteTitle = useCallback((id: number, title: string) => {
    return updateNoteTitleBase(id, title, user, Boolean(isAdmin))
  }, [updateNoteTitleBase, user, isAdmin])
  
  const deleteNote = useCallback((id: number) => {
    return deleteNoteBase(id, user, Boolean(isAdmin))
  }, [deleteNoteBase, user, isAdmin])
  
  // Simplified bulk delete method that handles user and isAdmin automatically
  const bulkDeleteNotes = useCallback((ids: number[]) => {
    return bulkDeleteNotesBase(ids, user, Boolean(isAdmin))
  }, [bulkDeleteNotesBase, user, isAdmin])
  
  // Filter notes based on options
  const filterNotes = useCallback((notesToFilter: Note[], options: FilterOptions) => {
    let filteredNotes = [...notesToFilter];
    
    // Filter by tag
    if (options.tag) {
      filteredNotes = filteredNotes.filter(note => 
        note.tags && note.tags.includes(options.tag!)
      );
    }
    
    // Filter by category
    if (options.category) {
      filteredNotes = filteredNotes.filter(note => 
        note.category && note.category.id === options.category
      );
    }
    
    // Filter by archive status
    if (options.archived !== undefined) {
      filteredNotes = filteredNotes.filter(note => 
        note.archived === options.archived
      );
    }
    
    // Filter by published status
    if (options.published !== undefined) {
      filteredNotes = filteredNotes.filter(note => 
        (note as any).published === options.published
      );
    }
    
    // Filter by search term
    if (options.search) {
      const searchTerm = options.search.toLowerCase();
      filteredNotes = filteredNotes.filter(note => 
        note.noteTitle.toLowerCase().includes(searchTerm) ||
        note.content.toLowerCase().includes(searchTerm)
      );
    }
    
    return filteredNotes;
  }, [])
  
  // Sort notes based on field and order
  const sortNotes = useCallback((notesToSort: Note[], sortBy: SortField, sortOrder: SortOrder) => {
    return [...notesToSort].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'noteTitle':
          comparison = a.noteTitle.localeCompare(b.noteTitle);
          break;
        case 'createdAt':
          comparison = (new Date(a.createdAt || new Date())).getTime() - (new Date(b.createdAt || new Date())).getTime();
          break;
        case 'updatedAt':
          comparison = (new Date(a.updatedAt || new Date())).getTime() - (new Date(b.updatedAt || new Date())).getTime();
          break;
        case 'wordCount':
          comparison = (a.wordCount || 0) - (b.wordCount || 0);
          break;
        default:
          comparison = (new Date(b.updatedAt || new Date())).getTime() - (new Date(a.updatedAt || new Date())).getTime();
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [])
  
  // Search notes based on query
  const searchNotes = useCallback((query: string) => {
    if (!query) return notes;
    
    const searchTerm = query.toLowerCase();
    return notes.filter(note => 
      note.noteTitle.toLowerCase().includes(searchTerm) ||
      note.content.toLowerCase().includes(searchTerm)
    );
  }, [notes])
  
  // Get the active note based on selectedNoteId
  const activeNote = selectedNoteId !== null 
    ? notes.find(note => note.id === selectedNoteId) || null 
    : null
  
  // Initialize notes when auth state changes
  useEffect(() => {
    // This would be implemented to handle note initialization
    // Similar to the existing initialization logic but using our new stores
  }, [user, isAdmin, authLoading])
  
  return {
    // UI state
    isSidebarOpen,
    setSidebarOpen,
    toggleSidebar,
    isCreatingNote,
    setCreatingNote,
    
    // Note state
    notes,
    setNotes,
    isLoading,
    setIsLoading,
    selectedNoteId,
    selectNote,
    activeNote,
    
    // Note operations
    addNote,
    updateNote,
    updateNoteTitle,
    deleteNote,
    bulkDeleteNotes,
    getChildNotes,
    getLinkedNotes,
    
    // Filtering and sorting
    filterNotes,
    sortNotes,
    searchNotes,
    
    // Auth state
    user,
    isAdmin,
    authLoading
  }
}
