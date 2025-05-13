"use client";

import { Note } from '@/types';

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
        slug: note.slug || createSlugFromTitle(note.noteTitle)
      }));
    } catch (error) {
      console.error('Failed to parse notes from localStorage:', error);
      return [];
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
      slug
    };
    
    const updatedNotes = [newNote, ...notes];
    window.localStorage.setItem('notes', JSON.stringify(updatedNotes));
    
    return newNote;
  },
  
  // Update a note's content
  updateNoteContent(id: number, content: string): void {
    const notes = this.getNotes();
    const updatedNotes = notes.map(note => 
      note.id === id ? { ...note, content } : note
    );
    window.localStorage.setItem('notes', JSON.stringify(updatedNotes));
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
    
    return filePath;
  },
  
  // Delete a note
  deleteNote(id: number): void {
    const notes = this.getNotes();
    const updatedNotes = notes.filter(note => note.id !== id);
    window.localStorage.setItem('notes', JSON.stringify(updatedNotes));
  }
};

// Helper function
function createSlugFromTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") 
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    || "untitled";
}
