"use client";

import { useEffect, useRef, useCallback, useState } from 'react';
import { Note, NoteEditHistory } from '@/types';
import { editHistoryService } from './edit-history-service';
import { EditHistoryConfig, DEFAULT_EDIT_HISTORY_CONFIG } from './index';
import { logger } from '@/lib/utils/logger';

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
        logger.error('Error during history cleanup:', error);
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
  const { trackContentChange, cleanupCurrentNote } = useEditHistory(note, isAdmin, user, config);
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
    
    // Call original handler immediately for UI responsiveness
    onContentChange(newContent);
    
    // Update our reference
    lastContentRef.current = newContent;
    
    // Track change for autosave (NOT for history - that will be determined by autosave logic)
    // This will only trigger autosave, not history creation
    trackContentChange(newContent);
  }, [note, onContentChange, trackContentChange]);

  // Enhanced save handler - since saving is automatic, this is just a trigger
  const handleSave = useCallback(async () => {
    if (note) {
      try {
        // Since saving is automatic, we just need to call the original save handler
        // The automatic save system will handle the actual saving
        onSave();
      } catch (error) {
        logger.error('Error in save handler:', error);
        // Still call original save handler as fallback
        onSave();
      }
    }
  }, [note, onSave]);

  return {
    handleContentChange,
    handleSave
  };
}
