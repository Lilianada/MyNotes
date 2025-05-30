"use client";

import { firebaseNotesService } from "@/lib/firebase-notes";
import { localStorageNotesService } from "@/lib/local-storage-notes";

/**
 * Tag-related operations for notes
 */
export class NoteTagOperations {
  
  /**
   * Updates a note's tags
   */
  static async updateNoteTags(
    id: number,
    tags: string[],
    isAdmin: boolean,
    user: { uid: string } | null | undefined
  ): Promise<string[]> {
    try {
      if (isAdmin && user && firebaseNotesService) {
        // Use Firebase for admins
        return await firebaseNotesService.updateNoteTags(id, tags);
      } else {
        // Use localStorage for non-admins
        return localStorageNotesService.updateNoteTags(id, tags);
      }
    } catch (error) {
      console.error(`Failed to update tags for note ${id}:`, error);
      throw error;
    }
  }
}
