"use client";

import { Note, NoteEditHistory } from '@/types';
import { firebaseNotesService } from '@/lib/firebase/firebase-notes';
import { localStorageNotesService } from '@/lib/storage/local-storage-notes';
import { 
  EditHistoryConfig, 
  DEFAULT_EDIT_HISTORY_CONFIG, 
  shouldCreateHistoryEntry, 
  createHistoryEntry, 
  pruneHistoryEntries,
  calculateTextDifference 
} from './index';

/**
 * Enhanced edit history service with autosave and intelligent change detection
 */
export class EditHistoryService {
  private config: EditHistoryConfig;
  private pendingChanges: Map<number, string> = new Map(); // Track pending content changes
  private lastSavedContent: Map<number, string> = new Map(); // Track last saved content
  private autosaveTimers: Map<number, NodeJS.Timeout> = new Map(); // Track autosave timers
  private activeNoteIds: Set<number> = new Set(); // Track active notes to prevent memory leaks

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
   * Only saves history for significant changes, not every keystroke
   */
  trackContentChange(
    noteId: number,
    newContent: string,
    isAdmin: boolean,
    user: { uid: string } | null | undefined
  ): void {
    // Safety check - ensure we're dealing with a valid noteId
    if (noteId === 0 || noteId === null || noteId === undefined) {
      console.warn('[EditHistory] Invalid noteId in trackContentChange:', noteId);
      return;
    }
    
    // Add to active notes set
    this.activeNoteIds.add(noteId);
    
    // Initialize tracking if this is the first change for this note
    if (!this.lastSavedContent.has(noteId)) {
      this.initializeTracking(noteId, newContent);
      return; // No need to schedule autosave on first change
    }
    
    // Store the pending change
    this.pendingChanges.set(noteId, newContent);

    // Clear existing timer for this note
    const existingTimer = this.autosaveTimers.get(noteId);
    if (existingTimer) {
      clearTimeout(existingTimer);
      this.autosaveTimers.delete(noteId); // Ensure we clean up the map entry
    }

    // Set new timer for autosave - use longer interval to prevent excessive saves
    const timer = setTimeout(() => {
      this.performAutosave(noteId, isAdmin, user);
    }, this.config.autosaveInterval);

    this.autosaveTimers.set(noteId, timer);
  }

  /**
   * Perform autosave - only save when significant changes are detected
   * This function saves content less frequently and only creates history entries for significant changes
   */
  private async performAutosave(
    noteId: number,
    isAdmin: boolean,
    user: { uid: string } | null | undefined
  ): Promise<void> {
    try {
      // Validate noteId
      if (!noteId || noteId <= 0) {
        console.warn(`[EditHistory] Invalid noteId in performAutosave: ${noteId}`);
        return;
      }
      
      const newContent = this.pendingChanges.get(noteId);
      
      // Skip autosave if there's no pending content change
      if (!newContent) {
        return;
      }

      // Make sure we have last saved content for this note
      if (!this.lastSavedContent.has(noteId)) {
        this.lastSavedContent.set(noteId, newContent);
        this.pendingChanges.delete(noteId);
        return;
      }

      const lastContent = this.lastSavedContent.get(noteId) || '';
      
      // Skip autosave if content hasn't changed or is empty
      if (newContent === lastContent || newContent.trim() === '') {
        this.pendingChanges.delete(noteId);
        this.autosaveTimers.delete(noteId);
        return;
      }
      
      // Check if the change is significant enough to warrant a history entry
      // This prevents creating history entries for minor edits like typo fixes
      // Calculate change metrics for logging regardless of whether we create a history entry
      const diff = calculateTextDifference(lastContent, newContent);
      
      // Determine if we should create a history entry - use stricter criteria
      const shouldAddHistory = shouldCreateHistoryEntry(lastContent, newContent, this.config);
      
      // Only create history entries for significant changes
      if (shouldAddHistory) {
        // Create history entry
        const historyEntry = createHistoryEntry(lastContent, newContent, 'autosave');
        
        // Save with history
        await this.saveWithHistory(noteId, newContent, historyEntry, isAdmin, user);
        
        // Update last saved content
        this.lastSavedContent.set(noteId, newContent);
      } else {
        // For minor changes, just save content without creating a history entry
        // This prevents history bloat while still preserving user's work
        if (user && firebaseNotesService) {
          await firebaseNotesService.updateNoteData(noteId, { content: newContent }, user.uid, isAdmin);
        } else {
          localStorageNotesService.updateNoteContent(noteId, newContent);
        }
        
        // Update last saved content
        this.lastSavedContent.set(noteId, newContent);
      }

      // Update tracking
      this.lastSavedContent.set(noteId, newContent);
      this.pendingChanges.delete(noteId);
      this.autosaveTimers.delete(noteId);

      console.log(`[EditHistory] Autosaved note ${noteId} with ${diff.changePercentage.toFixed(1)}% changes`);
    } catch (error) {
      console.error(`[EditHistory] Failed to autosave note ${noteId}:`, error);
    }
  }  /**
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
      // First verify this noteId exists in our tracking
      if (!this.lastSavedContent.has(noteId) && noteId !== 0) {
        // Initialize tracking if it doesn't exist yet
        this.initializeTracking(noteId, content);
      }
      
      const lastContent = this.lastSavedContent.get(noteId) || '';
      
      // Add some validation to prevent erroneous saves
      if (editType === 'update' && content.trim() === '') {
        console.warn(`[EditHistory] Prevented saving empty content for note ${noteId}`);
        return;
      }
      
      // Check if we already have history entries for this note
      let existingHistory: NoteEditHistory[] = [];
      
      // Get existing history to check for recent entries
      if (user && firebaseNotesService) {
        const note = await firebaseNotesService.getNote(noteId, user.uid, isAdmin);
        existingHistory = note?.editHistory || [];
      } else {
        const notes = localStorageNotesService.getNotes();
        const note = notes.find(n => n.id === noteId);
        existingHistory = note?.editHistory || [];
      }
      
      // Check if we have a recent entry (within the last minute)
      const now = new Date();
      const recentEntry = existingHistory[0]; // Most recent entry
      
      if (recentEntry && editType === 'update') {
        const entryTime = new Date(recentEntry.timestamp);
        const timeDiffMs = now.getTime() - entryTime.getTime();
        const timeDiffMinutes = timeDiffMs / (1000 * 60);
        
        // If we have an entry from less than 1 minute ago, just update content without new history
        if (timeDiffMinutes < 1) {
          // Just update content without creating a new history entry
          if (user && firebaseNotesService) {
            await firebaseNotesService.updateNoteData(noteId, { content }, user.uid, isAdmin);
          } else {
            localStorageNotesService.updateNoteContent(noteId, content);
          }
          
          // Update tracking
          this.lastSavedContent.set(noteId, content);
          this.pendingChanges.delete(noteId);
          
          // Clear any pending autosave
          const timer = this.autosaveTimers.get(noteId);
          if (timer) {
            clearTimeout(timer);
            this.autosaveTimers.delete(noteId);
          }
          return;
        }
      }
      
      // Create history entry for significant changes or explicit save requests
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
    // Validate parameters
    if (!noteId) {
      console.error(`[EditHistory] Invalid noteId in saveWithHistory: ${noteId}`);
      throw new Error(`Invalid noteId: ${noteId}`);
    }
    
    if (content === undefined || content === null) {
      console.error(`[EditHistory] Invalid content in saveWithHistory for note ${noteId}`);
      throw new Error(`Invalid content for note ${noteId}`);
    }
    
    // For cleanup operations, check if the note exists first to avoid errors
    if (historyEntry.editType === 'autosave' && !user) {
      // Skip the check if we're in test environment
      if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
        console.log(`[EditHistory] Skipping existence check during save - running in test environment`);
      } else if (localStorageNotesService && typeof localStorageNotesService.getNotes === 'function') {
        try {
          const notes = localStorageNotesService.getNotes();
          const noteExists = notes.some(note => note.id === noteId);
          
          if (!noteExists) {
            console.warn(`[EditHistory] Note ${noteId} not found during autosave cleanup - skipping save`);
            return;
          }
        } catch (error) {
          console.error(`[EditHistory] Error checking note existence during save: ${error}`);
          // Continue with the save operation to avoid data loss
        }
      } else {
        console.log(`[EditHistory] Skipping existence check - storage service unavailable`);
      }
    }
    
    if (user && firebaseNotesService) {
      // Use Firebase for all authenticated users (both admin and regular)
      const currentNote = await firebaseNotesService.getNote(noteId, user.uid, isAdmin);
      if (!currentNote) {
        console.error(`[EditHistory] Note ${noteId} not found in Firebase`);
        throw new Error(`Note ${noteId} not found`);
      }
      
      // Add safety check - verify the note's ID matches
      if (currentNote.id !== noteId) {
        console.error(`[EditHistory] Note ID mismatch: expected ${noteId}, got ${currentNote.id}`);
        throw new Error(`Note ID mismatch: expected ${noteId}, got ${currentNote.id}`);
      }

      // Add new history entry and prune old ones - limit to 15 entries max
      const MAX_HISTORY_ENTRIES = 15; // Hard limit of 15 entries per note
      const updatedHistory = pruneHistoryEntries(
        [historyEntry, ...(currentNote.editHistory || [])],
        Math.min(MAX_HISTORY_ENTRIES, this.config.maxVersions)
      );

      // Update note with new content and history (pass userId and isAdmin)
      await firebaseNotesService.updateNoteData(noteId, {
        content,
        editHistory: updatedHistory
      }, user.uid, isAdmin);    } else {
      // Handle localStorage
      const notes = localStorageNotesService.getNotes();
      const noteIndex = notes.findIndex(note => note.id === noteId);
      
      if (noteIndex === -1) {
        console.error(`[EditHistory] Note ${noteId} not found in localStorage`);
        throw new Error(`Note ${noteId} not found in localStorage`);
      }

      const currentNote = notes[noteIndex];
      
      // Add safety check - verify the note's ID matches
      if (currentNote.id !== noteId) {
        console.error(`[EditHistory] Note ID mismatch in localStorage: expected ${noteId}, got ${currentNote.id}`);
        throw new Error(`Note ID mismatch in localStorage: expected ${noteId}, got ${currentNote.id}`);
      }
      
      // Add new history entry and prune old ones - limit to 15 entries max
      const MAX_HISTORY_ENTRIES = 15; // Hard limit of 15 entries per note
      const updatedHistory = pruneHistoryEntries(
        [historyEntry, ...(currentNote.editHistory || [])],
        Math.min(MAX_HISTORY_ENTRIES, this.config.maxVersions)
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
    // Add to active notes set
    this.activeNoteIds.add(noteId);
    
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
    // Skip if noteId is invalid
    if (!noteId) return;

    // Save any pending changes before cleanup
    const pendingContent = this.pendingChanges.get(noteId);
    const lastContent = this.lastSavedContent.get(noteId);
    
    // We'll try to save the content if there are pending changes that are different
    // from the last saved content
    if (pendingContent && lastContent && pendingContent !== lastContent) {
      // Skip the save if we're running in test environment
      if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
        // Skip save in test environment
      } else {
        // In production, try to check if the note exists first
        try {
          // Safely check if service and method exist
          if (localStorageNotesService && typeof localStorageNotesService.getNotes === 'function') {
            const notes = localStorageNotesService.getNotes();
            const noteExists = notes.some(note => note.id === noteId);
            
            if (noteExists) {
              // No need to await, we're just ensuring the change gets queued
              this.forceSave(noteId, pendingContent, 'autosave', false, null)
                .catch(error => console.error(`[EditHistory] Error saving before cleanup: ${error}`));
            }
          }
        } catch (error) {
          // Just log the error without stopping cleanup
          console.error(`[EditHistory] Error checking note existence during cleanup: ${error}`);
        }
      }
    }
    
    // Remove from active notes set
    this.activeNoteIds.delete(noteId);
    
    // Clear tracking maps
    this.lastSavedContent.delete(noteId);
    this.pendingChanges.delete(noteId);
    
    // Clear any pending timer
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
    // Save any pending changes before cleanup
    this.activeNoteIds.forEach(noteId => {
      const pendingContent = this.pendingChanges.get(noteId);
      const lastContent = this.lastSavedContent.get(noteId);
      
      if (pendingContent && lastContent && pendingContent !== lastContent) {
        try {
          // Try to save pending changes without awaiting
          this.forceSave(noteId, pendingContent, 'autosave', false, null)
            .catch(() => {}); // Silently catch errors during cleanup
        } catch (error) {
          // Ignore errors during cleanup
        }
      }
    });
    
    // Clear all timers
    this.autosaveTimers.forEach(timer => clearTimeout(timer));
    
    // Clear all tracking
    this.activeNoteIds.clear();
    this.lastSavedContent.clear();
    this.pendingChanges.clear();
    this.autosaveTimers.clear();
  }
}

// Create singleton instance
export const editHistoryService = new EditHistoryService();
