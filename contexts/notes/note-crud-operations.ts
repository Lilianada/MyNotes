"use client";

import { Note } from "@/types";
import { firebaseNotesService } from "@/lib/firebase/firebase-notes";
import { localStorageNotesService } from "@/lib/storage/local-storage-notes";
import { countWords } from "@/lib/data-processing/word-count";

/**
 * Basic CRUD operations for notes
 */
export class NoteCRUDOperations {
  
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
      if (user) {
        // Use Firebase for all authenticated users (both admin and regular)
        console.log(`Creating note for authenticated user: ${user.uid}, isAdmin: ${isAdmin}`);
        newNote = await firebaseNotesService.addNote(user.uid, noteTitle, isAdmin);
      } else {
        // Use localStorage only for anonymous/unauthenticated users
        console.log("Creating note for anonymous user in localStorage");
        newNote = localStorageNotesService.addNote(noteTitle);
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
      if (user) {
        // Use Firebase for all authenticated users (both admin and regular)
        await firebaseNotesService.updateNoteContent(id, content, user.uid, isAdmin);
      } else {
        // Use localStorage for anonymous users
        localStorageNotesService.updateNoteContent(id, content);
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
      let filePath: string | undefined;

      if (user) {
        // Use Firebase for all authenticated users (both admin and regular)
        await firebaseNotesService.updateNoteTitle(id, title);
        // For Firebase users, we don't need to return a filePath
      } else {
        // Use localStorage for anonymous users
        filePath = localStorageNotesService.updateNoteTitle(id, title);
      }

      return { filePath };
    } catch (error) {
      console.error("Failed to update note title:", error);
      return {};
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
    try {        // Handle linked notes first - remove bidirectional links
        if (noteToDelete.linkedNoteIds && noteToDelete.linkedNoteIds.length > 0) {
          // For each linked note, we need to remove this note from its linkedNoteIds
          if (user) {
            // Handle in Firebase for all authenticated users
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
            // Handle in localStorage for anonymous users
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
      if (user) {
        // Handle in Firebase for all authenticated users
        const childNotes = await firebaseNotesService.getChildNotes(user.uid, id);
        for (const childNote of childNotes) {
          await firebaseNotesService.updateNoteData(childNote.id, {
            ...childNote,
            parentId: null,
            updatedAt: new Date()
          });
        }
      } else {
        // Handle in localStorage for anonymous users
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
      if (user) {
        // Use Firebase for all authenticated users
        const result = await firebaseNotesService.deleteNote(id, user.uid, isAdmin);
        if (!result.success) {
          throw new Error(result.error || 'Failed to delete note');
        }
      } else {
        // Use localStorage for anonymous users
        localStorageNotesService.deleteNote(id);
      }
    } catch (error) {
      console.error("Failed to delete note:", error);
      throw error;
    }
  }

  /**
   * Bulk deletes multiple notes
   */
  static async bulkDeleteNotes(
    ids: number[],
    notesToDelete: Note[],
    isAdmin: boolean,
    user: { uid: string } | null | undefined
  ): Promise<{ successful: number[], failed: { id: number, error: string }[] }> {
    try {
      // First, handle relationship cleanup for all notes
      for (const noteToDelete of notesToDelete) {
        const id = noteToDelete.id;
        
        // Handle linked notes first - remove bidirectional links
        if (noteToDelete.linkedNoteIds && noteToDelete.linkedNoteIds.length > 0) {
          // For each linked note, we need to remove this note from its linkedNoteIds
          if (user) {
            // Handle in Firebase for all authenticated users
            for (const linkedId of noteToDelete.linkedNoteIds) {
              try {
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
              } catch (linkError) {
                console.warn(`Failed to update linked note ${linkedId}:`, linkError);
              }
            }
          } else {
            // Handle in localStorage for anonymous users
            const allNotes = localStorageNotesService.getNotes();
            for (const linkedId of noteToDelete.linkedNoteIds) {
              try {
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
              } catch (linkError) {
                console.warn(`Failed to update linked note ${linkedId}:`, linkError);
              }
            }
          }
        }
        
        // Handle children notes - remove parent reference
        if (user) {
          // Handle in Firebase for all authenticated users
          try {
            const childNotes = await firebaseNotesService.getChildNotes(user.uid, id);
            for (const childNote of childNotes) {
              await firebaseNotesService.updateNoteData(childNote.id, {
                ...childNote,
                parentId: null,
                updatedAt: new Date()
              });
            }
          } catch (childError) {
            console.warn(`Failed to update child notes for note ${id}:`, childError);
          }
        } else {
          // Handle in localStorage for anonymous users
          try {
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
          } catch (childError) {
            console.warn(`Failed to update child notes for note ${id}:`, childError);
          }
        }
      }
      
      // Now bulk delete the notes themselves
      if (user) {
        // Use Firebase for all authenticated users
        return await firebaseNotesService.bulkDeleteNotes(ids, user.uid, isAdmin);
      } else {
        // Use localStorage for anonymous users
        return localStorageNotesService.bulkDeleteNotes(ids);
      }
    } catch (error) {
      console.error("Failed to bulk delete notes:", error);
      throw error;
    }
  }
}
