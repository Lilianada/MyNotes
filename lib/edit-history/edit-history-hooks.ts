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
    if (!note) return;
    
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
  }, [note]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (note && note.id) {
        try {
          // Clean up specifically for the current note
          editHistoryService.cleanupTracking(note.id);
          isInitializedRef.current.delete(note.id);
        } catch (error) {
          console.error(`Error during cleanup for note ${note.id}:`, error);
        }
      } else {
        // Fallback to full cleanup when no note exists
        try {
          editHistoryService.cleanup();
        } catch (error) {
          console.error('Error during general cleanup:', error);
        }
      }
    };
  }, [note]);

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
    const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
      if (!note) return;
      
      // Check if there are unsaved changes
      const hasUnsavedChanges = lastContentRef.current && lastContentRef.current !== note.content;
      
      if (note && hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        
        try {
          // Make sure we're saving with the correct note ID
          console.log(`[EditHistory] Saving note ${note.id} before unload`);
          await forceSave(lastContentRef.current, 'update');
        } catch (error) {
          console.error('Failed to save on page unload:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [note, forceSave]);

  return {
    handleContentChange,
    handleSave
  };
}
