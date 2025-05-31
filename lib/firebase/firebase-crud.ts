import { Note } from '@/types';
import { FirebaseCRUDRead } from './firebase-crud-read';
import { FirebaseCRUDWrite } from './firebase-crud-write';
import { FirebaseCRUDDelete } from './firebase-crud-delete';

/**
 * Main Firebase CRUD operations class that orchestrates all operations
 */
export class FirebaseCRUDOperations {
  
  // Read operations
  static async getNotes(userId: string): Promise<Note[]> {
    return FirebaseCRUDRead.getNotes(userId);
  }

  static async getNote(id: number): Promise<Note | null> {
    return FirebaseCRUDRead.getNote(id);
  }

  // Write operations
  static async addNote(userId: string, noteTitle: string): Promise<Note> {
    return FirebaseCRUDWrite.addNote(userId, noteTitle);
  }

  static async updateNoteContent(id: number, content: string): Promise<void> {
    return FirebaseCRUDWrite.updateNoteContent(id, content);
  }

  static async updateNoteTitle(id: number, noteTitle: string): Promise<string> {
    return FirebaseCRUDWrite.updateNoteTitle(id, noteTitle);
  }

  // Delete operations
  static async deleteNote(id: number): Promise<void> {
    return FirebaseCRUDDelete.deleteNote(id);
  }

  static async bulkDeleteNotes(ids: number[]): Promise<{ successful: number[], failed: { id: number, error: string }[] }> {
    return FirebaseCRUDDelete.bulkDeleteNotes(ids);
  }
}
