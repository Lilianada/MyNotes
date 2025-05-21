"use client";

import { Note, NoteCategory, NoteEditHistory } from "@/types";
import { saveNoteToFile, createEmptyNoteFile } from "@/app/actions";
import { firebaseNotesService } from "@/lib/firebase-notes";
import { localStorageNotesService } from "@/lib/local-storage-notes";
import { countWords } from "@/lib/word-count";
import { sanitizeNoteData } from "@/lib/data-sanitizer";

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
      // Handle linked notes first - remove bidirectional links
      if (noteToDelete.linkedNoteIds && noteToDelete.linkedNoteIds.length > 0) {
        // For each linked note, we need to remove this note from its linkedNoteIds
        if (isAdmin && user) {
          // Handle in Firebase
          for (const linkedId of noteToDelete.linkedNoteIds) {
            const linkedNote = await firebaseNotesService.getNote(linkedId);
            if (linkedNote && linkedNote.linkedNoteIds) {
              // Filter out the note being deleted
              const updatedLinks = linkedNote.linkedNoteIds.filter(linkId => linkId !== id);
              await firebaseNotesService.updateNoteData(linkedId, {
                ...linkedNote,
                linkedNoteIds: updatedLinks,
                updatedAt: new Date()
              });
            }
          }
        } else {
          // Handle in localStorage
          const allNotes = localStorageNotesService.getNotes();
          for (const linkedId of noteToDelete.linkedNoteIds) {
            const linkedNote = allNotes.find(note => note.id === linkedId);
            if (linkedNote && linkedNote.linkedNoteIds) {
              // Filter out the note being deleted
              const updatedLinks = linkedNote.linkedNoteIds.filter(linkId => linkId !== id);
              localStorageNotesService.updateNoteData(linkedId, {
                ...linkedNote,
                linkedNoteIds: updatedLinks,
                updatedAt: new Date()
              });
            }
          }
        }
      }
      
      // Handle children notes - remove parent reference
      if (isAdmin && user) {
        // Handle in Firebase
        const childNotes = await firebaseNotesService.getChildNotes(user.uid, id);
        for (const childNote of childNotes) {
          await firebaseNotesService.updateNoteData(childNote.id, {
            ...childNote,
            parentId: null,
            updatedAt: new Date()
          });
        }
      } else {
        // Handle in localStorage
        const allNotes = localStorageNotesService.getNotes();
        for (const childNote of allNotes) {
          if (childNote.parentId === id) {
            localStorageNotesService.updateNoteData(childNote.id, {
              ...childNote,
              parentId: null,
              updatedAt: new Date()
            });
          }
        }
      }

      // Now delete the note itself
      if (isAdmin && user) {
        // Use Firebase for admins
        await firebaseNotesService.deleteNote(id);
      } else {
        // Use localStorage for non-admins
        localStorageNotesService.deleteNote(id);
      }
    } catch (error) {
      console.error("Failed to delete note:", error);
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

  /**
   * Updates a note with any changed data fields
   */
  static async updateNoteData(
    id: number,
    updatedNote: Note,
    isAdmin: boolean,
    user: { uid: string } | null | undefined
  ): Promise<void> {
    try {
      // Sanitize the note data before saving
      const sanitizedNote = sanitizeNoteData(updatedNote);
      
      if (isAdmin && user && firebaseNotesService) {
        // Use Firebase for admins
        await firebaseNotesService.updateNoteData(id, sanitizedNote);
      } else {
        // Use localStorage for non-admins
        localStorageNotesService.updateNoteData(id, sanitizedNote);
      }
    } catch (error) {
      console.error("Failed to update note data:", error);
      throw error;
    }
  }
}
