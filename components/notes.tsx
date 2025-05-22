"use client"

import { useState, useRef, useEffect } from "react"
import TitleModal from "./title-modal"
import { useNotes } from "@/contexts/note-context"
import ContextNoteEditor from "./context-note-editor"
import type { Note } from "@/types"

export function Notes() {
  const { notes, addNote, selectedNoteId, isLoading } = useNotes()
  
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

    try {
      // Create the note through the context which now uses server actions
      const newNote = await addNote(uniqueTitle)
      
      // Update the next ID after successful creation
      setNextId(prev => prev + 1)
      setShowTitleInput(false)
      
      // Dispatch event to notify that the note creation process is complete
      document.dispatchEvent(new CustomEvent('note-modal-closed'))
    } catch (error) {
      console.error("Failed to create new note:", error)
      // You could add error handling UI here
    }

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
    
    // Add validation to prevent empty titles
    if (newNoteTitle.trim() === '') {
      // Could show an error message here
      // For now, just use the default title
      createNewNote()
    } else {
      createNewNote(newNoteTitle)
    }
  }

  const cancelTitleInput = () => {
    setShowTitleInput(false)
    // Dispatch event to notify that the modal was closed
    document.dispatchEvent(new CustomEvent('note-modal-closed'))
  }

  // Get activeNote state from context
  const activeNote = selectedNoteId ? notes.find(note => note.id === selectedNoteId) : null

  return (
    <div className="w-full mx-auto max-h-[calc(100vh_-_70px)] h-screen flex flex-col">

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

      <div className="border border-gray-200 rounded-lg px-4 pt-4 bg-white flex-1 flex flex-col overflow-auto">
        <div className="flex-1 overflow-hidden">
          {activeNote ? (
            <ContextNoteEditor ref={editorRef} />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-gray-400 text-center">
                {isLoading ? (
                  <>
                    <p className="text-lg mb-4">Loading notes...</p>
                    <div className="animate-spin h-6 w-6 border-2 border-blue-500 rounded-full border-t-transparent mx-auto"></div>
                  </>
                ) : notes.length > 0 ? (
                  <>
                    <p className="text-lg mb-4">Select a note to begin</p>
                    <p className="text-sm">Select a note from the sidebar or create a new one</p>
                  </>
                ) : (
                  <>
                    <p className="text-lg mb-4">Start typing...</p>
                    <p className="text-sm">Click the + button to create a new note</p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
