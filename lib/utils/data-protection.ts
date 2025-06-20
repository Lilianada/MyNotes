/**
 * Data Protection Utilities
 * Comprehensive data loss prevention and recovery mechanisms
 */

import { Note, NoteEditHistory } from '@/types';
import { logger } from './logger';
import { crossTabProtectionService } from './cross-tab-protection';

// Storage quota monitoring
const STORAGE_WARNING_THRESHOLD = 0.8; // 80% of quota
const STORAGE_CRITICAL_THRESHOLD = 0.95; // 95% of quota

// Backup configuration
const BACKUP_INTERVAL = 30000; // 30 seconds
const MAX_BACKUPS = 10;
const BACKUP_KEY_PREFIX = 'backup_';

export interface DataProtectionConfig {
  enableAutoBackup: boolean;
  enableQuotaMonitoring: boolean;
  enableCrashRecovery: boolean;
  enableConcurrencyProtection: boolean;
  backupInterval: number;
  maxBackups: number;
}

const DEFAULT_CONFIG: DataProtectionConfig = {
  enableAutoBackup: true,
  enableQuotaMonitoring: true,
  enableCrashRecovery: true,
  enableConcurrencyProtection: true,
  backupInterval: BACKUP_INTERVAL,
  maxBackups: MAX_BACKUPS,
};

export class DataProtectionService {
  private config: DataProtectionConfig;
  private backupTimer: NodeJS.Timeout | null = null;
  private lastBackupTime = 0;
  private isBackupInProgress = false;
  private saveLocks = new Set<number>(); // Track notes being saved
  private pendingSaves = new Map<number, string>(); // Queue saves during locks

  constructor(config: Partial<DataProtectionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initialize();
  }

  private initialize(): void {
    if (typeof window === 'undefined') return;

    if (this.config.enableAutoBackup) {
      this.startAutoBackup();
    }

    if (this.config.enableQuotaMonitoring) {
      this.monitorStorageQuota();
    }

    if (this.config.enableCrashRecovery) {
      this.enableCrashRecovery();
    }

    if (this.config.enableConcurrencyProtection) {
      this.enableConcurrencyProtection();
    }

    // Listen for page unload to save pending data
    window.addEventListener('beforeunload', this.handlePageUnload.bind(this));
    window.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
  }

  /**
   * Create a backup of all notes
   */
  async createBackup(): Promise<boolean> {
    if (this.isBackupInProgress) return false;
    if (typeof window === 'undefined') return false;

    try {
      this.isBackupInProgress = true;
      const timestamp = Date.now();
      
      // Get current notes
      const notesData = localStorage.getItem('notes');
      if (!notesData) return false;

      const notes: Note[] = JSON.parse(notesData);
      
      // Create backup object
      const backup = {
        timestamp,
        version: '1.0',
        noteCount: notes.length,
        data: notes,
        editHistory: this.collectEditHistory(notes),
      };

      const backupKey = `${BACKUP_KEY_PREFIX}${timestamp}`;
      
      // Try to save backup
      try {
        localStorage.setItem(backupKey, JSON.stringify(backup));
        this.lastBackupTime = timestamp;
        
        // Clean up old backups
        this.cleanupOldBackups();
        
        logger.debug(`Backup created: ${backupKey} (${notes.length} notes)`);
        return true;
      } catch (quotaError) {
        logger.warn('Backup failed due to storage quota, attempting cleanup');
        
        // Emergency cleanup and retry
        this.emergencyCleanup();
        localStorage.setItem(backupKey, JSON.stringify(backup));
        return true;
      }
    } catch (error) {
      logger.error('Failed to create backup:', error);
      return false;
    } finally {
      this.isBackupInProgress = false;
    }
  }

  /**
   * Collect edit history for all notes
   */
  private collectEditHistory(notes: Note[]): Record<number, NoteEditHistory[]> {
    const historyMap: Record<number, NoteEditHistory[]> = {};
    
    notes.forEach(note => {
      try {
        const historyData = localStorage.getItem(`note_history_${note.id}`);
        if (historyData) {
          historyMap[note.id] = JSON.parse(historyData);
        }
      } catch (error) {
        logger.warn(`Failed to collect history for note ${note.id}:`, error);
      }
    });

    return historyMap;
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup(timestamp?: number): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    try {
      let backupKey: string;
      
      if (timestamp) {
        backupKey = `${BACKUP_KEY_PREFIX}${timestamp}`;
      } else {
        // Find the most recent backup
        const backups = this.getAvailableBackups();
        if (backups.length === 0) {
          logger.warn('No backups available for restoration');
          return false;
        }
        backupKey = backups[0].key;
      }

      const backupData = localStorage.getItem(backupKey);
      if (!backupData) {
        logger.error(`Backup not found: ${backupKey}`);
        return false;
      }

      const backup = JSON.parse(backupData);
      
      // Validate backup structure
      if (!backup.data || !Array.isArray(backup.data)) {
        logger.error('Invalid backup structure');
        return false;
      }

      // Create safety backup of current data before restoration
      await this.createBackup();

      // Restore notes
      localStorage.setItem('notes', JSON.stringify(backup.data));

      // Restore edit history if available
      if (backup.editHistory) {
        Object.entries(backup.editHistory).forEach(([noteId, history]) => {
          try {
            localStorage.setItem(`note_history_${noteId}`, JSON.stringify(history));
          } catch (error) {
            logger.warn(`Failed to restore history for note ${noteId}:`, error);
          }
        });
      }

      logger.info(`Successfully restored ${backup.noteCount} notes from backup ${backupKey}`);
      return true;
    } catch (error) {
      logger.error('Failed to restore from backup:', error);
      return false;
    }
  }

  /**
   * Get list of available backups
   */
  getAvailableBackups(): Array<{ key: string; timestamp: number; noteCount: number }> {
    if (typeof window === 'undefined') return [];

    const backups: Array<{ key: string; timestamp: number; noteCount: number }> = [];
    
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(BACKUP_KEY_PREFIX)) {
        try {
          const backupData = localStorage.getItem(key);
          if (backupData) {
            const backup = JSON.parse(backupData);
            backups.push({
              key,
              timestamp: backup.timestamp,
              noteCount: backup.noteCount || 0,
            });
          }
        } catch (error) {
          logger.warn(`Invalid backup found: ${key}`);
        }
      }
    });

    // Sort by timestamp (newest first)
    return backups.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Clean up old backups
   */
  private cleanupOldBackups(): void {
    const backups = this.getAvailableBackups();
    
    if (backups.length > this.config.maxBackups) {
      const toDelete = backups.slice(this.config.maxBackups);
      toDelete.forEach(backup => {
        try {
          localStorage.removeItem(backup.key);
          logger.debug(`Removed old backup: ${backup.key}`);
        } catch (error) {
          logger.warn(`Failed to remove backup ${backup.key}:`, error);
        }
      });
    }
  }

  /**
   * Emergency cleanup when storage quota is exceeded
   */
  private emergencyCleanup(): void {
    logger.warn('Performing emergency cleanup due to storage quota');
    
    // Remove all but the most recent backup
    const backups = this.getAvailableBackups();
    if (backups.length > 1) {
      backups.slice(1).forEach(backup => {
        try {
          localStorage.removeItem(backup.key);
        } catch (error) {
          // Ignore cleanup errors
        }
      });
    }

    // Clean up old cursor positions
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('cursor_positions') || key.startsWith('editor_state')) {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    });
  }

  /**
   * Monitor storage quota and warn when approaching limits
   */
  private async monitorStorageQuota(): Promise<void> {
    if (typeof navigator === 'undefined' || !navigator.storage?.estimate) return;

    try {
      const estimate = await navigator.storage.estimate();
      if (estimate.quota && estimate.usage) {
        const usageRatio = estimate.usage / estimate.quota;
        
        if (usageRatio > STORAGE_CRITICAL_THRESHOLD) {
          this.handleStorageCritical();
        } else if (usageRatio > STORAGE_WARNING_THRESHOLD) {
          this.handleStorageWarning();
        }
      }
    } catch (error) {
      logger.warn('Failed to monitor storage quota:', error);
    }
  }

  /**
   * Handle storage warning
   */
  private handleStorageWarning(): void {
    logger.warn('Storage usage approaching limit');
    
    // Emit custom event for UI to handle
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('storage-warning', {
        detail: { level: 'warning' }
      }));
    }
  }

  /**
   * Handle critical storage situation
   */
  private handleStorageCritical(): void {
    logger.error('Storage usage critical - emergency cleanup needed');
    
    this.emergencyCleanup();
    
    // Emit custom event for UI to handle
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('storage-warning', {
        detail: { level: 'critical' }
      }));
    }
  }

  /**
   * Enable crash recovery
   */
  private enableCrashRecovery(): void {
    // Set a flag that we're running
    localStorage.setItem('app_running', Date.now().toString());
    
    // Check if we crashed last time
    const lastRunning = localStorage.getItem('app_last_running');
    if (lastRunning) {
      const lastTime = parseInt(lastRunning);
      const now = Date.now();
      const timeSinceLastRun = now - lastTime;
      
      // If more than 5 minutes since last update, consider it a crash
      if (timeSinceLastRun > 5 * 60 * 1000) {
        logger.warn('Potential crash detected, checking for unsaved data');
        this.handleCrashRecovery();
      }
    }

    // Update the running timestamp periodically
    setInterval(() => {
      localStorage.setItem('app_running', Date.now().toString());
    }, 10000); // Every 10 seconds
  }

  /**
   * Enable concurrency protection
   */
  private enableConcurrencyProtection(): void {
    // Set up cross-tab synchronization
    crossTabProtectionService.onSyncEvent('data-protection', (event) => {
      if (event.type === 'note-updated' && event.note) {
        // Check if we have pending changes for this note
        if (this.pendingSaves.has(event.noteId!)) {
          logger.warn(`Concurrent edit detected for note ${event.noteId}`);
          
          // Create a backup before resolving conflict
          this.createBackup();
          
          // Emit conflict event for UI to handle
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('edit-conflict', {
              detail: { 
                noteId: event.noteId,
                externalNote: event.note,
                localContent: this.pendingSaves.get(event.noteId!)
              }
            }));
          }
        }
      }
    });
  }

  /**
   * Handle edit conflict
   */
  private handleEditConflict(noteId: number, externalNote: Note, localContent: string): void {
    // For now, prioritize local changes and create a backup
    // In a more sophisticated implementation, we could show a merge dialog
    
    logger.warn(`Edit conflict for note ${noteId}, preserving local changes`);
    
    // Create backup with conflicted state
    this.createBackup();
    
    // Emit event for UI to show conflict notification
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('storage-warning', {
        detail: { 
          level: 'warning',
          message: 'Edit conflict detected - your changes have been preserved'
        }
      }));
    }
  }
  private handleCrashRecovery(): void {
    // Emit event for UI to handle crash recovery
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('crash-detected', {
        detail: { 
          hasBackups: this.getAvailableBackups().length > 0 
        }
      }));
    }
  }

  /**
   * Handle page unload
   */
  private handlePageUnload(): void {
    // Mark that we're no longer running
    localStorage.setItem('app_last_running', localStorage.getItem('app_running') || '0');
    localStorage.removeItem('app_running');
    
    // Save any pending data synchronously
    this.flushPendingSaves();
  }

  /**
   * Handle visibility change
   */
  private handleVisibilityChange(): void {
    if (document.visibilityState === 'hidden') {
      // App is hidden, save critical data
      this.flushPendingSaves();
    }
  }

  /**
   * Flush pending saves synchronously
   */
  private flushPendingSaves(): void {
    // Process any pending saves
    this.pendingSaves.forEach((content, noteId) => {
      try {
        const notes = JSON.parse(localStorage.getItem('notes') || '[]');
        const noteIndex = notes.findIndex((n: Note) => n.id === noteId);
        if (noteIndex !== -1) {
          notes[noteIndex].content = content;
          notes[noteIndex].updatedAt = new Date();
          localStorage.setItem('notes', JSON.stringify(notes));
        }
      } catch (error) {
        logger.error(`Failed to flush save for note ${noteId}:`, error);
      }
    });
    
    this.pendingSaves.clear();
  }

  /**
   * Safe save with concurrency protection and cross-tab awareness
   */
  async safeSave(noteId: number, content: string, saveFunction: () => Promise<void>): Promise<boolean> {
    // Check if this note is already being saved
    if (this.saveLocks.has(noteId)) {
      // Queue the save
      this.pendingSaves.set(noteId, content);
      logger.debug(`Queued save for note ${noteId} (already saving)`);
      return true;
    }

    // Check for concurrent edits from other tabs
    if (crossTabProtectionService.hasOtherActiveTabs()) {
      // Use cross-tab safe update
      const success = await crossTabProtectionService.safeUpdate('notes', (notes: Note[] | null) => {
        if (!notes) return [];
        
        const noteIndex = notes.findIndex(n => n.id === noteId);
        if (noteIndex !== -1) {
          notes[noteIndex] = {
            ...notes[noteIndex],
            content,
            updatedAt: new Date()
          };
        }
        
        return notes;
      });
      
      if (success) {
        // Emit sync event to other tabs
        crossTabProtectionService.emitSyncEvent({
          type: 'note-updated',
          noteId,
          note: { id: noteId, content } as Note
        });
        
        return true;
      }
    }

    try {
      // Lock the note for saving
      this.saveLocks.add(noteId);
      
      // Perform the save
      await saveFunction();
      
      // Check if there's a newer save queued
      const queuedContent = this.pendingSaves.get(noteId);
      if (queuedContent && queuedContent !== content) {
        // There's newer content, save it too
        this.pendingSaves.delete(noteId);
        setTimeout(() => {
          this.safeSave(noteId, queuedContent, saveFunction);
        }, 100);
      }
      
      return true;
    } catch (error) {
      logger.error(`Failed to save note ${noteId}:`, error);
      
      // Keep the content in pending saves for retry
      this.pendingSaves.set(noteId, content);
      return false;
    } finally {
      // Always unlock
      this.saveLocks.delete(noteId);
    }
  }

  /**
   * Start auto backup
   */
  private startAutoBackup(): void {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
    }

    this.backupTimer = setInterval(() => {
      this.createBackup();
    }, this.config.backupInterval);
  }

  /**
   * Stop auto backup
   */
  stopAutoBackup(): void {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
      this.backupTimer = null;
    }
  }

  /**
   * Cleanup and shutdown
   */
  shutdown(): void {
    this.stopAutoBackup();
    this.flushPendingSaves();
    
    // Cleanup cross-tab protection
    crossTabProtectionService.offSyncEvent('data-protection');
    
    if (typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', this.handlePageUnload);
      window.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }
}

// Export singleton instance
export const dataProtectionService = new DataProtectionService();

// Export utility functions
export function isStorageAvailable(): boolean {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

export async function getStorageUsage(): Promise<{ used: number; available: number; percentage: number } | null> {
  if (typeof navigator === 'undefined' || !navigator.storage?.estimate) {
    return null;
  }
  
  try {
    const estimate = await navigator.storage.estimate();
    return {
      used: estimate.usage || 0,
      available: estimate.quota || 0,
      percentage: estimate.quota ? (estimate.usage || 0) / estimate.quota : 0,
    };
  } catch {
    return null;
  }
}
