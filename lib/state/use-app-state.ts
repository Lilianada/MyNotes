import { useCallback, useEffect } from 'react'
import { useUIStore } from './ui-store'
import { useNoteStore } from './note-store'
import { useAuth } from '@/contexts/auth-context'
import { useUserPreferences } from '@/contexts/user-preferences-context'
import { Note } from '@/types'

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
    getLinkedNotes
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
    getChildNotes,
    getLinkedNotes,
    
    // Auth state
    user,
    isAdmin,
    authLoading
  }
}
