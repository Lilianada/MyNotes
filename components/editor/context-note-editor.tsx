"use client"

import { forwardRef, useEffect, useRef } from "react"
import { NoteEditor } from "./note-editor"
import { editHistoryService } from "@/lib/edit-history/edit-history-service"
import { useAppState } from "@/lib/state/app-state"
import { Note } from "@/types"

interface ContextNoteEditorProps {
  note: Note
}

export const ContextNoteEditor = forwardRef<HTMLTextAreaElement, ContextNoteEditorProps>(({ note }, ref) => {
  const { updateNote, updateNoteTitle, selectedNoteId } = useAppState()
  
  // Track previous note ID to detect note changes
  const prevNoteIdRef = useRef<number | null>(null)
  
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
  
  const handleContentChange = (content: string) => {
    updateNote(note.id, content)
  }
  
  const handleTitleUpdate = (newTitle: string) => {
    updateNoteTitle(note.id, newTitle)
  }
  
  const handleSave = () => {
    // We don't need to implement save explicitly since the state store is handling persistence
    console.log(`Saving note ${note.id}`)
  }
  
  return (
    <NoteEditor
      note={note}
      onChange={handleContentChange}
      onSave={handleSave}
      onUpdateTitle={handleTitleUpdate}
      ref={ref}
    />
  )
})

ContextNoteEditor.displayName = "ContextNoteEditor"