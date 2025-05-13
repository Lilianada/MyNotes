"use client";

import { Note } from '@/types';

// Local storage notes service
export const localStorageNotesService = {
  // Get all notes
  getNotes(): Note[] {
    if (typeof window === 'undefined') {
      return [];
    }
    
    const notesString = localStorage.getItem('notes');
    return notesString ? JSON.parse(notesString) : [];
  },

  // Add a new note
  addNote(noteTitle: string): Note {
    const notes = this.getNotes();
    
    // Find the next available ID
    const nextId = notes.length > 0 ? Math.max(...notes.map(note => note.id)) + 1 : 1;
    
    const filePath = `notes/${noteTitle.toLowerCase().replace(/\s+/g, '-')}.md`;
    
    const newNote: Note = {
      id: nextId,
      content: "",
      noteTitle,
      createdAt: new Date(),
      filePath,
      slug: ""
    };
    
    // Add the note to local storage
    notes.push(newNote);
    localStorage.setItem('notes', JSON.stringify(notes));
    
    return newNote;
  },

  // Update a note's content
  updateNoteContent(noteId: number, content: string): void {
    const notes = this.getNotes();
    const updatedNotes = notes.map(note => 
      note.id === noteId ? { ...note, content } : note
    );
    
    localStorage.setItem('notes', JSON.stringify(updatedNotes));
  },

  // Update a note's title
  updateNoteTitle(noteId: number, noteTitle: string): string {
    const notes = this.getNotes();
    const filePath = `notes/${noteTitle.toLowerCase().replace(/\s+/g, '-')}.md`;
    
    const updatedNotes = notes.map(note => 
      note.id === noteId ? { ...note, noteTitle, filePath } : note
    );
    
    localStorage.setItem('notes', JSON.stringify(updatedNotes));
    return filePath;
  },

  // Delete a note
  deleteNote(noteId: number): void {
    const notes = this.getNotes();
    const filteredNotes = notes.filter(note => note.id !== noteId);
    
    localStorage.setItem('notes', JSON.stringify(filteredNotes));
  }
};
