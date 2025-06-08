"use client"

import List from "@/components/sidebar/sidebar"
import FontSwitcher from "@/components/theme/font-switcher"
import { useAppState } from "@/lib/state/app-state"
import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { generateUniqueTitle } from "@/lib/data-processing/title-generator"
import { Notes } from "@/components/notes/notes"
import { Header } from "@/components/navigation/header"
import { AuthDialog } from "@/components/auth/auth-dialog"
import { TitleModal } from "@/components/modals/title-modal"
import ExportDialog from "@/components/modals/export-dialog"
import PortalImportDialog from "@/components/modals/portal-import-dialog"
import { logger } from "@/lib/utils/logger"
import { 
  NoteErrorBoundary,
  SidebarErrorBoundary,
  EditorErrorBoundary,
  NoteErrorDetector,
  RecoveryBanner
} from "@/components/error-handling"

export default function Home() {
  // Use our consolidated app state instead of separate state and DOM events
  const { 
    isSidebarOpen, 
    setSidebarOpen, 
    toggleSidebar, 
    isCreatingNote, 
    setCreatingNote,
    selectNote,
    addNote,
    notes,
    selectedNoteId
  } = useAppState()
  
  // State for modals
  const [showTitleModal, setShowTitleModal] = useState(false)
  const [titleInput, setTitleInput] = useState('')
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const { toast } = useToast()
  
  // Get the currently selected note
  const currentNote = selectedNoteId ? notes.find((note: any) => note.id === selectedNoteId) : null
  
  // Listen for note creation requests
  useEffect(() => {
    if (isCreatingNote) {
      try {
        // Use the notes from props instead of calling useAppState() inside useEffect
        const suggestedTitle = generateUniqueTitle(notes.map((note: any) => note.noteTitle))
        setTitleInput(suggestedTitle)
        setShowTitleModal(true)
        logger.debug('Opening title modal with suggested title:', suggestedTitle)
      } catch (error) {
        logger.error('Error preparing note creation:', error)
        toast({
          title: 'Error',
          description: 'Failed to prepare note creation. Please try again.',
          variant: 'destructive',
        })
        setCreatingNote(false)
      }
    }
  }, [isCreatingNote, toast, setCreatingNote, notes])
  
  // Define event handlers outside useEffect to avoid hooks rule violations
  const handleToggleExportDialog = (event: Event) => {
    logger.debug('Export dialog toggle event received')
    setIsExportModalOpen(prev => !prev)
  }
  
  const handleToggleImportDialog = (event: Event) => {
    logger.debug('Import dialog toggle event received')
    setIsImportModalOpen(prev => !prev)
  }
  
  // Listen for dialog toggle events
  useEffect(() => {
    // Use the correct event type
    window.addEventListener('toggle-export-dialog', handleToggleExportDialog)
    window.addEventListener('toggle-import-dialog', handleToggleImportDialog)
    return () => {
      window.removeEventListener('toggle-export-dialog', handleToggleExportDialog)
      window.removeEventListener('toggle-import-dialog', handleToggleImportDialog)
    }
  }, [])

  // Create a new note with the given title
  const createNewNote = async (title: string) => {
    try {
      const newNote = await addNote(title)
      toast({
        title: "Note created",
        description: `"${title}" has been created successfully.`,
      })
      
      // Clear the title input field
      setTitleInput('')
      
      // Close the modal
      setShowTitleModal(false)
      setCreatingNote(false)
      
      // Select the new note to open the editor immediately
      if (newNote && newNote.id) {
        selectNote(newNote.id)
      }
    } catch (error) {
      logger.error("Error creating note:", error)
      toast({
        title: "Error creating note",
        description: "There was a problem creating your note. Please try again.",
        variant: "destructive",
      })
    }
  }
  
  // Handle title submission
  const handleTitleSubmit = (title: string) => {
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your note.",
        variant: "destructive",
      })
      return
    }
    
    createNewNote(title)
  }
  
  // Cancel title input
  const cancelTitleInput = () => {
    setShowTitleModal(false)
    setCreatingNote(false)
  }
  
  const handleNewNote = () => {
    // Prevent multiple clicks
    if (isCreatingNote) return
    
    // Set creating state
    setCreatingNote(true)
    
    // Close sidebar on mobile when creating a new note
    setSidebarOpen(false)
  }
  
  const mainContent = (
    <FontSwitcher>
      <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden">
        <Header 
          onNewNote={handleNewNote}
          toggleSidebar={toggleSidebar}
          isSidebarOpen={isSidebarOpen}
          isCreatingNote={isCreatingNote}
        />
        
        {/* Use CSS variables for header height to ensure consistent calculations */}
        <style jsx global>{`
          :root {
            --header-height: 56px;
            --sidebar-width: 300px;
          }
          @media (max-width: 768px) {
            :root {
              --header-height: 56px;
              --sidebar-width: 100%;
            }
          }
        `}</style>
        
        <main className="flex-1 grid gap-0 sm:gap-3 md:grid-cols-[var(--sidebar-width)_1fr] lg:grid-cols-[24%_75%] overflow-hidden relative main-content h-[calc(100vh-var(--header-height))]">
          {/* Mobile overlay to close sidebar when clicking outside */}
          {isSidebarOpen && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-30 z-20 md:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-hidden="true"
            />
          )}
          <SidebarErrorBoundary>
            <div className="h-[calc(100vh-var(--header-height))] ">
              <List 
                isSidebarOpen={isSidebarOpen}
                onSelectNote={(note) => selectNote(note.id)}
              />
            </div>
          </SidebarErrorBoundary>
          <div className="p-2 overflow-hidden editor-container mx-2 my-2 border border-gray-200 dark:border-gray-700 rounded-md">
            <EditorErrorBoundary>
              <NoteErrorBoundary>
                <Notes />
              </NoteErrorBoundary>
            </EditorErrorBoundary>
          </div>
        </main>
        {/* Dialogs at root level for proper display */}
        <AuthDialog />
        
        {/* Title Modal for creating new notes */}
        <TitleModal
          isOpen={showTitleModal}
          onClose={cancelTitleInput}
          onSubmit={handleTitleSubmit}
          initialValue={titleInput}
          title="Create New Note"
          description="Enter a title for your new note"
        />
        
        {/* Export Dialog for exporting notes */}
        <ExportDialog
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          currentNote={currentNote}
          allNotes={notes}
        />
        
        {/* Import Dialog moved to root level */}
        
        {/* No shortcuts modal needed */}
      </div>
    </FontSwitcher>
  )

  // Render ImportDialog at the root level for proper positioning
  return (
    <>
      {mainContent}
      <PortalImportDialog
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />
    </>
  )
}
