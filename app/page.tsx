"use client"

import List from "@/components/List"
import FontSwitcher from "@/components/font-switcher"
import { useState, useEffect } from "react"
import { useNotes } from "@/contexts/note-context"
import { SimpleNotes } from "@/components/simple-notes"
import { Header } from "@/components/header"

export default function Home() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
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
  
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }
  
  const handleNewNote = () => {
    // This will be passed to SimpleNotes
    document.dispatchEvent(new CustomEvent('create-new-note'))
    // Close sidebar on mobile when creating a new note
    setIsSidebarOpen(false)
  }
  
  return (
    <FontSwitcher>
      <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
        <Header 
          onNewNote={handleNewNote}
          toggleSidebar={toggleSidebar}
          isSidebarOpen={isSidebarOpen}
        />
        <main className="flex-1 grid gap-4 md:grid-cols-[24%_75%] overflow-hidden relative">
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
          <div className="p-4">
            <SimpleNotes />
          </div>
        </main>
      </div>
    </FontSwitcher>
  )
}
