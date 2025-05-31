import { Note, NoteCategory, NoteEditHistory } from '@/types';

// Import all operations
import { getNotes, addNote, getNote, getChildNotes } from './note-operations';
import { updateNoteContent, updateNoteTitle, updateNoteCategory, updateNoteTags, updateNoteData } from './update-operations';
import { deleteNote, deleteMultipleNotes, bulkDeleteNotes, deleteCategory, deleteTagFromAllNotes } from './delete-operations';
import { updateCategory, updateTagAcrossNotes } from './category-operations';
import { getNoteHistory } from './history-operations';

// Re-export helpers for use elsewhere
export * from './helpers';

// Create and export the firebaseNotesService object
export const firebaseNotesService = {
  // Note operations
  getNotes: (userId: string, isAdmin?: boolean) => getNotes(userId, isAdmin),
  addNote: (userId: string, noteTitle: string, isAdmin?: boolean) => addNote(userId, noteTitle, isAdmin),
  getNote,
  getChildNotes,
  
  // Update operations
  updateNoteContent: (noteId: number, content: string, userId?: string, isAdmin?: boolean) => updateNoteContent(noteId, content, userId, isAdmin),
  updateNoteTitle,
  updateNoteCategory,
  updateNoteTags,
  updateNoteData,
  
  // Delete operations
  deleteNote: (noteId: number, userId?: string, isAdmin?: boolean) => deleteNote(noteId, userId, isAdmin),
  deleteMultipleNotes: (noteIds: number[], userId?: string, isAdmin?: boolean) => deleteMultipleNotes(noteIds, userId, isAdmin),
  bulkDeleteNotes: (noteIds: number[], userId?: string, isAdmin?: boolean) => deleteMultipleNotes(noteIds, userId, isAdmin),
  deleteCategory,
  deleteTagFromAllNotes,
  
  // Category operations
  updateCategory,
  updateTagAcrossNotes,
  
  // History operations
  getNoteHistory
};
