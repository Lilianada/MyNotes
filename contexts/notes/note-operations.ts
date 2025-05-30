"use client";

import { Note, NoteCategory, NoteEditHistory } from "@/types";
import { NoteCRUDOperations } from "./note-crud-operations";
import { NoteCategoryOperations } from "./note-category-operations";
import { NoteTagOperations } from "./note-tag-operations";
import { NoteDataOperations } from "./note-data-operations";

/**
 * Main operations coordinator - delegates to specialized operation classes
 */
export class NoteOperations {
  
  // CRUD Operations
  static async addNote(
    noteTitle: string,
    isAdmin: boolean,
    user: { uid: string } | null | undefined
  ): Promise<Note> {
    return NoteCRUDOperations.addNote(noteTitle, isAdmin, user);
  }

  static async updateNote(
    id: number,
    content: string,
    noteToUpdate: Note,
    isAdmin: boolean,
    user: { uid: string } | null | undefined
  ): Promise<{ wordCount: number }> {
    return NoteCRUDOperations.updateNote(id, content, noteToUpdate, isAdmin, user);
  }

  static async updateNoteTitle(
    id: number,
    title: string,
    noteToUpdate: Note,
    isAdmin: boolean,
    user: { uid: string } | null | undefined
  ): Promise<{ filePath?: string }> {
    return NoteCRUDOperations.updateNoteTitle(id, title, noteToUpdate, isAdmin, user);
  }

  static async deleteNote(
    id: number,
    noteToDelete: Note,
    isAdmin: boolean,
    user: { uid: string } | null | undefined
  ): Promise<void> {
    return NoteCRUDOperations.deleteNote(id, noteToDelete, isAdmin, user);
  }

  // Category Operations
  static async updateNoteCategory(
    id: number,
    category: NoteCategory | null,
    isAdmin: boolean,
    user: { uid: string } | null | undefined
  ): Promise<void> {
    return NoteCategoryOperations.updateNoteCategory(id, category, isAdmin, user);
  }

  static async removeCategory(
    categoryId: string,
    isAdmin: boolean,
    user: { uid: string } | null | undefined,
    notes: Note[]
  ): Promise<void> {
    return NoteCategoryOperations.removeCategory(categoryId, isAdmin, user, notes);
  }

  // Tag Operations
  static async updateNoteTags(
    id: number,
    tags: string[],
    isAdmin: boolean,
    user: { uid: string } | null | undefined
  ): Promise<string[]> {
    return NoteTagOperations.updateNoteTags(id, tags, isAdmin, user);
  }

  // Data Operations
  static async getNoteHistory(
    id: number,
    isAdmin: boolean,
    user: { uid: string } | null | undefined
  ): Promise<NoteEditHistory[]> {
    return NoteDataOperations.getNoteHistory(id, isAdmin, user);
  }

  static async updateNoteData(
    id: number,
    updatedNote: Partial<Note>,
    isAdmin: boolean,
    user: { uid: string } | null | undefined
  ): Promise<void> {
    return NoteDataOperations.updateNoteData(id, updatedNote, isAdmin, user);
  }
}
