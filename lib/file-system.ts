import fs from 'fs';
import path from 'path';

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
