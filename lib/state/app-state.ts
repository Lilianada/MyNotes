/**
 * @deprecated This file is deprecated. Use the new implementation in use-app-state.ts instead.
 * Import from '@/lib/state/use-app-state' instead of '@/lib/state/app-state'.
 */

import { useNoteStore } from './note-store'
import { useUIStore } from './ui-store'
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
 * Custom hook that consolidates all app state from various stores
 * This provides a single entry point for components to access all state
 * 
 * @deprecated This hook is deprecated. Use the new implementation in use-app-state.ts instead.
 * Import from '@/lib/state/use-app-state' instead of '@/lib/state/app-state'.
 */
export const useAppState = () => {
  const {
    notes,
    setNotes,
    isLoading,
    setIsLoading,
    addNote,
    updateNote,
    updateNoteTitle,
    deleteNote,
    filterNotes,
    sortNotes,
    searchNotes,
    getChildNotes,
    getLinkedNotes,
    updateNoteCategory,
    updateCategory,
    deleteCategory,
    archiveNote,
    bulkDeleteNotes,
    getNoteHistory,
    syncLocalNotesToFirebase,
    updateNoteParent,
    updateNoteLinks,
    updateNoteTags,
    updateTagAcrossNotes,
    deleteTagFromAllNotes,
    updateNoteData
  } = useNoteStore()

  const {
    isSidebarOpen,
    setSidebarOpen,
    toggleSidebar,
    isCreatingNote,
    setCreatingNote,
    selectedNoteId,
    selectNote: setSelectedNoteId
  } = useUIStore()
  
  // Mock user state until we implement a proper auth store
  const user = null as { uid: string; email: string; isAdmin?: boolean } | null
  const isAdmin = false
  const isAuthenticated = false
  const authLoading = false
  
  // Sign in function that also triggers sync of offline notes
  const signIn = async () => {
    const userData = { uid: '123', email: 'user@example.com', isAdmin: false };
    
    // After successful sign in, sync any offline notes to Firebase
    try {
      console.log('Syncing offline notes after sign in...');
      await syncLocalNotesToFirebase(userData, false);
    } catch (error) {
      console.error('Error syncing notes after sign in:', error);
    }
    
    return userData;
  }
  
  const signOut = async () => {}
  const createAccount = async () => {
    const userData = { uid: '123', email: 'user@example.com', isAdmin: false };
    
    // After account creation, also sync any offline notes
    try {
      console.log('Syncing offline notes after account creation...');
      await syncLocalNotesToFirebase(userData, false);
    } catch (error) {
      console.error('Error syncing notes after account creation:', error);
    }
    
    return userData;
  }
  
  // Mock filter/sort state until we implement a proper filter store
  const filterOptions = { archived: false }
  const setFilterOptions = () => {}
  const sortBy = 'updatedAt' as SortField
  const setSortBy = () => {}
  const sortOrder = 'desc' as SortOrder
  const setSortOrder = () => {}
  const searchQuery = ''
  const setSearchQuery = () => {}

  // Get the currently selected note
  const selectedNote = notes.find(note => note.id === selectedNoteId)

  // Get filtered and sorted notes
  const getFilteredAndSortedNotes = () => {
    let processedNotes = [...notes]
    
    // Apply filters
    if (filterOptions) {
      processedNotes = filterNotes(processedNotes, filterOptions)
    }
    
    // Apply search
    if (searchQuery) {
      processedNotes = searchNotes(searchQuery)
    }
    
    // Apply sorting
    if (sortBy) {
      processedNotes = sortNotes(processedNotes, sortBy, sortOrder)
    }
    
    return processedNotes
  }

  // Computed property for filtered and sorted notes
  const filteredAndSortedNotes = getFilteredAndSortedNotes()

  // Convenience method to select a note
  const selectNote = (noteId: number | null) => {
    setSelectedNoteId(noteId)
    // Close sidebar on mobile when selecting a note
    if (noteId !== null && typeof window !== 'undefined' && window.innerWidth < 768) {
      setSidebarOpen(false)
    }
  }

  return {
    // Note state
    notes,
    setNotes,
    isLoading,
    setIsLoading,
    addNote,
    updateNote,
    updateNoteTitle,
    deleteNote,
    filterNotes,
    sortNotes,
    searchNotes,
    getChildNotes,
    getLinkedNotes,
    updateNoteCategory,
    updateCategory,
    deleteCategory,
    archiveNote,
    bulkDeleteNotes,
    getNoteHistory,
    syncLocalNotesToFirebase,
    updateNoteParent,
    updateNoteLinks,
    updateNoteTags,
    updateTagAcrossNotes,
    deleteTagFromAllNotes,
    updateNoteData,
    
    // UI state
    isSidebarOpen,
    setSidebarOpen,
    toggleSidebar,
    isCreatingNote,
    setCreatingNote,
    selectedNoteId,
    setSelectedNoteId,
    filterOptions,
    setFilterOptions,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    searchQuery,
    setSearchQuery,
    
    // Auth state
    user,
    isAdmin,
    isAuthenticated,
    authLoading,
    signIn,
    signOut,
    createAccount,
    
    // Computed values
    selectedNote,
    filteredAndSortedNotes,
    
    // Convenience methods
    selectNote
  }
}
