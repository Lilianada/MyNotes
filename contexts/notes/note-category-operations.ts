"use client";

import { Note, NoteCategory } from "@/types";
import { firebaseNotesService } from "@/lib/firebase-notes";
import { localStorageNotesService } from "@/lib/local-storage-notes";

/**
 * Category-related operations for notes
 */
export class NoteCategoryOperations {
  
  /**
   * Updates a note's category
   */
  static async updateNoteCategory(
    id: number,
    category: NoteCategory | null,
    isAdmin: boolean,
    user: { uid: string } | null | undefined
  ): Promise<void> {
    try {
      if (isAdmin && user && firebaseNotesService) {
        // Use Firebase for admins
        await firebaseNotesService.updateNoteCategory(id, category);
      } else {
        // Use localStorage for non-admins
        localStorageNotesService.updateNoteCategory(id, category);
      }
    } catch (error) {
      console.error("Failed to update note category:", error);
      throw error;
    }
  }

  /**
   * Deletes a category from all notes
   */
  static async removeCategory(
    categoryId: string,
    isAdmin: boolean,
    user: { uid: string } | null | undefined,
    notes: Note[]
  ): Promise<void> {
    try {
      // Find all notes that have this category
      const notesWithCategory = notes.filter(
        note => note.category && note.category.id === categoryId
      );

      // Update each note to remove the category
      for (const note of notesWithCategory) {
        if (isAdmin && user && firebaseNotesService) {
          // Use Firebase for admins
          await firebaseNotesService.updateNoteCategory(note.id, null);
        } else {
          // Use localStorage for non-admins
          localStorageNotesService.updateNoteCategory(note.id, null);
        }
      }
    } catch (error) {
      console.error("Failed to remove category from notes:", error);
      throw error;
    }
  }
}
