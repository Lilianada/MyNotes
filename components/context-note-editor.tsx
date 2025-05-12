"use client"

import { forwardRef } from "react"
import NoteEditor from "./note-editor"
import { useNotes } from "@/contexts/note-context"

export const ContextNoteEditor = forwardRef<HTMLTextAreaElement>((props, ref) => {
  const { notes, selectedNoteId, updateNote, updateNoteTitle } = useNotes()
  
  // Get the currently selected note
  const activeNote = selectedNoteId ? notes.find(note => note.id === selectedNoteId) || null : null
  
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
    console.log('Note saved')
  }
  
  return (
    <NoteEditor
      note={activeNote}
      onChange={handleContentChange}
      onSave={handleSave}
      onUpdateTitle={handleTitleUpdate}
      ref={ref}
    />
  )
})

ContextNoteEditor.displayName = "ContextNoteEditor"

export default ContextNoteEditor
