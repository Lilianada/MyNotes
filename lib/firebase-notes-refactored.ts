import { Note, NoteCategory, NoteEditHistory } from '@/types';
import { FirebaseCRUDOperations } from './firebase/firebase-crud';
import { FirebaseDataOperations } from './firebase/firebase-data';
import { FirebaseRelationshipOperations } from './firebase/firebase-relationships';

/**
 * Main Firebase notes service that combines all operations
 * This service delegates to specialized operation classes for better modularity
 */
export const firebaseNotesService = {
  // CRUD Operations
  async getNotes(userId: string): Promise<Note[]> {
    return FirebaseCRUDOperations.getNotes(userId);
  },

  async addNote(userId: string, noteTitle: string): Promise<Note> {
    return FirebaseCRUDOperations.addNote(userId, noteTitle);
  },

  async updateNoteContent(id: number, content: string): Promise<void> {
    return FirebaseCRUDOperations.updateNoteContent(id, content);
  },
  
  async updateNoteTitle(id: number, noteTitle: string): Promise<string> {
    return FirebaseCRUDOperations.updateNoteTitle(id, noteTitle);
  },
  
  async deleteNote(id: number): Promise<void> {
    return FirebaseCRUDOperations.deleteNote(id);
  },

  async getNote(id: number): Promise<Note | null> {
    return FirebaseCRUDOperations.getNote(id);
  },

  async bulkDeleteNotes(ids: number[]): Promise<{ successful: number[], failed: { id: number, error: string }[] }> {
    return FirebaseCRUDOperations.bulkDeleteNotes(ids);
  },

  // Data Operations (categories, tags, metadata, history)
  async updateNoteCategory(id: number, category: NoteCategory | null): Promise<void> {
    return FirebaseDataOperations.updateNoteCategory(id, category);
  },
  
  async getNoteHistory(id: number): Promise<NoteEditHistory[]> {
    return FirebaseDataOperations.getNoteHistory(id);
  },

  async updateNoteTags(id: number, tags: string[]): Promise<string[]> {
    return FirebaseDataOperations.updateNoteTags(id, tags);
  },

  async updateNoteData(id: number, updatedNote: Partial<Note>): Promise<void> {
    return FirebaseDataOperations.updateNoteData(id, updatedNote);
  },

  // Relationship Operations (parent/child, linking)
  async getChildNotes(userId: string, parentId: number): Promise<Note[]> {
    return FirebaseRelationshipOperations.getChildNotes(userId, parentId);
  }
};

export default firebaseNotesService;
