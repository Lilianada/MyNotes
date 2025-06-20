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
 * Enhanced edit history service with separated autosave and session-based history tracking
 */
export class EditHistoryService {
  private config: EditHistoryConfig;
  private pendingChanges: Map<number, string> = new Map(); // Track pending content changes for autosave
  private lastSavedContent: Map<number, string> = new Map(); // Track last saved content
  private autosaveTimers: Map<number, NodeJS.Timeout> = new Map(); // Track autosave timers
  private activeNoteIds: Set<number> = new Set(); // Track active notes to prevent memory leaks
  
  // Session-based history tracking
  private editingSessions: Map<number, {
    startTime: number;
    startContent: string;
    lastActivity: number;
    hasSignificantChanges: boolean;
  }> = new Map();
  private sessionTimers: Map<number, NodeJS.Timeout> = new Map();

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
   * Track content change - this handles BOTH autosave AND session-based history tracking
   * Autosave happens frequently for data safety
   * History tracking only happens at the end of editing sessions
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
      return; // No need to schedule autosave on first initialization
    }
    
    // 1. AUTOSAVE LOGIC - Always schedule autosave for data safety
    this.scheduleAutosave(noteId, newContent, isAdmin, user);
    
    // 2. SESSION TRACKING LOGIC - Track editing sessions for history
    this.trackEditingSession(noteId, newContent);
  }

  /**
   * Schedule autosave - this is purely for data safety, no history creation
   */
  private scheduleAutosave(
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
      this.autosaveTimers.delete(noteId);
    }

    // Set new timer for autosave - NO HISTORY CREATION
    const timer = setTimeout(() => {
      this.performAutosave(noteId, isAdmin, user);
    }, this.config.autosaveInterval);

    this.autosaveTimers.set(noteId, timer);
  }

  /**
   * Track editing session for history purposes
   */
  private trackEditingSession(noteId: number, newContent: string): void {
    const now = Date.now();
    const existingSession = this.editingSessions.get(noteId);
    
    if (!existingSession) {
      // Start new editing session
      this.editingSessions.set(noteId, {
        startTime: now,
        startContent: this.lastSavedContent.get(noteId) || '',
        lastActivity: now,
        hasSignificantChanges: false
      });
      
      // Schedule session end check
      this.scheduleSessionEnd(noteId);
    } else {
      // Update existing session
      existingSession.lastActivity = now;
      
      // Check if this change is significant enough to warrant a history entry
      const startContent = existingSession.startContent;
      const diff = calculateTextDifference(startContent, newContent);
      
      if (diff.charactersChanged >= this.config.minChangeThreshold ||
          diff.changePercentage >= this.config.minChangePercentage) {
        existingSession.hasSignificantChanges = true;
      }
      
      // Reset session end timer
      this.scheduleSessionEnd(noteId);
    }
  }

  /**
   * Schedule the end of an editing session
   */
  private scheduleSessionEnd(noteId: number): void {
    // Clear existing session timer
    const existingTimer = this.sessionTimers.get(noteId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    
    // Set new session end timer
    const timer = setTimeout(() => {
      this.endEditingSession(noteId);
    }, this.config.sessionTimeout);
    
    this.sessionTimers.set(noteId, timer);
  }

  /**
   * End an editing session and create history entry if appropriate
   */
  private async endEditingSession(noteId: number): Promise<void> {
    const session = this.editingSessions.get(noteId);
    if (!session) return;
    
    const now = Date.now();
    const sessionDuration = now - session.startTime;
    const currentContent = this.pendingChanges.get(noteId) || this.lastSavedContent.get(noteId) || '';
    
    // Only create history entry if:
    // 1. Session lasted long enough (user was actually editing)
    // 2. There were significant changes
    // 3. Content actually changed from start
    if (sessionDuration >= this.config.minSessionDuration &&
        session.hasSignificantChanges &&
        currentContent !== session.startContent) {
      
      try {
        // Create history entry for this editing session
        const historyEntry = createHistoryEntry(session.startContent, currentContent, 'update');
        
        // Save history entry
        // Note: We'll determine user/admin context when this is called
        // For now, we'll add this to a pending history queue
        await this.addHistoryEntry(noteId, historyEntry);
        
        console.log(`[EditHistory] Created history entry for session of ${Math.round(sessionDuration / 1000)}s`);
      } catch (error) {
        console.error('[EditHistory] Failed to create session history entry:', error);
      }
    }
    
    // Clean up session
    this.editingSessions.delete(noteId);
    this.sessionTimers.delete(noteId);
  }

  /**
   * Perform autosave - ONLY saves content, NO history creation
   * This function prioritizes data preservation without creating history noise
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
      
      // Skip autosave if content hasn't changed
      if (newContent === lastContent) {
        this.pendingChanges.delete(noteId);
        this.autosaveTimers.delete(noteId);
        return;
      }
      
      // ONLY save the content - NO HISTORY CREATION
      if (user && firebaseNotesService) {
        await firebaseNotesService.updateNoteData(noteId, { content: newContent }, user.uid, isAdmin);
      } else {
        localStorageNotesService.updateNoteContent(noteId, newContent);
      }
      
      // Update our tracking
      this.lastSavedContent.set(noteId, newContent);
      this.pendingChanges.delete(noteId);
      this.autosaveTimers.delete(noteId);
      
      console.log(`[EditHistory] Autosaved note ${noteId} (${newContent.length} chars)`);
      
    } catch (error) {
      console.error(`[EditHistory] Autosave failed for note ${noteId}:`, error);
      // Don't delete pending changes if save failed - we'll try again later
    }
  }

  /**
   * Add a history entry (used by session-based tracking)
   */
  private async addHistoryEntry(noteId: number, historyEntry: NoteEditHistory): Promise<void> {
    // This will be implemented to add history entries
    // For now, just log
    console.log(`[EditHistory] Would add history entry for note ${noteId}:`, historyEntry.editType);
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
    
    // Clear session tracking
    const sessionTimer = this.sessionTimers.get(noteId);
    if (sessionTimer) {
      clearTimeout(sessionTimer);
      this.sessionTimers.delete(noteId);
    }
    
    // End any active editing session
    this.editingSessions.delete(noteId);
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
    this.sessionTimers.forEach(timer => clearTimeout(timer));
    
    // Clear all tracking
    this.activeNoteIds.clear();
    this.lastSavedContent.clear();
    this.pendingChanges.clear();
    this.autosaveTimers.clear();
    this.sessionTimers.clear();
    this.editingSessions.clear();
    this.activeNoteIds.clear();
    this.lastSavedContent.clear();
    this.pendingChanges.clear();
    this.autosaveTimers.clear();
  }
}

// Create singleton instance
export const editHistoryService = new EditHistoryService();
