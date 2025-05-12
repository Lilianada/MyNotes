"use client"

import { createContext, useState, useContext, useEffect, ReactNode } from "react"
import { Note } from "@/types"
import { loadNoteFromFile, loadNotesFromFiles } from "@/lib/note-loader"

interface NoteContextType {
  notes: Note[]
  selectedNoteId: number | null
  setNotes: (notes: Note[]) => void
  addNote: (note: Note) => void
  updateNote: (id: number, content: string) => void
  updateNoteTitle: (id: number, title: string) => void
  deleteNote: (id: number) => void
  selectNote: (id: number | null) => void
}

const NoteContext = createContext<NoteContextType | undefined>(undefined)

export function NoteProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null)
  
  useEffect(() => {
    const initializeNotes = async () => {
      try {
        const loadedNotes = await loadNotesFromFiles()
        setNotes(loadedNotes)
        
        // Select the first note if one exists
        if (loadedNotes.length > 0) {
          setSelectedNoteId(loadedNotes[0].id)
        }
      } catch (error) {
        console.error("Failed to load notes:", error)
      }
    }
    
    initializeNotes()
  }, [])
  
  const addNote = (note: Note) => {
    setNotes(prevNotes => [...prevNotes, note])
    setSelectedNoteId(note.id)
  }
  
  const updateNote = (id: number, content: string) => {
    setNotes(prevNotes => 
      prevNotes.map(note => 
        note.id === id ? { ...note, content } : note
      )
    )
  }
  
  const updateNoteTitle = (id: number, title: string) => {
    setNotes(prevNotes => 
      prevNotes.map(note => 
        note.id === id ? { ...note, noteTitle: title } : note
      )
    )
  }
  
  const deleteNote = (id: number) => {
    // First find the note to get its filePath before removing it
    const noteToDelete = notes.find(note => note.id === id)
    
    // Remove from state
    setNotes(prevNotes => prevNotes.filter(note => note.id !== id))
    
    if (selectedNoteId === id) {
      // Select the next available note
      const remainingNotes = notes.filter(note => note.id !== id)
      if (remainingNotes.length > 0) {
        // Find the most recently created note
        const newestNote = [...remainingNotes].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0]
        setSelectedNoteId(newestNote.id)
      } else {
        setSelectedNoteId(null)
      }
    }
    
    // Note: The actual file deletion happens in the List component
    // through the deleteNoteFile action when the delete button is clicked
  }
  
  const selectNote = (id: number | null) => {
    setSelectedNoteId(id)
  }
  
  return (
    <NoteContext.Provider 
      value={{ 
        notes, 
        selectedNoteId,
        setNotes,
        addNote, 
        updateNote, 
        updateNoteTitle, 
        deleteNote, 
        selectNote 
      }}
    >
      {children}
    </NoteContext.Provider>
  )
}

export function useNotes() {
  const context = useContext(NoteContext)
  if (context === undefined) {
    throw new Error("useNotes must be used within a NoteProvider")
  }
  return context
}