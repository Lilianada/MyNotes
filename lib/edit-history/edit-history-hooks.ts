"use client";

import { useEffect, useRef, useCallback } from 'react';
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

  // Initialize tracking when note changes
  useEffect(() => {
    if (note && !isInitializedRef.current.has(note.id)) {
      editHistoryService.initializeTracking(note.id, note.content);
      isInitializedRef.current.add(note.id);
    }
  }, [note]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      editHistoryService.cleanup();
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
  const { trackContentChange, forceSave } = useEditHistory(note, isAdmin, user, config);
  const lastContentRef = useRef<string>('');

  // Enhanced content change handler with history tracking
  const handleContentChange = useCallback((newContent: string) => {
    // Call original handler
    onContentChange(newContent);
    
    // Track change for history
    if (newContent !== lastContentRef.current) {
      trackContentChange(newContent);
      lastContentRef.current = newContent;
    }
  }, [onContentChange, trackContentChange]);

  // Enhanced save handler with history
  const handleSave = useCallback(async () => {
    if (note) {
      try {
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
      if (note && lastContentRef.current && lastContentRef.current !== note.content) {
        e.preventDefault();
        e.returnValue = '';
        
        try {
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
