"use client";

import { Note, NoteCategory, NoteEditHistory } from '@/types';
import { countWords } from './word-count';

// Helper function to create a slug from a title
function createSlugFromTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") 
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    || "untitled";
}

// Export as named export
export const localStorageNotesService = {
  // Get all notes
  getNotes(): Note[] {
    if (typeof window === 'undefined') {
      return [];
    }
    
    try {
      const notesString = window.localStorage.getItem('notes');
      if (!notesString) {
        return [];
      }
      
      const notes = JSON.parse(notesString);
      return notes.map((note: any) => ({
        ...note,
        id: Number(note.id), // Ensure ID is a number
        createdAt: new Date(note.createdAt),
        slug: note.slug || createSlugFromTitle(note.noteTitle),
        wordCount: note.wordCount || (note.content ? countWords(note.content) : 0)
      }));
    } catch (error) {
      console.error('Failed to parse notes from localStorage:', error);
      return [];
    }
  },
  
  // Get note history
  getNoteHistory(id: number): NoteEditHistory[] {
    if (typeof window === 'undefined') {
      return [];
    }
    
    try {
      const historyString = window.localStorage.getItem(`note_history_${id}`);
      if (!historyString) {
        return [];
      }
      
      const history = JSON.parse(historyString);
      return history.map((entry: any) => ({
        ...entry,
        timestamp: new Date(entry.timestamp)
      })).sort((a: NoteEditHistory, b: NoteEditHistory) => 
        b.timestamp.getTime() - a.timestamp.getTime()
      );
    } catch (error) {
      console.error('Failed to parse note history from localStorage:', error);
      return [];
    }
  },
  
  // Add history entry
  addHistoryEntry(id: number, editType: 'create' | 'update' | 'title'): void {
    if (typeof window === 'undefined') {
      return;
    }
    
    try {
      const history = this.getNoteHistory(id);
      const newEntry: NoteEditHistory = {
        timestamp: new Date(),
        editType
      };
      
      const updatedHistory = [newEntry, ...history];
      window.localStorage.setItem(`note_history_${id}`, JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Failed to add history entry:', error);
    }
  },
  
  // Add a new note
  addNote(noteTitle: string): Note {
    const notes = this.getNotes();
    
    // Generate a numeric ID
    const numericId = Date.now();
    
    // Create a slug from the note title
    const slug = createSlugFromTitle(noteTitle);
    
    const newNote: Note = {
      id: numericId,
      content: "",
      noteTitle,
      createdAt: new Date(),
      slug,
      wordCount: 0
    };
    
    const updatedNotes = [newNote, ...notes];
    window.localStorage.setItem('notes', JSON.stringify(updatedNotes));
    
    // Add history entry
    this.addHistoryEntry(numericId, 'create');
    
    return newNote;
    
    return newNote;
  },
  
  // Update a note's content
  updateNoteContent(id: number, content: string): void {
    const notes = this.getNotes();
    const wordCount = countWords(content);
    
    const updatedNotes = notes.map(note => 
      note.id === id ? { ...note, content, wordCount } : note
    );
    window.localStorage.setItem('notes', JSON.stringify(updatedNotes));
    
    // Add history entry
    this.addHistoryEntry(id, 'update');
  },
  
  // Update a note's title
  updateNoteTitle(id: number, noteTitle: string): string {
    const notes = this.getNotes();
    const slug = createSlugFromTitle(noteTitle);
    const filePath = `notes/${slug}.md`;
    
    const updatedNotes = notes.map(note => 
      note.id === id ? { 
        ...note, 
        noteTitle,
        slug,
        filePath
      } : note
    );
    window.localStorage.setItem('notes', JSON.stringify(updatedNotes));
    
    // Add history entry
    this.addHistoryEntry(id, 'title');
    
    return filePath;
  },
  
  // Delete a note
  deleteNote(id: number): void {
    const notes = this.getNotes();
    const updatedNotes = notes.filter(note => note.id !== id);
    window.localStorage.setItem('notes', JSON.stringify(updatedNotes));
    
    // Remove history for this note
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(`note_history_${id}`);
    }
  },
  
  // Update a note's category
  updateNoteCategory(id: number, category: NoteCategory | null): void {
    const notes = this.getNotes();
    const updatedNotes = notes.map(note => 
      note.id === id ? { ...note, category } : note
    );
    window.localStorage.setItem('notes', JSON.stringify(updatedNotes));
  },
  
  // Update any note data fields
  updateNoteData(id: number, updatedNote: Note): void {
    const notes = this.getNotes();
    const updatedNotes = notes.map(note => 
      note.id === id ? { ...note, ...updatedNote } : note
    );
    window.localStorage.setItem('notes', JSON.stringify(updatedNotes));
  }
};
