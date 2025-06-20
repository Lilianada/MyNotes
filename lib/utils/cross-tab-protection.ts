/**
 * Cross-Tab Protection Service
 * Handles conflicts and data synchronization between multiple browser tabs
 */

import { Note } from '@/types';
import { logger } from './logger';

export interface TabSyncEvent {
  type: 'note-updated' | 'note-deleted' | 'note-created' | 'notes-loaded';
  noteId?: number;
  note?: Note;
  timestamp: number;
  tabId: string;
}

export class CrossTabProtectionService {
  private tabId: string;
  private lastSyncTime: number = 0;
  private isProcessing = false;
  private listeners: Map<string, (event: TabSyncEvent) => void> = new Map();

  constructor() {
    this.tabId = this.generateTabId();
    this.initialize();
  }

  private generateTabId(): string {
    return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initialize(): void {
    if (typeof window === 'undefined') return;

    // Listen for storage events from other tabs
    window.addEventListener('storage', this.handleStorageEvent.bind(this));
    
    // Register this tab as active
    this.registerTab();
    
    // Clean up when tab is closed
    window.addEventListener('beforeunload', this.unregisterTab.bind(this));
    
    // Set up periodic sync check
    setInterval(() => this.checkForUpdates(), 5000);
  }

  private registerTab(): void {
    if (typeof window === 'undefined') return;

    try {
      const activeTabs = this.getActiveTabs();
      activeTabs[this.tabId] = {
        timestamp: Date.now(),
        lastActivity: Date.now()
      };
      
      localStorage.setItem('active_tabs', JSON.stringify(activeTabs));
    } catch (error) {
      logger.warn('Failed to register tab:', error);
    }
  }

  private unregisterTab(): void {
    if (typeof window === 'undefined') return;

    try {
      const activeTabs = this.getActiveTabs();
      delete activeTabs[this.tabId];
      localStorage.setItem('active_tabs', JSON.stringify(activeTabs));
    } catch (error) {
      logger.warn('Failed to unregister tab:', error);
    }
  }

  private getActiveTabs(): Record<string, { timestamp: number; lastActivity: number }> {
    try {
      const stored = localStorage.getItem('active_tabs');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  private handleStorageEvent(event: StorageEvent): void {
    if (!event.key || this.isProcessing) return;

    try {
      // Handle tab sync events
      if (event.key === 'tab_sync_event') {
        const syncEvent: TabSyncEvent = JSON.parse(event.newValue || '{}');
        
        // Ignore events from this tab
        if (syncEvent.tabId === this.tabId) return;
        
        // Ignore old events
        if (syncEvent.timestamp <= this.lastSyncTime) return;
        
        this.handleSyncEvent(syncEvent);
        this.lastSyncTime = syncEvent.timestamp;
      }
      
      // Handle direct localStorage changes
      if (event.key === 'notes' && event.newValue !== event.oldValue) {
        this.handleNotesChange(event);
      }
    } catch (error) {
      logger.error('Error handling storage event:', error);
    }
  }

  private handleSyncEvent(event: TabSyncEvent): void {
    // Emit to registered listeners
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        logger.error('Error in sync event listener:', error);
      }
    });
  }

  private handleNotesChange(event: StorageEvent): void {
    if (this.isProcessing) return;

    try {
      const oldNotes = event.oldValue ? JSON.parse(event.oldValue) : [];
      const newNotes = event.newValue ? JSON.parse(event.newValue) : [];
      
      // Detect changes
      const changes = this.detectChanges(oldNotes, newNotes);
      
      changes.forEach(change => {
        this.emitSyncEvent({
          type: change.type,
          noteId: change.noteId,
          note: change.note
        });
      });
    } catch (error) {
      logger.error('Error handling notes change:', error);
    }
  }

  private detectChanges(oldNotes: Note[], newNotes: Note[]): Array<{
    type: TabSyncEvent['type'];
    noteId: number;
    note?: Note;
  }> {
    const changes: Array<{ type: TabSyncEvent['type']; noteId: number; note?: Note }> = [];
    
    const oldNotesMap = new Map(oldNotes.map(note => [note.id, note]));
    const newNotesMap = new Map(newNotes.map(note => [note.id, note]));
    
    // Detect deletions
    oldNotesMap.forEach((note, id) => {
      if (!newNotesMap.has(id)) {
        changes.push({ type: 'note-deleted', noteId: id });
      }
    });
    
    // Detect additions and updates
    newNotesMap.forEach((note, id) => {
      const oldNote = oldNotesMap.get(id);
      if (!oldNote) {
        changes.push({ type: 'note-created', noteId: id, note });
      } else if (JSON.stringify(oldNote) !== JSON.stringify(note)) {
        changes.push({ type: 'note-updated', noteId: id, note });
      }
    });
    
    return changes;
  }

  /**
   * Emit a sync event to other tabs
   */
  public emitSyncEvent(event: Omit<TabSyncEvent, 'tabId' | 'timestamp'>): void {
    if (typeof window === 'undefined') return;

    try {
      const syncEvent: TabSyncEvent = {
        ...event,
        tabId: this.tabId,
        timestamp: Date.now()
      };
      
      localStorage.setItem('tab_sync_event', JSON.stringify(syncEvent));
      
      // Remove the event immediately to trigger storage event
      localStorage.removeItem('tab_sync_event');
    } catch (error) {
      logger.error('Failed to emit sync event:', error);
    }
  }

  /**
   * Register a listener for sync events
   */
  public onSyncEvent(id: string, listener: (event: TabSyncEvent) => void): void {
    this.listeners.set(id, listener);
  }

  /**
   * Unregister a sync event listener
   */
  public offSyncEvent(id: string): void {
    this.listeners.delete(id);
  }

  /**
   * Safe update - prevents conflicts during concurrent edits
   */
  public async safeUpdate<T>(
    key: string,
    updater: (current: T | null) => T,
    validator?: (value: T) => boolean
  ): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    try {
      this.isProcessing = true;
      
      // Get current value
      const currentStr = localStorage.getItem(key);
      const current = currentStr ? JSON.parse(currentStr) : null;
      
      // Apply update
      const updated = updater(current);
      
      // Validate if validator provided
      if (validator && !validator(updated)) {
        logger.warn(`Validation failed for key: ${key}`);
        return false;
      }
      
      // Save updated value
      localStorage.setItem(key, JSON.stringify(updated));
      
      return true;
    } catch (error) {
      logger.error(`Safe update failed for key ${key}:`, error);
      return false;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Check if there are other active tabs
   */
  public hasOtherActiveTabs(): boolean {
    const activeTabs = this.getActiveTabs();
    const now = Date.now();
    const fiveMinutesAgo = now - 5 * 60 * 1000;
    
    return Object.entries(activeTabs).some(([tabId, data]) => {
      return tabId !== this.tabId && data.lastActivity > fiveMinutesAgo;
    });
  }

  /**
   * Clean up old tab entries
   */
  private checkForUpdates(): void {
    try {
      // Update our activity timestamp
      const activeTabs = this.getActiveTabs();
      if (activeTabs[this.tabId]) {
        activeTabs[this.tabId].lastActivity = Date.now();
      }
      
      // Clean up inactive tabs (older than 10 minutes)
      const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
      Object.keys(activeTabs).forEach(tabId => {
        if (activeTabs[tabId].lastActivity < tenMinutesAgo) {
          delete activeTabs[tabId];
        }
      });
      
      localStorage.setItem('active_tabs', JSON.stringify(activeTabs));
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', this.handleStorageEvent.bind(this));
      window.removeEventListener('beforeunload', this.unregisterTab.bind(this));
    }
    
    this.unregisterTab();
    this.listeners.clear();
  }
}

// Global instance
export const crossTabProtectionService = new CrossTabProtectionService();
