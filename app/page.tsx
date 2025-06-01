"use client"

import List from "@/components/sidebar/sidebar"
import FontSwitcher from "@/components/theme/font-switcher"
import { useState, useEffect } from "react"
import { useNotes } from "@/contexts/notes/note-context"
import { Notes } from "@/components/notes/notes"
import { Header } from "@/components/navigation/header"
import { NoteErrorDetector } from "@/components/error-handling/note-error-detector"

export default function Home() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isCreatingNote, setIsCreatingNote] = useState(false)
  const { notes, selectNote } = useNotes()
  
  useEffect(() => {
    const handleCloseSidebar = () => {
      setIsSidebarOpen(false)
    }
    
    document.addEventListener('close-sidebar', handleCloseSidebar)
    
    return () => {
      document.removeEventListener('close-sidebar', handleCloseSidebar)
    }
  }, [])
  
  // Listen for when the modal is closed
  useEffect(() => {
    const handleModalClosed = () => {
      setIsCreatingNote(false)
    }
    
    document.addEventListener('note-modal-closed', handleModalClosed)
    
    return () => {
      document.removeEventListener('note-modal-closed', handleModalClosed)
    }
  }, [])
  
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }
  
  const handleNewNote = () => {
    // Prevent multiple clicks
    if (isCreatingNote) return
    
    // Set creating state
    setIsCreatingNote(true)
    
    // This will be passed to Notes
    document.dispatchEvent(new CustomEvent('create-new-note'))
    // Close sidebar on mobile when creating a new note
    setIsSidebarOpen(false)
  }
  
  return (
    <FontSwitcher>
      <div className="max-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden">
        <Header 
          onNewNote={handleNewNote}
          toggleSidebar={toggleSidebar}
          isSidebarOpen={isSidebarOpen}
          isCreatingNote={isCreatingNote}
        />
        
        <main className="flex-1 grid gap-0 sm:gap-3 md:grid-cols-[300px_1fr] lg:grid-cols-[24%_75%] overflow-hidden relative main-content">
          {/* Mobile overlay to close sidebar when clicking outside */}
          {isSidebarOpen && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-30 z-20 md:hidden"
              onClick={() => {
                setIsSidebarOpen(false);
              }}
              aria-hidden="true"
            />
          )}
          <List 
            isSidebarOpen={isSidebarOpen}
            onSelectNote={(note) => {
              selectNote(note.id)
            }}
          />
          <div className="p-2 w-full overflow-hidden editor-container">
            <Notes />
          </div>
        </main>
      </div>
    </FontSwitcher>
  )
}
