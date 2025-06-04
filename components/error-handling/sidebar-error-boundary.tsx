"use client"

import React from 'react'
import ErrorBoundary from './error-boundary'
import { useToast } from '@/components/ui/use-toast'
import { useAppState } from '@/lib/state/app-state'

interface SidebarErrorBoundaryProps {
  children: React.ReactNode
}

/**
 * Sidebar-specific error boundary that provides a specialized fallback UI
 * and handles sidebar-related errors appropriately
 */
export function SidebarErrorBoundary({ children }: SidebarErrorBoundaryProps) {
  const { toast } = useToast()
  const { setSidebarOpen } = useAppState()
  
  const handleError = (error: Error) => {
    // Log the error with context
    console.error('Sidebar component error:', {
      error: error.message,
      stack: error.stack
    })
    
    // Show a toast notification
    toast({
      title: 'Sidebar Error',
      description: 'There was a problem with the sidebar. We\'ve reset it for you.',
      variant: 'destructive',
    })
  }
  
  const handleReset = () => {
    // Reset the sidebar by closing it and then reopening it
    setSidebarOpen(false)
    setTimeout(() => setSidebarOpen(true), 100)
    
    // Show feedback
    toast({
      title: 'Sidebar Reset',
      description: 'The sidebar has been reset.',
      variant: 'default',
    })
  }
  
  const fallbackUI = (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Notes</h3>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4">
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
        
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 text-center">
          We encountered an issue with the sidebar. Your notes are safe.
        </p>
        
        <div className="flex flex-col gap-2">
          <button
            onClick={handleReset}
            className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/50 dark:hover:bg-amber-900/70 text-amber-800 dark:text-amber-200 rounded-md text-sm font-medium"
          >
            Reset Sidebar
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
