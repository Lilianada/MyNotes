"use client";

import { Note, NoteEditHistory } from '@/types';
import { firebaseNotesService } from '@/lib/firebase/firebase-notes';
import { localStorageNotesService } from '@/lib/storage/local-storage-notes';
import { 
  EditHistoryConfig, 
  DEFAULT_EDIT_HISTORY_CONFIG, 
  shouldCreateHistoryEntry, 
  createHistoryEntry, 
  pruneHistoryEntries 
} from './index';

/**
 * Enhanced edit history service with autosave and intelligent change detection
 */
export class EditHistoryService {
  private config: EditHistoryConfig;
  private pendingChanges: Map<number, string> = new Map(); // Track pending content changes
  private lastSavedContent: Map<number, string> = new Map(); // Track last saved content
  private autosaveTimers: Map<number, NodeJS.Timeout> = new Map(); // Track autosave timers

  constructor(config?: EditHistoryConfig) {
    this.config = config || DEFAULT_EDIT_HISTORY_CONFIG;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<EditHistoryConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Track content change and schedule autosave
   */
  trackContentChange(
    noteId: number,
    newContent: string,
    isAdmin: boolean,
    user: { uid: string } | null | undefined
  ): void {
    // Store the pending change
    this.pendingChanges.set(noteId, newContent);

    // Clear existing timer for this note
    const existingTimer = this.autosaveTimers.get(noteId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new timer for autosave
    const timer = setTimeout(() => {
      this.performAutosave(noteId, isAdmin, user);
    }, this.config.autosaveInterval);

    this.autosaveTimers.set(noteId, timer);
  }

  /**
   * Perform autosave - always save current state when leaving note
   */
  private async performAutosave(
    noteId: number,
    isAdmin: boolean,
    user: { uid: string } | null | undefined
  ): Promise<void> {
    try {
      const newContent = this.pendingChanges.get(noteId);
      if (!newContent) return;

      const lastContent = this.lastSavedContent.get(noteId) || '';

      // Always create history entry on note leave - remove significance check to prevent data loss
      console.log(`[EditHistory] Performing autosave for note ${noteId}`);

      // Create history entry
      const historyEntry = createHistoryEntry(lastContent, newContent, 'autosave');
      
      // Save to storage with history
      await this.saveWithHistory(noteId, newContent, historyEntry, isAdmin, user);

      // Update tracking
      this.lastSavedContent.set(noteId, newContent);
      this.pendingChanges.delete(noteId);
      this.autosaveTimers.delete(noteId);

      console.log(`[EditHistory] Autosaved note ${noteId} with ${historyEntry.changePercentage?.toFixed(1)}% changes`);
    } catch (error) {
      console.error(`[EditHistory] Failed to autosave note ${noteId}:`, error);
    }
  }

  /**
   * Force save with history entry
   */
  async forceSave(
    noteId: number,
    content: string,
    editType: NoteEditHistory['editType'],
    isAdmin: boolean,
    user: { uid: string } | null | undefined
  ): Promise<void> {
    try {
      const lastContent = this.lastSavedContent.get(noteId) || '';
      const historyEntry = createHistoryEntry(lastContent, content, editType);
      
      await this.saveWithHistory(noteId, content, historyEntry, isAdmin, user);
      
      // Update tracking
      this.lastSavedContent.set(noteId, content);
      this.pendingChanges.delete(noteId);
      
      // Clear any pending autosave
      const timer = this.autosaveTimers.get(noteId);
      if (timer) {
        clearTimeout(timer);
        this.autosaveTimers.delete(noteId);
      }

      console.log(`[EditHistory] Force saved note ${noteId} with type: ${editType}`);
    } catch (error) {
      console.error(`[EditHistory] Failed to force save note ${noteId}:`, error);
      throw error;
    }
  }

  /**
   * Save content with history entry
   */
  private async saveWithHistory(
    noteId: number,
    content: string,
    historyEntry: NoteEditHistory,
    isAdmin: boolean,
    user: { uid: string } | null | undefined
  ): Promise<void> {
    if (user && firebaseNotesService) {
      // Use Firebase for all authenticated users (both admin and regular)
      const currentNote = await firebaseNotesService.getNote(noteId, user.uid, isAdmin);
      if (!currentNote) {
        throw new Error(`Note ${noteId} not found`);
      }

      // Add new history entry and prune old ones
      const updatedHistory = pruneHistoryEntries(
        [historyEntry, ...(currentNote.editHistory || [])],
        this.config.maxVersions
      );

      // Update note with new content and history (pass userId and isAdmin)
      await firebaseNotesService.updateNoteData(noteId, {
        content,
        editHistory: updatedHistory,
        updatedAt: new Date()
      }, user.uid, isAdmin);
    } else {
      // Handle localStorage
      const notes = localStorageNotesService.getNotes();
      const noteIndex = notes.findIndex(note => note.id === noteId);
      
      if (noteIndex === -1) {
        throw new Error(`Note ${noteId} not found in localStorage`);
      }

      const currentNote = notes[noteIndex];
      
      // Add new history entry and prune old ones
      const updatedHistory = pruneHistoryEntries(
        [historyEntry, ...(currentNote.editHistory || [])],
        this.config.maxVersions
      );

      // Update note
      localStorageNotesService.updateNoteData(noteId, {
        content,
        editHistory: updatedHistory,
        updatedAt: new Date()
      });
    }
  }

  /**
   * Get edit history for a note
   */
  async getHistory(
    noteId: number,
    isAdmin: boolean,
    user: { uid: string } | null | undefined
  ): Promise<NoteEditHistory[]> {
    try {
      if (user && firebaseNotesService) {
        return await firebaseNotesService.getNoteHistory(noteId, user.uid, isAdmin);
      } else {
        return localStorageNotesService.getNoteHistory(noteId);
      }
    } catch (error) {
      console.error(`[EditHistory] Failed to get history for note ${noteId}:`, error);
      return [];
    }
  }

  /**
   * Initialize tracking for a note
   */
  initializeTracking(noteId: number, initialContent: string): void {
    this.lastSavedContent.set(noteId, initialContent);
    this.pendingChanges.delete(noteId);
    
    // Clear any existing timer
    const existingTimer = this.autosaveTimers.get(noteId);
    if (existingTimer) {
      clearTimeout(existingTimer);
      this.autosaveTimers.delete(noteId);
    }
  }

  /**
   * Clean up tracking for a note (call when note is closed/deleted)
   */
  cleanupTracking(noteId: number): void {
    this.lastSavedContent.delete(noteId);
    this.pendingChanges.delete(noteId);
    
    const timer = this.autosaveTimers.get(noteId);
    if (timer) {
      clearTimeout(timer);
      this.autosaveTimers.delete(noteId);
    }
  }

  /**
   * Cleanup all tracking (call on app unmount)
   */
  cleanup(): void {
    // Clear all timers
    this.autosaveTimers.forEach(timer => clearTimeout(timer));
    
    // Clear all tracking
    this.lastSavedContent.clear();
    this.pendingChanges.clear();
    this.autosaveTimers.clear();
  }
}

// Create singleton instance
export const editHistoryService = new EditHistoryService();
