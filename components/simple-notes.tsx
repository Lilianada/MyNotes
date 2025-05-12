"use client"

import { useState, useRef, useEffect } from "react"
import TitleModal from "./title-modal"
import { createEmptyNoteFile } from "@/app/actions"
import { useNotes } from "@/contexts/note-context"
import ContextNoteEditor from "./context-note-editor"
import type { Note } from "@/types"

export function SimpleNotes() {
  const { notes, addNote, selectedNoteId } = useNotes()
  
  const [nextId, setNextId] = useState<number>(() => {
    if (notes.length > 0) {
      return Math.max(...notes.map((note) => note.id)) + 1
    }
    return 1
  })
  
  const [showTitleInput, setShowTitleInput] = useState(false)
  const [newNoteTitle, setNewNoteTitle] = useState("")
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const titleInputRef = useRef<HTMLInputElement | null>(null)
  
  // Listen for create-new-note event from Header
  useEffect(() => {
    const handleCreateNewNote = () => {
      initiateNewNote()
    }
    
    document.addEventListener('create-new-note', handleCreateNewNote)
    
    return () => {
      document.removeEventListener('create-new-note', handleCreateNewNote)
    }
  }, [])

  // Generate a unique note title
  const generateUniqueNoteTitle = (baseTitle: string): string => {
    let title = baseTitle
    let counter = 1

    // Check if the title already exists
    while (notes.some((note) => note.noteTitle === title)) {
      title = `${baseTitle} ${counter}`
      counter++
    }

    return title
  }

  const initiateNewNote = () => {
    setNewNoteTitle("")
    setShowTitleInput(true)
  }
  
  // Focus title input when it appears
  useEffect(() => {
    if (showTitleInput && titleInputRef.current) {
      titleInputRef.current.focus()
    }
  }, [showTitleInput])

  const createNewNote = async (customTitle?: string) => {
    // Use the custom title if provided, otherwise use default
    const titleBase = customTitle && customTitle.trim() !== "" 
      ? customTitle 
      : `Note ${nextId}`
      
    // Create a unique title for the new note
    const uniqueTitle = generateUniqueNoteTitle(titleBase)

    // Create an empty file immediately
    const result = await createEmptyNoteFile(uniqueTitle)

    const newNote: Note = {
      id: nextId,
      content: "",
      createdAt: new Date(),
      noteTitle: uniqueTitle,
      filePath: result.success ? result.filePath : undefined,
    }

    // Add the note to the context
    addNote(newNote)
    
    setNextId(nextId + 1)
    setShowTitleInput(false)

    // Focus the editor after a proper delay to ensure components are rendered
    // Use a slightly longer timeout to ensure DOM is fully updated
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.focus()
      }
    }, 150) // Increased timeout for more reliable focus
  }

  const handleTitleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createNewNote(newNoteTitle)
  }

  const cancelTitleInput = () => {
    setShowTitleInput(false)
  }

  // Get activeNote state from context
  const activeNote = selectedNoteId ? notes.find(note => note.id === selectedNoteId) : null

  return (
    <div className="w-full mx-auto h-full flex flex-col">

      {/* Title Input Modal */}
      {showTitleInput && (
        <TitleModal
          handleTitleSubmit={handleTitleSubmit}
          titleInputRef={titleInputRef}
          newNoteTitle={newNoteTitle}
          setNewNoteTitle={setNewNoteTitle}
          cancelTitleInput={cancelTitleInput}
        />
      )}

      <div className="border border-gray-200 rounded-lg px-4 pt-4 bg-white flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-hidden">
          {activeNote ? (
            <ContextNoteEditor ref={editorRef} />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-gray-400 text-center">
                <p className="text-lg mb-4">Start typing...</p>
                <p className="text-sm">
                  Click the + button to create a new note
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
