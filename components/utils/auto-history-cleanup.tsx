"use client";

import { useEffect, useRef } from 'react';
import { useAppState } from '@/lib/state/app-state';
import { pruneHistoryEntries } from '@/lib/edit-history';
import { localStorageNotesService } from '@/lib/storage/local-storage-notes';

/**
 * Maximum number of history entries to keep per note
 */
const MAX_HISTORY_ENTRIES = 10;

/**
 * Interval for cleanup in milliseconds (every 5 minutes)
 */
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Component that automatically cleans up edit history to prevent memory leaks
 * This component doesn't render anything visible, it just runs cleanup logic in the background
 */
export function AutoHistoryCleanup() {
  const { notes } = useAppState();
  const cleanupTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastCleanupRef = useRef<number>(0);

  // Function to clean up history entries
  const performCleanup = () => {
    // Skip if no notes
    if (!notes || notes.length === 0) return;

    // Get current time
    const now = Date.now();
    
    // Skip if last cleanup was less than interval ago (prevents excessive cleanup)
    if (now - lastCleanupRef.current < CLEANUP_INTERVAL_MS) return;
    
    // Update last cleanup timestamp
    lastCleanupRef.current = now;
    
    try {
      // Process each note's history
      notes.forEach(note => {
        try {
          // Get history from localStorage
          const history = localStorageNotesService.getNoteHistory(note.id);
          
          if (history && history.length > MAX_HISTORY_ENTRIES) {
            // Prune history to keep only the most recent entries
            const prunedHistory = pruneHistoryEntries(history, MAX_HISTORY_ENTRIES);
            
            // Save the pruned history back to localStorage
            if (prunedHistory.length < history.length) {
              localStorageNotesService.updateNoteData(note.id, {
                editHistory: prunedHistory
              });
            }
          }
        } catch (error) {
          // Silently catch errors for individual notes to prevent breaking the app
          console.error(`Error cleaning up history for note ${note.id}:`, error);
        }
      });
    } catch (error) {
      console.error('Error during automatic history cleanup:', error);
    }
  };

  useEffect(() => {
    // Run initial cleanup
    performCleanup();
    
    // Set up interval for periodic cleanup
    cleanupTimerRef.current = setInterval(performCleanup, CLEANUP_INTERVAL_MS);
    
    // Clean up on unmount
    return () => {
      if (cleanupTimerRef.current) {
        clearInterval(cleanupTimerRef.current);
        cleanupTimerRef.current = null;
      }
    };
  }, [notes]);

  // This component doesn't render anything
  return null;
}

export default AutoHistoryCleanup;
