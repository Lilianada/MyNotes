import fs from 'fs';
import path from 'path';
import { Note } from "@/types";

/**
 * Ensures a directory exists, creating it if necessary
 */
export function ensureDirectoryExists(dirPath: string): boolean {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    return true;
  } catch (error) {
    console.error('Error ensuring directory exists:', error);
    return false;
  }
}

/**
 * Writes content to a file, ensuring the directory exists
 */
export function writeToFile(filePath: string, content: string): boolean {
  try {
    // Ensure the parent directory exists
    const directory = path.dirname(filePath);
    ensureDirectoryExists(directory);
    
    // Write the file
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing to file:', error);
    return false;
  }
}

/**
 * Reads content from a file
 */
export function readFromFile(filePath: string): string | null {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error('Error reading from file:', error);
    return null;
  }
}

/**
 * Deletes a file
 */
export function deleteFile(filePath: string): boolean {
  try {
    if (!fs.existsSync(filePath)) {
      return false;
    }
    fs.unlinkSync(filePath);
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}

/**
 * Renames a file
 */
export function renameFile(oldPath: string, newPath: string): boolean {
  try {
    if (!fs.existsSync(oldPath)) {
      return false;
    }
    fs.renameSync(oldPath, newPath);
    return true;
  } catch (error) {
    console.error('Error renaming file:', error);
    return false;
  }
}

/**
 * Lists files in a directory
 */
export function listFiles(dirPath: string, extension?: string): string[] {
  try {
    if (!fs.existsSync(dirPath)) {
      return [];
    }
    
    const files = fs.readdirSync(dirPath);
    
    if (extension) {
      return files.filter(file => file.endsWith(extension));
    }
    
    return files;
  } catch (error) {
    console.error('Error listing files:', error);
    return [];
  }
}

/**
 * Sanitize a string to be used as a filename
 */
export function sanitizeFileName(name: string): string {
  // First trim and limit to a reasonable length to prevent extremely long file names
  const trimmedName = name.trim().slice(0, 100);
  
  return trimmedName
    .toLowerCase()
    .replace(/[/\\?%*:|"<>]/g, '') // Remove prohibited characters
    .replace(/\s+/g, '-')          // Replace spaces with hyphens
    .replace(/[^\w\-\.]/g, '')      // Remove non-word chars except hyphens and dots
    .replace(/\-\-+/g, '-')         // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '')        // Remove leading/trailing hyphens
    .replace(/\.+$/, '')            // Remove trailing dots
    || 'untitled';                  // Fallback if empty after processing
}

/**
 * Get a note's content from its filepath
 */
export function getNoteContent(filePath: string): string {
  try {
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf8');
    }
    return '';
  } catch (error) {
    console.error('Error reading note file:', error);
    return '';
  }
}

/**
 * Create a title from a filename
 */
export function titleFromFilename(filename: string): string {
  const baseName = filename.replace(/\.md$/, '').replace(/-/g, ' ');
  
  // Convert from kebab-case to Title Case
  return baseName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Ensures the notes directory exists
 */
export function ensureNotesDirectory(baseDir: string = process.cwd()): string {
  const notesDir = path.resolve(baseDir, "notes");
  ensureDirectoryExists(notesDir);
  return notesDir;
}
