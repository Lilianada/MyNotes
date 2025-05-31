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
  updateNoteContent,
  updateNoteTitle,
  updateNoteCategory,
  updateNoteTags,
  updateNoteData,
  
  // Delete operations
  deleteNote,
  deleteMultipleNotes,
  bulkDeleteNotes,
  deleteCategory,
  deleteTagFromAllNotes,
  
  // Category operations
  updateCategory,
  updateTagAcrossNotes,
  
  // History operations
  getNoteHistory
};
