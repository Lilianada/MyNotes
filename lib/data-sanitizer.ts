import { Note } from '@/types';

/**
 * Sanitizes note data before sending to storage (Firebase or Local)
 * This ensures that all fields are properly formatted and no undefined values are passed
 */
export function sanitizeNoteData(note: Note): Note {
  const sanitized: Note = { ...note };
  
  // Ensure tags is always an array, not undefined
  if (!Array.isArray(sanitized.tags)) {
    sanitized.tags = [];
  }
  
  // Ensure linkedNoteIds is always an array, not undefined
  if (!Array.isArray(sanitized.linkedNoteIds)) {
    sanitized.linkedNoteIds = [];
  }
  
  // Make sure dates are valid Date objects
  if (sanitized.createdAt === undefined || !(sanitized.createdAt instanceof Date)) {
    sanitized.createdAt = new Date();
  }
  
  if (sanitized.updatedAt === undefined) {
    sanitized.updatedAt = new Date();
  } else if (!(sanitized.updatedAt instanceof Date)) {
    // Try to convert updatedAt to a Date object if it's not already
    try {
      sanitized.updatedAt = new Date(sanitized.updatedAt);
    } catch (e) {
      sanitized.updatedAt = new Date();
    }
  }
  
  // Make sure parentId is either a number or null, not undefined
  if (sanitized.parentId === undefined) {
    sanitized.parentId = null;
  }
  
  // Make sure category is either an object or null, not undefined
  if (sanitized.category === undefined) {
    sanitized.category = null;
  }
  
  return sanitized;
}
