"use client";

import { Note, NoteEditHistory } from "@/types";
import { firebaseNotesService } from "@/lib/firebase/firebase-notes";
import { localStorageNotesService } from "@/lib/storage/local-storage-notes";
import { sanitizeNoteData } from "@/lib/data-processing/data-sanitizer";

/**
 * Data update and history operations for notes
 */
export class NoteDataOperations {
  
  /**
   * Gets a note's edit history
   */
  static async getNoteHistory(
    id: number,
    isAdmin: boolean,
    user: { uid: string } | null | undefined
  ): Promise<NoteEditHistory[]> {
    try {
      if (isAdmin && user && firebaseNotesService) {
        // Use Firebase for admins
        return await firebaseNotesService.getNoteHistory(id);
      } else {
        // Use localStorage for non-admins
        return localStorageNotesService.getNoteHistory(id);
      }
    } catch (error) {
      console.error("Failed to get note history:", error);
      return [];
    }
  }

  /**
   * Updates a note with any changed data fields
   */
  static async updateNoteData(
    id: number,
    updatedNote: Partial<Note>,
    isAdmin: boolean,
    user: { uid: string } | null | undefined
  ): Promise<void> {
    try {
      // Sanitize the note data before saving
      const sanitizedNote = sanitizeNoteData(updatedNote as Note);
      
      // Special handling for tags to guarantee they're saved correctly
      if (updatedNote.tags !== undefined) {
        console.log(`[NOTE OPERATIONS] Processing tags update for note ${id}`);
        console.log(`[NOTE OPERATIONS] Tags to save:`, JSON.stringify(updatedNote.tags));
        
        // Process tags - normalize, trim, and remove duplicates
        let normalizedTags: string[] = [];
        
        if (Array.isArray(updatedNote.tags)) {
          // Map tags to lowercase and trim
          const processedTags = updatedNote.tags.map(tag => 
            typeof tag === 'string' ? tag.trim().toLowerCase() : ''
          ).filter(Boolean); // Remove empty strings
          
          // Remove duplicates using object keys
          const uniqueTags: {[key: string]: boolean} = {};
          processedTags.forEach(tag => uniqueTags[tag] = true);
          normalizedTags = Object.keys(uniqueTags);
        }
          
        sanitizedNote.tags = normalizedTags;
        console.log(`[NOTE OPERATIONS] Normalized tags:`, JSON.stringify(normalizedTags));
      }
      
      if (isAdmin && user && firebaseNotesService) {
        // Use Firebase for admins
        console.log(`[NOTE OPERATIONS] Saving note ${id} to Firebase`);
        await firebaseNotesService.updateNoteData(id, sanitizedNote);
      } else {
        // Use localStorage for non-admins
        console.log(`[NOTE OPERATIONS] Saving note ${id} to localStorage`);
        localStorageNotesService.updateNoteData(id, sanitizedNote);
      }
      
      console.log(`[NOTE OPERATIONS] Note ${id} updated successfully`);
    } catch (error) {
      console.error("[NOTE OPERATIONS] Failed to update note data:", error);
      throw error;
    }
  }
}
