"use client"

import React from 'react'
import ErrorBoundary from './error-boundary'
import { useToast } from '@/components/ui/use-toast'
import { useAppState } from '@/lib/state/app-state'

interface EditorErrorBoundaryProps {
  children: React.ReactNode
}

/**
 * Editor-specific error boundary that provides a specialized fallback UI
 * and handles editor-related errors appropriately
 */
export function EditorErrorBoundary({ children }: EditorErrorBoundaryProps) {
  const { toast } = useToast()
  const { selectedNote, selectNote } = useAppState()
  
  const handleError = (error: Error) => {
    // Log the error with context
    console.error('Editor component error:', {
      error: error.message,
      stack: error.stack,
      noteId: selectedNote?.id,
      noteTitle: selectedNote?.noteTitle
    })
    
    // Show a toast notification
    toast({
      title: 'Editor Error',
      description: 'There was a problem with the editor. We\'ve reset it for you.',
      variant: 'destructive',
    })
  }
  
  const handleReset = () => {
    // Reset the editor by clearing the selected note
    selectNote(null) // This is valid as selectNote accepts number | null
    
    // Show feedback
    toast({
      title: 'Editor Reset',
      description: 'The editor has been reset. You can select a note to continue.',
      variant: 'default',
    })
  }
  
  const fallbackUI = (
    <div className="h-full flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 rounded-md border border-gray-200 dark:border-gray-700">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 text-center">
        <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg 
            className="h-6 w-6 text-amber-600 dark:text-amber-400" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor" 
            aria-hidden="true"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
            />
          </svg>
        </div>
        
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          Editor Error
        </h3>
        
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          We encountered an issue with the editor. Your note content is safe, but we need to reset the editor.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <button
            onClick={handleReset}
            className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/50 dark:hover:bg-amber-900/70 text-amber-800 dark:text-amber-200 rounded-md text-sm font-medium"
          >
            Reset Editor
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md text-sm font-medium"
          >
            Reload Page
          </button>
        </div>
      </div>
    </div>
  )
  
  return (
    <ErrorBoundary 
      fallback={fallbackUI} 
      onError={handleError}
    >
      {children}
    </ErrorBoundary>
  )
}
