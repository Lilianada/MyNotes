"use client"

import React from 'react'
import ErrorBoundary from './error-boundary'
import { useToast } from '@/components/ui/use-toast'

interface NoteErrorBoundaryProps {
  children: React.ReactNode
}

/**
 * Note-specific error boundary that provides a specialized fallback UI
 * and handles note-related errors appropriately
 */
export function NoteErrorBoundary({ children }: NoteErrorBoundaryProps) {
  const { toast } = useToast()
  
  const handleError = (error: Error) => {
    // Log the error
    console.error('Note component error:', error)
    
    // Show a toast notification
    toast({
      title: 'Error in note component',
      description: error.message || 'An unexpected error occurred while rendering the note',
      variant: 'destructive',
    })
  }
  
  const fallbackUI = (
    <div className="p-4 rounded-md bg-gray-50 border border-gray-200">
      <div className="text-center py-8">
        <svg 
          className="mx-auto h-12 w-12 text-gray-400" 
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
        <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading note</h3>
        <p className="mt-1 text-sm text-gray-500">
          We encountered an issue while loading this note. Please try again or select a different note.
        </p>
        <div className="mt-6">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Refresh page
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
