"use server"

import { existsSync, readdirSync, readFileSync } from "fs";
import { resolve } from "path";
import type { Note } from "@/types";
import { ensureNotesDirectory, titleFromFilename } from "./file-system";

// Load notes from the file system
export async function loadNotesFromFiles(): Promise<Note[]> {
  try {
    const notesDir = ensureNotesDirectory();
    
    // Get all markdown files
    const files = readdirSync(notesDir).filter(file => file.endsWith('.md'));
    let id = 1;
    
    const notes: Note[] = files.map(file => {
      const filePath = resolve(notesDir, file);
      const content = readFileSync(filePath, 'utf8');
      
      // Use the titleFromFilename function to get a formatted title
      const formattedTitle = titleFromFilename(file);
      
      // Create a slug from the filename (remove .md and convert to lowercase)
      const slug = file.replace('.md', '').toLowerCase().replace(/\s+/g, '-');
      
      return {
        id: id++,
        content,
        createdAt: new Date(),  // We'll use file stats in a more advanced version
        noteTitle: formattedTitle,
        filePath,
        slug
      };
    });
    
    return notes;
  } catch (error) {
    console.error("Error loading notes from files:", error);
    return [];
  }
}

// Load a single note from a file
export async function loadNoteFromFile(filePath: string): Promise<Note | null> {
  try {
    const content = readFileSync(filePath, 'utf8');
    const fileName = filePath.split('/').pop() || "";
    const noteTitle = fileName.replace(/\.md$/, '');
    const slug = noteTitle.toLowerCase().replace(/\s+/g, '-');
    
    return {
      id: Date.now(),  // Generate a temporary ID
      content,
      createdAt: new Date(),
      noteTitle,
      filePath,
      slug
    };
      
  } catch (error) {
    console.error("Error loading note from file:", error);
    return null;
  }
}

// Sync local storage notes with file system
export async function syncNotesWithFileSystem(localNotes: Note[]): Promise<Note[]> {
  try {
    // Load notes from files
    const fileNotes = await loadNotesFromFiles();
    
    // Create a map of existing notes by file path
    const existingNotesByPath = new Map<string, Note>();
    localNotes.forEach(note => {
      if (note.filePath) {
        existingNotesByPath.set(note.filePath, note);
      }
    });
    
    // Create a map of existing notes by title (for notes without file paths)
    const existingNotesByTitle = new Map<string, Note>();
    localNotes.forEach(note => {
      if (!note.filePath) {
        existingNotesByTitle.set(note.noteTitle, note);
      }
    });
    
    // Merge notes from files with local notes
    const mergedNotes: Note[] = [];
    let maxId = localNotes.length > 0 ? Math.max(...localNotes.map(note => note.id)) : 0;
    
    // First add local notes that have file paths
    fileNotes.forEach(fileNote => {
      const existingNote = existingNotesByPath.get(fileNote.filePath || "");
      if (existingNote) {
        // Use existing note with updated content
        mergedNotes.push({
          ...existingNote,
          content: fileNote.content
        });
      } else {
        // This is a new note from file
        mergedNotes.push({
          ...fileNote,
          id: ++maxId
        });
      }
    });
    
    // Then add local notes that don't have files yet
    localNotes.forEach(note => {
      if (!note.filePath && !mergedNotes.some(n => n.id === note.id)) {
        mergedNotes.push(note);
      }
    });
    
    return mergedNotes;
  } catch (error) {
    console.error("Error syncing notes with file system:", error);
    return localNotes;
  }
}
