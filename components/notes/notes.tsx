"use client"

import { useRef, useEffect } from "react"
import { UnifiedContextNoteEditor } from "@/components/editor/unified-context-note-editor"
import { useAppState } from "@/lib/state/use-app-state"
import { LoadingSpinner } from "@/components/ui/loading-states"

export function Notes() {
  const { 
    activeNote, 
    isLoading 
  } = useAppState()
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full" role="status" aria-live="polite">
        <LoadingSpinner className="scale-150" />
        <div className="sr-only">Loading notes</div>
      </div>
    )
  }
  
  // Show empty state when no note is selected
  if (!activeNote) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <div className="max-w-md">
          <p className="text-base text-gray-600 dark:text-gray-300 mb-2 font-medium">
            Make things as simple as possible, <br/> but not simpler.
          </p>
          <p className="text-xs text-blue-500 dark:text-blue-400 mb-6">
            - Albert Einstein
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Click the + button to create a new note
          </p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="w-full mx-auto h-full flex flex-col md:max-h-[calc(100vh_-_70px)]">
        <div className="flex-1 overflow-hidden">
          <UnifiedContextNoteEditor key={activeNote.id} note={activeNote} />
        </div>
    </div>
  )
}
