"use client";

import { Note, NoteCategory, NoteEditHistory } from "@/types";
import { saveNoteToFile, createEmptyNoteFile } from "@/app/actions";
import { firebaseNotesService } from "@/lib/firebase-notes";
import { localStorageNotesService } from "@/lib/local-storage-notes";
import { countWords } from "@/lib/word-count";

/**
 * Contains all note manipulation operations used by the context
 */
export class NoteOperations {
  
  /**
   * Creates a new note
   */
  static async addNote(
    noteTitle: string,
    isAdmin: boolean,
    user: { uid: string } | null | undefined
  ): Promise<Note> {
    let newNote: Note;

    try {
      if (isAdmin && user) {
        // Use Firebase for admins
        newNote = await firebaseNotesService.addNote(user.uid, noteTitle);
      } else {
        // Use localStorage for non-admins
        newNote = localStorageNotesService.addNote(noteTitle);

        // Also create the file for backwards compatibility
        const result = await createEmptyNoteFile(noteTitle);
        if (result.success) {
          newNote.filePath = result.filePath;
        }
      }

      return newNote;
    } catch (error) {
      console.error("Failed to add note:", error);
      throw new Error("Failed to create note");
    }
  }

  /**
   * Updates a note's content
   */
  static async updateNote(
    id: number,
    content: string,
    noteToUpdate: Note,
    isAdmin: boolean,
    user: { uid: string } | null | undefined
  ): Promise<{ wordCount: number }> {
    // Calculate word count
    const wordCount = countWords(content);

    try {
      if (isAdmin && user) {
        // Use Firebase for admins
        await firebaseNotesService.updateNoteContent(id, content);
      } else {
        // Use localStorage for non-admins
        localStorageNotesService.updateNoteContent(id, content);

        // Also update file for backwards compatibility
        await saveNoteToFile(
          content,
          id,
          noteToUpdate.noteTitle,
          noteToUpdate.slug
        );
      }
      
      return { wordCount };
    } catch (error) {
      console.error("Failed to update note content:", error);
      return { wordCount };
    }
  }

  /**
   * Updates a note's title
   */
  static async updateNoteTitle(
    id: number,
    title: string,
    noteToUpdate: Note,
    isAdmin: boolean,
    user: { uid: string } | null | undefined
  ): Promise<{ filePath?: string }> {
    try {
      let filePath: string;

      if (isAdmin && user) {
        // Use Firebase for admins
        filePath = await firebaseNotesService.updateNoteTitle(id, title);
      } else {
        // Use localStorage for non-admins
        filePath = localStorageNotesService.updateNoteTitle(id, title);

        // Also update file for backwards compatibility
        const result = await saveNoteToFile(
          noteToUpdate.content,
          id,
          title,
          noteToUpdate.slug
        );
        if (result.success && result.filePath) {
          filePath = result.filePath;
        }
      }

      return { filePath };
    } catch (error) {
      console.error("Failed to update note title:", error);
      return {};
    }
  }

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
   * Deletes a note
   */
  static async deleteNote(
    id: number,
    noteToDelete: Note,
    isAdmin: boolean,
    user: { uid: string } | null | undefined
  ): Promise<void> {
    try {
      if (isAdmin && user) {
        // Use Firebase for admins
        await firebaseNotesService.deleteNote(id);
      } else {
        // Use localStorage for non-admins
        localStorageNotesService.deleteNote(id);

        // Also delete file for backwards compatibility
        if (noteToDelete.filePath) {
          const { deleteNoteFile } = await import("@/app/delete-actions");
          await deleteNoteFile(noteToDelete.filePath);
        }
      }
    } catch (error) {
      console.error("Failed to delete note:", error);
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
