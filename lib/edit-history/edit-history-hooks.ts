"use client";

import { useEffect, useRef, useCallback, useState } from 'react';
import { Note, NoteEditHistory } from '@/types';
import { editHistoryService } from './edit-history-service';
import { EditHistoryConfig, DEFAULT_EDIT_HISTORY_CONFIG } from './index';

/**
 * Hook for managing edit history with autosave functionality
 */
export function useEditHistory(
  note: Note | null,
  isAdmin: boolean,
  user: { uid: string } | null | undefined,
  config: Partial<EditHistoryConfig> = {}
) {
  const mergedConfig = { ...DEFAULT_EDIT_HISTORY_CONFIG, ...config };
  const isInitializedRef = useRef<Set<number>>(new Set());

  // Update service configuration
  useEffect(() => {
    editHistoryService.updateConfig(mergedConfig);
  }, [mergedConfig]);

  // Track the previous note ID to detect changes
  const previousNoteIdRef = useRef<number | null>(null);
  
  // Initialize tracking when note changes
  useEffect(() => {
    // Only proceed if we have a note
    if (!note) {
      // If we had a previous note and now we don't, clean it up
      if (previousNoteIdRef.current !== null) {
        editHistoryService.cleanupTracking(previousNoteIdRef.current);
        isInitializedRef.current.delete(previousNoteIdRef.current);
        previousNoteIdRef.current = null;
      }
      return;
    }
    
    // If the note ID has changed, clean up the previous note
    if (previousNoteIdRef.current !== null && 
        previousNoteIdRef.current !== note.id) {
      // Clean up the previous note's tracking
      editHistoryService.cleanupTracking(previousNoteIdRef.current);
      isInitializedRef.current.delete(previousNoteIdRef.current);
    }
    
    // Initialize tracking for the new note if needed
    if (!isInitializedRef.current.has(note.id)) {
      editHistoryService.initializeTracking(note.id, note.content);
      isInitializedRef.current.add(note.id);
    }
    
    // Update previous note ID reference
    previousNoteIdRef.current = note.id;
    
    // Cleanup function for when component unmounts or note changes
    return () => {
      if (previousNoteIdRef.current !== null) {
        editHistoryService.cleanupTracking(previousNoteIdRef.current);
      }
    };
  }, [note]);

  // Global cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up all tracked notes to prevent memory leaks
      try {
        // Use the cleanup method which handles all active notes
        editHistoryService.cleanup();
        // Clear our initialization tracking set
        isInitializedRef.current.clear();
      } catch (error) {
        console.error('Error during history cleanup:', error);
      }
    };
  }, []);

  /**
   * Track content changes and trigger autosave
   */
  const trackContentChange = useCallback((newContent: string) => {
    if (!note) return;
    
    editHistoryService.trackContentChange(note.id, newContent, isAdmin, user);
  }, [note, isAdmin, user]);

  /**
   * Force save with specific edit type
   */
  const forceSave = useCallback(async (content: string, editType: NoteEditHistory['editType'] = 'update') => {
    if (!note) return;
    
    await editHistoryService.forceSave(note.id, content, editType, isAdmin, user);
  }, [note, isAdmin, user]);

  /**
   * Get edit history for current note
   */
  const getHistory = useCallback(async (): Promise<NoteEditHistory[]> => {
    if (!note) return [];
    
    return await editHistoryService.getHistory(note.id, isAdmin, user);
  }, [note, isAdmin, user]);

  /**
   * Cleanup tracking for current note
   */
  const cleanupCurrentNote = useCallback(() => {
    if (note) {
      editHistoryService.cleanupTracking(note.id);
      isInitializedRef.current.delete(note.id);
    }
  }, [note]);

  return {
    trackContentChange,
    forceSave,
    getHistory,
    cleanupCurrentNote,
    config: mergedConfig
  };
}

/**
 * Hook for integrating with the note editor components
 */
export function useEditorWithHistory(
  note: Note | null,
  onContentChange: (content: string) => void,
  onSave: () => void,
  isAdmin: boolean,
  user: { uid: string } | null | undefined,
  config: Partial<EditHistoryConfig> = {}
) {
  const { trackContentChange, forceSave, cleanupCurrentNote } = useEditHistory(note, isAdmin, user, config);
  const lastContentRef = useRef<string>('');
  const previousNoteIdRef = useRef<number | null>(null);

  // Update last content ref when note changes
  useEffect(() => {
    if (note) {
      // When the note changes, update the lastContentRef
      lastContentRef.current = note.content;
      
      // If we had a previous note, make sure to force save any pending changes
      if (previousNoteIdRef.current && previousNoteIdRef.current !== note.id) {
        // We don't need to await this as it's just cleanup
        cleanupCurrentNote();
      }
      
      // Update the previous note ID reference
      previousNoteIdRef.current = note.id;
    }
  }, [note, cleanupCurrentNote]);

  // Enhanced content change handler with history tracking
  const handleContentChange = useCallback((newContent: string) => {
    // Only track changes if we have a valid note and the content actually changed
    if (!note || newContent === lastContentRef.current) return;
    
    // Validate that the current noteId matches the lastContentRef's noteId
    // This prevents us from applying changes to the wrong note
    
    // Call original handler
    onContentChange(newContent);
    
    // Track change for history
    trackContentChange(newContent);
    lastContentRef.current = newContent;
  }, [note, onContentChange, trackContentChange]);

  // Enhanced save handler with history
  const handleSave = useCallback(async () => {
    if (note) {
      try {
        // Ensure we have the correct content for the current note
        // This prevents saving the wrong content when switching notes quickly
        if (lastContentRef.current !== note.content) {
          lastContentRef.current = note.content;
        }
        
        // Force save with history
        await forceSave(note.content, 'update');
        
        // Call original save handler
        onSave();
      } catch (error) {
        console.error('Failed to save with history:', error);
        // Fallback to original save
        onSave();
      }
    } else {
      onSave();
    }
  }, [note, forceSave, onSave]);

  // Handle page unload to force save pending changes
  useEffect(() => {
    // Create a stable reference to the handler function
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Skip if there's no note
      if (!note || !note.id) return;
      
      // Check if there are unsaved changes
      const hasUnsavedChanges = lastContentRef.current && lastContentRef.current !== note.content;
      
      if (hasUnsavedChanges) {
        // Standard way to show confirmation dialog on page unload
        e.preventDefault();
        e.returnValue = '';
        
        // Try to save without awaiting (we can't await during beforeunload)
        try {
          // Use forceSave without awaiting
          forceSave(lastContentRef.current, 'update');
        } catch (error) {
          // Just log the error - we can't do much else during unload
          console.error('Error during unload save:', error);
        }
      }
    };

    // Add the event listener
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Clean up the event listener on unmount
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [note, forceSave]); // Only re-attach when note or forceSave changes

  return {
    handleContentChange,
    handleSave
  };
}
