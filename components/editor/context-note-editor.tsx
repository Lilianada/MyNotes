"use client"

import { forwardRef, useEffect, useRef } from "react"
import NoteEditor from "./note-editor"
import { useNotes } from "@/contexts/notes/note-context"
import { editHistoryService } from "@/lib/edit-history/edit-history-service"

export const ContextNoteEditor = forwardRef<HTMLTextAreaElement>((props, ref) => {
  const { notes, selectedNoteId, updateNote, updateNoteTitle } = useNotes()
  
  // Track previous note ID to detect note changes
  const prevNoteIdRef = useRef<number | null>(null)
  
  // Get the currently selected note
  const activeNote = selectedNoteId ? notes.find(note => note.id === selectedNoteId) || null : null
  
  // Handle note switching to ensure proper cleanup
  useEffect(() => {
    // If the selected note has changed, ensure previous note tracking is cleaned up
    if (prevNoteIdRef.current !== null && 
        prevNoteIdRef.current !== selectedNoteId && 
        prevNoteIdRef.current > 0) {
      console.log(`Note switched from ${prevNoteIdRef.current} to ${selectedNoteId}, cleaning up previous note tracking`)
      try {
        // Always clean up the previous note's tracking to prevent memory leaks
        // even if the note no longer exists in the array
        if (typeof editHistoryService !== 'undefined' && typeof editHistoryService.cleanupTracking === 'function') {
          editHistoryService.cleanupTracking(prevNoteIdRef.current)
        }
      } catch (error) {
        console.error(`Error during cleanup for previous note ${prevNoteIdRef.current}:`, error)
      }
    }
    
    // Update the ref to the current note ID
    prevNoteIdRef.current = selectedNoteId
    
    // Cleanup on unmount
    return () => {
      if (selectedNoteId) {
        try {
          // Always clean up to prevent memory leaks, regardless of whether
          // the note still exists in the array
          if (typeof editHistoryService !== 'undefined' && typeof editHistoryService.cleanupTracking === 'function') {
            editHistoryService.cleanupTracking(selectedNoteId)
          }
        } catch (error) {
          console.error(`Error during unmount cleanup for note ${selectedNoteId}:`, error)
        }
      }
    }
  }, [selectedNoteId])
  
  // If no note is selected, return null
  if (!activeNote) return null
  
  const handleContentChange = (content: string) => {
    updateNote(activeNote.id, content)
  }
  
  const handleTitleUpdate = (newTitle: string) => {
    updateNoteTitle(activeNote.id, newTitle)
  }
  
  const handleSave = () => {
    // We don't need to implement save explicitly since the context is handling state
    // Any actual saving to files would be handled by the context
    console.log(`Saving note ${activeNote.id}`)
  }
  
  return (
    <NoteEditor
      note={activeNote}
      onChange={handleContentChange}
      onSave={handleSave}
      onUpdateTitle={handleTitleUpdate}
      ref={ref}
      // Remove the beforeMount prop or define it in NoteEditor component
    />
  )
})

ContextNoteEditor.displayName = "ContextNoteEditor"

export default ContextNoteEditor