/**
 * Network State Manager
 * Handles offline/online transitions and prevents data loss during network issues
 */

import { Note } from '@/types';
import { logger } from './logger';
import { dataProtectionService } from './data-protection';

export interface NetworkState {
  isOnline: boolean;
  lastOnlineTime: number;
  offlineDuration: number;
  connectionType?: string;
  effectiveType?: string;
}

export interface QueuedOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  noteId: number;
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

export class NetworkStateManager {
  private isOnline: boolean = navigator.onLine;
  private lastOnlineTime: number = Date.now();
  private operationQueue: QueuedOperation[] = [];
  private syncInProgress: boolean = false;
  private listeners: Map<string, (state: NetworkState) => void> = new Map();
  private retryTimeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    if (typeof window === 'undefined') return;

    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));

    // Load queued operations from localStorage
    this.loadQueuedOperations();

    // Periodic sync attempt when online
    setInterval(() => {
      if (this.isOnline && this.operationQueue.length > 0) {
        this.processSyncQueue();
      }
    }, 30000); // Every 30 seconds

    // Save queue to localStorage periodically
    setInterval(() => {
      this.saveQueuedOperations();
    }, 5000); // Every 5 seconds
  }

  private handleOnline(): void {
    const wasOffline = !this.isOnline;
    this.isOnline = true;
    this.lastOnlineTime = Date.now();

    logger.info('Network connection restored');

    if (wasOffline) {
      // Create backup before syncing offline changes
      dataProtectionService.createBackup();
      
      // Emit network state change
      this.emitStateChange();
      
      // Process any queued operations
      this.processSyncQueue();
      
      // Emit reconnection event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('network-reconnected', {
          detail: { 
            offlineDuration: this.getOfflineDuration(),
            queuedOperations: this.operationQueue.length
          }
        }));
      }
    }
  }

  private handleOffline(): void {
    this.isOnline = false;
    
    logger.warn('Network connection lost - queuing operations');
    
    // Create backup when going offline
    dataProtectionService.createBackup();
    
    // Emit network state change
    this.emitStateChange();
    
    // Emit offline event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('network-disconnected', {
        detail: { timestamp: Date.now() }
      }));
    }
  }

  private emitStateChange(): void {
    const state = this.getNetworkState();
    this.listeners.forEach(listener => {
      try {
        listener(state);
      } catch (error) {
        logger.error('Error in network state listener:', error);
      }
    });
  }

  /**
   * Get current network state
   */
  public getNetworkState(): NetworkState {
    return {
      isOnline: this.isOnline,
      lastOnlineTime: this.lastOnlineTime,
      offlineDuration: this.getOfflineDuration(),
      connectionType: this.getConnectionType(),
      effectiveType: this.getEffectiveType()
    };
  }

  private getOfflineDuration(): number {
    return this.isOnline ? 0 : Date.now() - this.lastOnlineTime;
  }

  private getConnectionType(): string | undefined {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    return connection?.type;
  }

  private getEffectiveType(): string | undefined {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    return connection?.effectiveType;
  }

  /**
   * Queue an operation for when network is available
   */
  public queueOperation(
    type: QueuedOperation['type'],
    noteId: number,
    data: any,
    maxRetries: number = 3
  ): string {
    const operation: QueuedOperation = {
      id: this.generateOperationId(),
      type,
      noteId,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries
    };

    this.operationQueue.push(operation);
    this.saveQueuedOperations();

    logger.debug(`Queued ${type} operation for note ${noteId}`);

    // If online, try to process immediately
    if (this.isOnline) {
      this.processSyncQueue();
    }

    return operation.id;
  }

  private generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Process the sync queue
   */
  private async processSyncQueue(): Promise<void> {
    if (this.syncInProgress || !this.isOnline || this.operationQueue.length === 0) {
      return;
    }

    this.syncInProgress = true;
    logger.info(`Processing sync queue: ${this.operationQueue.length} operations`);

    const operationsToProcess = [...this.operationQueue];
    
    for (const operation of operationsToProcess) {
      try {
        const success = await this.processOperation(operation);
        
        if (success) {
          // Remove from queue
          this.operationQueue = this.operationQueue.filter(op => op.id !== operation.id);
          this.clearRetryTimeout(operation.id);
          logger.debug(`Successfully processed operation ${operation.id}`);
        } else {
          // Increment retry count
          operation.retryCount++;
          
          if (operation.retryCount >= operation.maxRetries) {
            // Max retries reached, remove from queue but log as failed
            this.operationQueue = this.operationQueue.filter(op => op.id !== operation.id);
            logger.error(`Operation ${operation.id} failed after ${operation.maxRetries} retries`);
            
            // Emit failure event
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('sync-operation-failed', {
                detail: { operation }
              }));
            }
          } else {
            // Schedule retry
            this.scheduleRetry(operation);
          }
        }
      } catch (error) {
        logger.error(`Error processing operation ${operation.id}:`, error);
        operation.retryCount++;
        
        if (operation.retryCount >= operation.maxRetries) {
          this.operationQueue = this.operationQueue.filter(op => op.id !== operation.id);
        } else {
          this.scheduleRetry(operation);
        }
      }
    }

    this.saveQueuedOperations();
    this.syncInProgress = false;
  }

  private async processOperation(operation: QueuedOperation): Promise<boolean> {
    // This would integrate with your Firebase/backend services
    // For now, we'll simulate the operation
    
    try {
      switch (operation.type) {
        case 'create':
          return await this.processCreateOperation(operation);
        case 'update':
          return await this.processUpdateOperation(operation);
        case 'delete':
          return await this.processDeleteOperation(operation);
        default:
          logger.warn(`Unknown operation type: ${operation.type}`);
          return false;
      }
    } catch (error) {
      logger.error(`Operation processing failed:`, error);
      return false;
    }
  }

  private async processCreateOperation(operation: QueuedOperation): Promise<boolean> {
    // Integrate with your note creation service
    logger.debug(`Processing create operation for note ${operation.noteId}`);
    
    // Check if note still exists locally (user might have deleted it)
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    const note = notes.find((n: Note) => n.id === operation.noteId);
    
    if (!note) {
      logger.warn(`Note ${operation.noteId} no longer exists, skipping create operation`);
      return true; // Consider this success since the note is gone
    }
    
    // Here you would call your Firebase or backend service
    // For now, we'll just simulate success
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return true;
  }

  private async processUpdateOperation(operation: QueuedOperation): Promise<boolean> {
    logger.debug(`Processing update operation for note ${operation.noteId}`);
    
    // Check if note still exists locally
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    const note = notes.find((n: Note) => n.id === operation.noteId);
    
    if (!note) {
      logger.warn(`Note ${operation.noteId} no longer exists, skipping update operation`);
      return true; // Consider this success since the note is gone
    }
    
    // Here you would call your Firebase or backend service
    // For now, we'll just simulate success
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return true;
  }

  private async processDeleteOperation(operation: QueuedOperation): Promise<boolean> {
    logger.debug(`Processing delete operation for note ${operation.noteId}`);
    
    // Here you would call your Firebase or backend service
    // For now, we'll just simulate success
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return true;
  }

  private scheduleRetry(operation: QueuedOperation): void {
    const retryDelay = Math.min(1000 * Math.pow(2, operation.retryCount), 30000); // Exponential backoff, max 30s
    
    const timeout = setTimeout(() => {
      if (this.isOnline) {
        this.processSyncQueue();
      }
    }, retryDelay);
    
    this.retryTimeouts.set(operation.id, timeout);
    logger.debug(`Scheduled retry for operation ${operation.id} in ${retryDelay}ms`);
  }

  private clearRetryTimeout(operationId: string): void {
    const timeout = this.retryTimeouts.get(operationId);
    if (timeout) {
      clearTimeout(timeout);
      this.retryTimeouts.delete(operationId);
    }
  }

  private loadQueuedOperations(): void {
    try {
      const stored = localStorage.getItem('sync_queue');
      if (stored) {
        this.operationQueue = JSON.parse(stored);
        logger.debug(`Loaded ${this.operationQueue.length} queued operations`);
      }
    } catch (error) {
      logger.error('Failed to load queued operations:', error);
      this.operationQueue = [];
    }
  }

  private saveQueuedOperations(): void {
    try {
      localStorage.setItem('sync_queue', JSON.stringify(this.operationQueue));
    } catch (error) {
      logger.error('Failed to save queued operations:', error);
    }
  }

  /**
   * Register a listener for network state changes
   */
  public onStateChange(id: string, listener: (state: NetworkState) => void): void {
    this.listeners.set(id, listener);
  }

  /**
   * Unregister a network state listener
   */
  public offStateChange(id: string): void {
    this.listeners.delete(id);
  }

  /**
   * Get the number of queued operations
   */
  public getQueuedOperationsCount(): number {
    return this.operationQueue.length;
  }

  /**
   * Clear all queued operations (use with caution)
   */
  public clearQueue(): void {
    this.operationQueue = [];
    this.saveQueuedOperations();
    
    // Clear all retry timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
    this.retryTimeouts.clear();
  }

  /**
   * Force sync attempt
   */
  public forcSync(): void {
    if (this.isOnline) {
      this.processSyncQueue();
    } else {
      logger.warn('Cannot force sync: network is offline');
    }
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline.bind(this));
      window.removeEventListener('offline', this.handleOffline.bind(this));
    }
    
    this.clearQueue();
    this.listeners.clear();
  }
}

// Export singleton instance
export const networkStateManager = new NetworkStateManager();
