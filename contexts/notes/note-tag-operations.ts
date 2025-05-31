"use client";

import { firebaseNotesService } from "@/lib/firebase/firebase-notes";
import { localStorageNotesService } from "@/lib/storage/local-storage-notes";

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
      if (user && firebaseNotesService) {
        // Use Firebase for all authenticated users (both admin and regular)
        return await firebaseNotesService.updateNoteTags(id, tags, user.uid, isAdmin);
      } else {
        // Use localStorage for anonymous users
        return localStorageNotesService.updateNoteTags(id, tags);
      }
    } catch (error) {
      console.error(`Failed to update tags for note ${id}:`, error);
      throw error;
    }
  }
}
