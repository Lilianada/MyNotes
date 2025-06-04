"use client"

import React from 'react'
import ErrorBoundary from './error-boundary'
import { useToast } from '@/components/ui/use-toast'
import { useAppState } from '@/lib/state/app-state'

interface AppErrorBoundaryProps {
  children: React.ReactNode
}

/**
 * Application-level error boundary that provides a specialized fallback UI
 * and handles global application errors appropriately
 */
export function AppErrorBoundary({ children }: AppErrorBoundaryProps) {
  const { toast } = useToast()
  const { isAuthenticated, user } = useAppState()
  
  const handleError = (error: Error) => {
    // Log the error with user context (but no PII)
    console.error('Application error:', {
      error: error.message,
      stack: error.stack,
      isAuthenticated,
      userId: user?.uid ? `${user.uid.slice(0, 4)}...` : 'none'
    })
    
    // Show a toast notification
    toast({
      title: 'Application Error',
      description: 'We encountered an unexpected error. Please try refreshing the page.',
      variant: 'destructive',
    })
  }
  
  const fallbackUI = (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 text-center">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg 
            className="h-8 w-8 text-red-600 dark:text-red-400" 
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
        
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Something went wrong
        </h2>
        
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
          We encountered an unexpected error. Your data is safe, but we need to reload the application.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-sm"
          >
            Reload Application
          </button>
          
          <a
            href="/"
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 text-sm"
          >
            Go to Home
          </a>
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
