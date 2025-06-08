"use client";

import { Note, NoteCategory } from '@/types';
import { generateUniqueId } from '../storage/storage-utils';
import { countWords } from './word-count';
import { parse as parseYaml } from 'yaml';
import { v4 as uuidv4 } from 'uuid';
import mammoth from 'mammoth';
// Import PDF.js in a way that works with Next.js
let pdfjs: typeof import('pdfjs-dist');

// Initialize PDF.js only on the client side
if (typeof window !== 'undefined') {
  // Dynamic import to avoid SSR issues
  const initPdfJs = async () => {
    pdfjs = await import('pdfjs-dist');
    // Use a CDN-hosted worker instead of trying to import it
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
  };
  
  // Initialize PDF.js
  initPdfJs().catch(err => console.error('Failed to initialize PDF.js:', err));
}

/**
 * Type for supported import formats
 */
export type ImportFormat = 'markdown' | 'txt' | 'pdf' | 'doc' | 'docx';

/**
 * Interface for import result
 */
export interface ImportResult {
  success: boolean;
  notes: Note[];
  errors: string[];
  warnings: string[];
}

/**
 * Helper function to create a slug from a title
 */
function createSlugFromTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") 
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    || "untitled";
}

/**
 * Parse frontmatter from markdown content
 * Returns [frontmatter, content]
 */
function parseFrontMatter(markdown: string): [Record<string, any> | null, string] {
  // Check if the content starts with frontmatter delimiters
  if (!markdown.startsWith('---')) {
    return [null, markdown];
  }

  // Find the end of the frontmatter
  const endIndex = markdown.indexOf('---', 3);
  if (endIndex === -1) {
    return [null, markdown];
  }

  const frontmatterText = markdown.substring(3, endIndex).trim();
  const content = markdown.substring(endIndex + 3).trim();

  try {
    const frontmatter = parseYaml(frontmatterText);
    return [frontmatter, content];
  } catch (error) {
    console.error('Failed to parse frontmatter:', error);
    return [null, markdown];
  }
}

/**
 * Import a markdown file
 */
export async function importMarkdown(file: File): Promise<ImportResult> {
  const result: ImportResult = {
    success: false,
    notes: [],
    errors: [],
    warnings: []
  };

  try {
    const content = await file.text();
    const [frontmatter, noteContent] = parseFrontMatter(content);

    // Generate a new note ID
    const id = Date.now();
    const uniqueId = generateUniqueId();

    // Extract title from frontmatter or filename
    let title = frontmatter?.title || file.name.replace(/\.md$/, '');
    if (!title) {
      title = 'Imported Note';
      result.warnings.push('No title found, using default title');
    }

    // Create slug
    const slug = frontmatter?.slug || createSlugFromTitle(title);

    // Extract tags
    let tags: string[] = [];
    if (frontmatter?.tags) {
      if (Array.isArray(frontmatter.tags)) {
        tags = frontmatter.tags.map(tag => String(tag).toLowerCase());
      } else if (typeof frontmatter.tags === 'string') {
        tags = [frontmatter.tags.toLowerCase()];
      }
    }

    // Extract category
    let category: NoteCategory | null = null;
    if (frontmatter?.category) {
      category = {
        id: uuidv4(),
        name: String(frontmatter.category),
        color: '#3b82f6' // Default blue color
      };
    }

    // Create the note
    const note: Note = {
      id,
      uniqueId,
      noteTitle: title,
      content: noteContent,
      slug,
      tags,
      category,
      createdAt: new Date(),
      updatedAt: new Date(),
      wordCount: countWords(noteContent),
      fileSize: new Blob([content]).size
    };

    result.notes.push(note);
    result.success = true;
  } catch (error) {
    result.errors.push(`Failed to import markdown: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

/**
 * Import a plain text file
 */
export async function importPlainText(file: File): Promise<ImportResult> {
  const result: ImportResult = {
    success: false,
    notes: [],
    errors: [],
    warnings: []
  };

  try {
    const content = await file.text();
    
    // Generate a new note ID
    const id = Date.now();
    const uniqueId = generateUniqueId();

    // Extract title from filename
    const title = file.name.replace(/\.txt$/, '');

    // Create the note
    const note: Note = {
      id,
      uniqueId,
      noteTitle: title,
      content,
      slug: createSlugFromTitle(title),
      tags: [],
      category: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      wordCount: countWords(content),
      fileSize: file.size
    };

    result.notes.push(note);
    result.success = true;
  } catch (error) {
    result.errors.push(`Failed to import text file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

/**
 * Import a PDF file
 */
export async function importPdf(file: File): Promise<ImportResult> {
  const result: ImportResult = {
    success: false,
    notes: [],
    errors: [],
    warnings: []
  };

  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      throw new Error('PDF import is only available in browser environments');
    }
    
    // Ensure PDF.js is loaded
    if (!pdfjs) {
      pdfjs = await import('pdfjs-dist');
      // Use a CDN-hosted worker instead of trying to import it
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
    }
    
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument(arrayBuffer).promise;
    
    let fullText = '';
    
    // Extract text from each page
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      fullText += pageText + '\n\n';
    }
    
    // Generate a new note ID
    const id = Date.now();
    const uniqueId = generateUniqueId();

    // Extract title from filename
    const title = file.name.replace(/\.pdf$/, '');

    // Create the note
    const note: Note = {
      id,
      uniqueId,
      noteTitle: title,
      content: fullText.trim(),
      slug: createSlugFromTitle(title),
      tags: [],
      category: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      wordCount: countWords(fullText),
      fileSize: file.size
    };

    result.notes.push(note);
    result.success = true;
  } catch (error) {
    result.errors.push(`Failed to import PDF file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

/**
 * Import a Word document (doc/docx)
 */
export async function importWordDocument(file: File): Promise<ImportResult> {
  const result: ImportResult = {
    success: false,
    notes: [],
    errors: [],
    warnings: []
  };

  try {
    const arrayBuffer = await file.arrayBuffer();
    const { value: content } = await mammoth.extractRawText({ arrayBuffer });
    
    // Generate a new note ID
    const id = Date.now();
    const uniqueId = generateUniqueId();

    // Extract title from filename
    const title = file.name.replace(/\.(doc|docx)$/, '');

    // Create the note
    const note: Note = {
      id,
      uniqueId,
      noteTitle: title,
      content,
      slug: createSlugFromTitle(title),
      tags: [],
      category: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      wordCount: countWords(content),
      fileSize: file.size
    };

    result.notes.push(note);
    result.success = true;
  } catch (error) {
    result.errors.push(`Failed to import Word document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

/**
 * Import a file based on its format
 */
export async function importFile(file: File): Promise<ImportResult> {
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  
  switch (fileExtension) {
    case 'md':
      return importMarkdown(file);
    case 'txt':
      return importPlainText(file);
    case 'pdf':
      return importPdf(file);
    case 'doc':
    case 'docx':
      return importWordDocument(file);
    default:
      return {
        success: false,
        notes: [],
        errors: [`Unsupported file format: ${fileExtension}`],
        warnings: []
      };
  }
}

/**
 * Import multiple files
 */
export async function importFiles(files: File[]): Promise<ImportResult> {
  const result: ImportResult = {
    success: false,
    notes: [],
    errors: [],
    warnings: []
  };

  try {
    for (const file of files) {
      const fileResult = await importFile(file);
      
      // Combine results
      result.notes.push(...fileResult.notes);
      result.errors.push(...fileResult.errors);
      result.warnings.push(...fileResult.warnings);
    }
    
    result.success = result.notes.length > 0;
  } catch (error) {
    result.errors.push(`Failed to import files: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}
