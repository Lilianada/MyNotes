"use client"

import { useRef } from "react"
import { ContextNoteEditor } from "@/components/editor/context-note-editor"
import { useAppState } from "@/lib/state/app-state"

export function Notes() {
  const { 
    isLoading,
    selectedNote
  } = useAppState()
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 dark:border-gray-100"></div>
      </div>
    )
  }
  
  // Show empty state when no note is selected
  if (!selectedNote) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <div className="max-w-md">
          <p className="text-base text-gray-600 dark:text-gray-300 mb-2 font-medium">
            "Make things as simple as possible, but not simpler.""
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
    <div className="w-full mx-auto max-h-[calc(100vh_-_70px)] h-full flex flex-col">
      {/* <div className="border border-gray-200 rounded-lg px-4 pt-4 bg-white dark:bg-gray-800 dark:border-gray-700 flex-1 flex flex-col overflow-auto">
      </div> */}
        <div className="flex-1 overflow-hidden">
          <ContextNoteEditor key={selectedNote.id} note={selectedNote} />
        </div>
    </div>
  )
}
