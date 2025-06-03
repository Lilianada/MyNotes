"use client";

import { Note, NoteCategory, NoteEditHistory } from '@/types';
import { countWords } from '../data-processing/word-count';
import { generateUniqueId, calculateNoteSize } from './storage-utils';

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
        uniqueId: note.uniqueId || generateUniqueId(), // Ensure all notes have unique IDs
        createdAt: new Date(note.createdAt),
        slug: note.slug || createSlugFromTitle(note.noteTitle),
        wordCount: note.wordCount || (note.content ? countWords(note.content) : 0),
        fileSize: note.fileSize || calculateNoteSize(note as Note)
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
  addHistoryEntry(id: number, editType: 'create' | 'update' | 'title' | 'tags' | 'category' | 'autosave', contentSnapshot?: string, changePercentage?: number): void {
    if (typeof window === 'undefined') {
      return;
    }
    
    try {
      const history = this.getNoteHistory(id);
      const newEntry: NoteEditHistory = {
        timestamp: new Date(),
        editType,
        contentSnapshot,
        contentLength: contentSnapshot?.length,
        changePercentage
      };
      
      const updatedHistory = [newEntry, ...history];
      
      // Prune history to keep only the most recent 20 entries (match DEFAULT_EDIT_HISTORY_CONFIG)
      const prunedHistory = updatedHistory.slice(0, 20);
      
      window.localStorage.setItem(`note_history_${id}`, JSON.stringify(prunedHistory));
    } catch (error) {
      console.error('Failed to add history entry:', error);
    }
  },

  // Update edit history (for batch updates)
  updateEditHistory(id: number, history: NoteEditHistory[]): void {
    if (typeof window === 'undefined') {
      return;
    }
    
    try {
      // Prune history to keep only the most recent 20 entries (match DEFAULT_EDIT_HISTORY_CONFIG)
      const prunedHistory = history.slice(0, 20);
      window.localStorage.setItem(`note_history_${id}`, JSON.stringify(prunedHistory));
    } catch (error) {
      console.error('Failed to update edit history:', error);
    }
  },
  
  // Add a new note
  addNote(noteTitle: string): Note {
    const notes = this.getNotes();
    
    // Generate a numeric ID and unique ID
    const numericId = Date.now();
    const uniqueId = generateUniqueId();
    
    // Create a slug from the note title
    const slug = createSlugFromTitle(noteTitle);
    
    const newNote: Note = {
      id: numericId,
      uniqueId,
      content: "",
      noteTitle,
      createdAt: new Date(),
      slug,
      wordCount: 0,
      fileSize: calculateNoteSize({ content: "", noteTitle } as Note)
    };
    
    const updatedNotes = [newNote, ...notes];
    window.localStorage.setItem('notes', JSON.stringify(updatedNotes));
    
    // Note: Creation history is managed by EditHistoryService, not added here
    
    return newNote;
  },
  
  // Update a note's content
  updateNoteContent(id: number, content: string): void {
    if (!id) {
      console.error('[LocalStorage] Invalid note ID in updateNoteContent:', id);
      return;
    }
    
    if (content === undefined || content === null) {
      console.error(`[LocalStorage] Invalid content in updateNoteContent for note ${id}`);
      return;
    }
    
    const notes = this.getNotes();
    const note = notes.find(n => n.id === id);
    
    if (!note) {
      console.error(`[LocalStorage] Cannot update content: Note ${id} not found`);
      return;
    }
    
    const wordCount = countWords(content);
    
    const updatedNotes = notes.map(note => {
      if (note.id === id) {
        const updatedNote = { 
          ...note, 
          content, 
          wordCount,
          updatedAt: new Date() // Always update the timestamp
        };
        updatedNote.fileSize = calculateNoteSize(updatedNote);
        return updatedNote;
      }
      return note;
    });
    window.localStorage.setItem('notes', JSON.stringify(updatedNotes));
    
    // Note: History is managed by EditHistoryService, not added here
  },

  // Update a note with content and optional metadata
  updateNote(id: number, content: string, metadata?: Partial<Note>): void {
    const notes = this.getNotes();
    const wordCount = countWords(content);
    
    const updatedNotes = notes.map(note => {
      if (note.id === id) {
        const updatedNote = { 
          ...note, 
          content, 
          wordCount,
          ...metadata,
          updatedAt: new Date()
        };
        updatedNote.fileSize = calculateNoteSize(updatedNote);
        return updatedNote;
      }
      return note;
    });
    window.localStorage.setItem('notes', JSON.stringify(updatedNotes));
    
    // Note: History is managed by EditHistoryService, not added here
  },
  
  // Update a note's title
  updateNoteTitle(id: number, noteTitle: string): string {
    const notes = this.getNotes();
    const slug = createSlugFromTitle(noteTitle);
    const filePath = `notes/${slug}.md`; // Virtual path for backward compatibility
    
    const updatedNotes = notes.map(note => 
      note.id === id ? { 
        ...note, 
        noteTitle,
        slug
        // Note: Removed actual filePath setting - localStorage only
      } : note
    );
    window.localStorage.setItem('notes', JSON.stringify(updatedNotes));
    
    // Note: History is managed by EditHistoryService, not added here
    
    return filePath; // Return virtual path for API compatibility
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
  updateNoteData(id: number, updatedNote: Partial<Note>): void {
    const notes = this.getNotes();
    
    // Find the existing note
    const existingNoteIndex = notes.findIndex(note => note.id === id);
    if (existingNoteIndex === -1) {
      console.error(`Note with ID ${id} not found in local storage`);
      return;
    }
    
    // Create updated note with special handling for tags
    const updatedNotes = notes.map(note => {
      if (note.id !== id) return note;
      
      // Create a new note object with the updates
      const newNote = { ...note, ...updatedNote };
      
      // Special handling for tags to ensure they're properly managed
      if (updatedNote.tags !== undefined) {
        // Make sure tags is an array
        newNote.tags = Array.isArray(updatedNote.tags) ? 
          [...updatedNote.tags] : [];
        console.log(`[LOCAL STORAGE] Setting tags for note ${id} to:`, JSON.stringify(newNote.tags));
      }
      
      // Set the update timestamp
      newNote.updatedAt = new Date();
      
      // Recalculate file size if content changed
      if (updatedNote.content !== undefined || updatedNote.noteTitle !== undefined) {
        newNote.fileSize = calculateNoteSize(newNote);
      }
      
      return newNote;
    });
    
    // Save to local storage
    window.localStorage.setItem('notes', JSON.stringify(updatedNotes));
    
    // Note: History is managed by EditHistoryService for content changes
    // Only add history for non-content updates (title, tags, category)
    if (updatedNote.noteTitle !== undefined && updatedNote.content === undefined) {
      this.addHistoryEntry(id, 'title');
    } else if (updatedNote.tags !== undefined && updatedNote.content === undefined) {
      this.addHistoryEntry(id, 'tags');
    } else if (updatedNote.category !== undefined && updatedNote.content === undefined) {
      this.addHistoryEntry(id, 'category');
    }
  },
  
  // Update note tags
  updateNoteTags(id: number, tags: string[]): string[] {
    if (typeof window === 'undefined') {
      return [];
    }
    
    // Get all notes
    const notes = this.getNotes();
    
    // Find the note
    const note = notes.find(note => note.id === id);
    if (!note) {
      console.error(`Note with ID ${id} not found in local storage`);
      return [];
    }
    
    // Clean and normalize tags
    const cleanTags = Array.isArray(tags) ? 
      [...tags].filter(Boolean).map(tag => tag.trim().toLowerCase()) : [];
    
    console.log(`[LOCAL STORAGE] Setting tags for note ${id} to:`, JSON.stringify(cleanTags));
    
    // Update the note
    note.tags = cleanTags;
    note.updatedAt = new Date();
    
    // Save to localStorage
    window.localStorage.setItem('notes', JSON.stringify(notes));
    
    // Note: History is managed by EditHistoryService, not added here
    
    // Return the cleaned tags
    return cleanTags;
  },

  // Bulk delete notes
  bulkDeleteNotes(ids: number[]): { successful: number[], failed: { id: number, error: string }[] } {
    const successful: number[] = [];
    const failed: { id: number, error: string }[] = [];
    
    try {
      const notes = this.getNotes();
      const idsSet = new Set(ids);
      const updatedNotes = notes.filter(note => {
        if (idsSet.has(note.id)) {
          successful.push(note.id);
          // Remove history for this note
          if (typeof window !== 'undefined') {
            try {
              window.localStorage.removeItem(`note_history_${note.id}`);
            } catch (historyError) {
              console.warn(`Failed to remove history for note ${note.id}:`, historyError);
            }
          }
          return false; // Remove this note
        }
        return true; // Keep this note
      });
      
      window.localStorage.setItem('notes', JSON.stringify(updatedNotes));
      
      return { successful, failed };
    } catch (error) {
      // If the entire operation fails, mark all as failed
      ids.forEach(id => {
        failed.push({ 
          id, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      });
      
      return { successful, failed };
    }
  },
};
