/**
 * Storage utilities for note management and tracking
 */

import { Note, UserStorage, StorageAlert } from '@/types';

/**
 * Generate a unique 6-8 character ID for notes
 */
export function generateUniqueId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Calculate file size of a note in bytes
 * This calculates the size of the note as it would be stored in Firestore
 * Excludes edit history which is stored separately
 */
export function calculateNoteSize(note: Note): number {
  // Only include fields that are actually stored in Firestore document
  // Exclude edit history which is stored separately and can inflate the size
  const noteData = {
    id: note.id,
    uniqueId: note.uniqueId,
    content: note.content,
    noteTitle: note.noteTitle,
    slug: note.slug,
    category: note.category ? {
      id: note.category.id,
      name: note.category.name,
      color: note.category.color
    } : null,
    tags: note.tags || [],
    parentId: note.parentId,
    linkedNoteIds: note.linkedNoteIds,
    publish: note.publish,
    description: note.description,
    archived: note.archived,
    wordCount: note.wordCount,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
    // Exclude editHistory as it's stored separately
  };
  
  // Convert to JSON and calculate byte size
  const jsonString = JSON.stringify(noteData);
  return new Blob([jsonString], { type: 'application/json' }).size;
}

/**
 * Calculate total storage used by all notes
 */
export function calculateTotalStorage(notes: Note[]): number {
  return notes.reduce((total, note) => {
    return total + (note.fileSize || calculateNoteSize(note));
  }, 0);
}

/**
 * Format bytes to human readable format
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Convert bytes to MB
 */
export function bytesToMB(bytes: number): number {
  return bytes / (1024 * 1024);
}

/**
 * Convert MB to bytes
 */
export function mbToBytes(mb: number): number {
  return mb * 1024 * 1024;
}

/**
 * Check storage usage and return alerts if needed
 */
export function checkStorageAlerts(userStorage: UserStorage): StorageAlert | null {
  const percentage = (userStorage.totalStorage / userStorage.maxStorage) * 100;
  
  if (percentage >= 95) {
    return {
      type: 'error',
      message: `Storage full! You've used ${percentage.toFixed(1)}% of your ${formatBytes(userStorage.maxStorage)} limit.`,
      percentage
    };
  } else if (percentage >= 70) {
    return {
      type: 'warning',
      message: `Storage warning: You've used ${percentage.toFixed(1)}% of your ${formatBytes(userStorage.maxStorage)} limit.`,
      percentage
    };
  }
  
  return null;
}

/**
 * Check if adding a note would exceed storage limits
 */
export function canAddNote(userStorage: UserStorage, noteSize: number): boolean {
  return (userStorage.totalStorage + noteSize) <= userStorage.maxStorage;
}

/**
 * Get storage usage percentage
 */
export function getStoragePercentage(userStorage: UserStorage): number {
  return Math.min((userStorage.totalStorage / userStorage.maxStorage) * 100, 100);
}

/**
 * Create default user storage record
 */
export function createDefaultUserStorage(userId: string, isAdmin: boolean = false): UserStorage {
  return {
    userId,
    totalStorage: 0,
    maxStorage: isAdmin ? mbToBytes(1000) : mbToBytes(10), // 1GB for admin, 10MB for regular users
    noteCount: 0,
    lastUpdated: new Date(),
    isAdmin
  };
}
