import { Note, NoteCategory, NoteEditHistory } from '@/types';

// Import all operations
import { getNotes, addNote, getNote, getChildNotes } from './note-operations';
import { updateNoteContent, updateNoteTitle, updateNoteCategory, updateNoteTags, updateNoteData } from './update-operations';
import { deleteNote, deleteMultipleNotes, bulkDeleteNotes, deleteCategory, deleteTagFromAllNotes } from './delete-operations';
import { updateCategory, updateTagAcrossNotes } from './category-operations';
import { getNoteHistory } from './history-operations';
import { getAllAdminNotes, getAllUsersWithNotes } from './admin-operations';

// Re-export helpers for use elsewhere
export * from './helpers';

// Create and export the firebaseNotesService object
export const firebaseNotesService = {
  // Note operations
  getNotes: (userId: string, isAdmin?: boolean) => getNotes(userId, isAdmin),
  addNote: (userId: string, noteTitle: string, isAdmin?: boolean) => addNote(userId, noteTitle, isAdmin),
  getNote: (noteId: number, userId?: string, isAdmin?: boolean) => getNote(noteId, userId, isAdmin),
  getChildNotes: (parentId: number, userId: string, isAdmin?: boolean) => getChildNotes(parentId, userId, isAdmin),
  
  // Update operations
  updateNoteContent: (noteId: number, content: string, userId?: string, isAdmin?: boolean) => updateNoteContent(noteId, content, userId, isAdmin),
  updateNoteTitle: (noteId: number, newTitle: string, userId?: string, isAdmin?: boolean) => updateNoteTitle(noteId, newTitle, userId, isAdmin),
  updateNoteCategory: (noteId: number, category: NoteCategory | null, userId?: string, isAdmin?: boolean) => updateNoteCategory(noteId, category, userId, isAdmin),
  updateNoteTags: (noteId: number, tags: string[], userId?: string, isAdmin?: boolean) => updateNoteTags(noteId, tags, userId, isAdmin),
  updateNoteData: (noteId: number, updates: Partial<Note>, userId?: string, isAdmin?: boolean) => updateNoteData(noteId, updates, userId, isAdmin),
  
  // Delete operations
  deleteNote: (noteId: number, userId?: string, isAdmin?: boolean) => deleteNote(noteId, userId, isAdmin),
  deleteMultipleNotes: (noteIds: number[], userId?: string, isAdmin?: boolean) => deleteMultipleNotes(noteIds, userId, isAdmin),
  bulkDeleteNotes: (noteIds: number[], userId?: string, isAdmin?: boolean) => deleteMultipleNotes(noteIds, userId, isAdmin),
  deleteCategory: (categoryId: string, userId: string, isAdmin?: boolean) => deleteCategory(categoryId, userId, isAdmin),
  deleteTagFromAllNotes: (tag: string, userId: string, isAdmin?: boolean) => deleteTagFromAllNotes(tag, userId, isAdmin),
  
  // Category operations
  updateCategory: (category: NoteCategory, userId: string, isAdmin?: boolean) => updateCategory(category, userId, isAdmin),
  updateTagAcrossNotes: (oldTag: string, newTag: string, userId: string, isAdmin?: boolean) => updateTagAcrossNotes(oldTag, newTag, userId, isAdmin),
  
  // History operations
  getNoteHistory: (noteId: number, userId: string, isAdmin?: boolean) => getNoteHistory(noteId, userId, isAdmin),
  
  // Admin operations
  getAllAdminNotes: () => getAllAdminNotes(),
  getAllUsersWithNotes: () => getAllUsersWithNotes()
};
