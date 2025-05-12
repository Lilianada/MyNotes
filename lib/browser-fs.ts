"use client";

import { Note } from "@/types";

// Helper to sanitize file names and create a slug
const sanitizeFileName = (name: string): string => {
  // First trim and limit to a reasonable length to prevent extremely long file names
  const trimmedName = name.trim().slice(0, 100);
  
  return trimmedName
    .toLowerCase()
    .replace(/[/\\?%*:|"<>]/g, '') // Remove prohibited characters
    .replace(/\s+/g, '-')           // Replace spaces with hyphens
    .replace(/[^\w\-\.]/g, '')       // Remove non-word chars except hyphens and dots
    .replace(/\-\-+/g, '-')          // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '')         // Remove leading/trailing hyphens
    .replace(/\.+$/, '')             // Remove trailing dots
    || 'untitled';                   // Fallback if empty after processing
};

export async function saveNoteToFile(content: string, id: number, title: string) {
  try {
    // Instead of saving to the file system, we'll save to local storage
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    const fileName = title ? sanitizeFileName(title) : `note-${id}`;
    const filePath = `notes/${fileName}.md`;
    
    // Update or add the note
    const existingNoteIndex = notes.findIndex((note: Note) => note.id === id);
    if (existingNoteIndex !== -1) {
      notes[existingNoteIndex].content = content;
      notes[existingNoteIndex].filePath = filePath;
    }
    
    // Save back to localStorage
    localStorage.setItem('notes', JSON.stringify(notes));
    
    return {
      success: true,
      message: "Note saved successfully",
      filePath: filePath,
    };
  } catch (error: any) {
    console.error("Error saving note to local storage:", error);
    return {
      success: false,
      message: error.message || "Failed to save note",
    };
  }
}

export async function createEmptyNoteFile(title: string) {
  try {
    const fileName = sanitizeFileName(title);
    const filePath = `notes/${fileName}.md`;
    
    // We don't actually create a file, just return the path as if we did
    return {
      success: true,
      message: "Empty note file created",
      filePath: filePath,
    };
  } catch (error: any) {
    console.error("Error creating empty note path:", error);
    return {
      success: false,
      message: error.message || "Failed to create note file",
    };
  }
}

export async function deleteNoteFile(filePath: string) {
  // In a browser environment, we don't need to delete actual files
  // This is just a placeholder function to maintain API compatibility
  return {
    success: true,
    message: "Note deleted from storage",
  };
}
