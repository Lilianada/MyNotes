// Types for the Notes app

export interface NoteCategory {
  id: string;
  name: string;
  color: string;
}

export interface NoteEditHistory {
  timestamp: Date;
  editType: 'create' | 'update' | 'title' | 'tags' | 'category' | 'autosave';
  contentSnapshot?: string; 
  contentLength?: number; 
  changePercentage?: number; 
}

export interface Note {
  id: number;
  uniqueId?: string; // 6-8 character unique identifier for sync
  content: string;
  createdAt: Date;
  noteTitle: string;
  filePath?: string;
  slug: string;
  category?: NoteCategory | null;
  wordCount?: number;
  tags?: string[];
  parentId?: number | null;
  linkedNoteIds?: number[];
  updatedAt?: Date;
  publish?: boolean;
  description?: string;
  editHistory?: NoteEditHistory[];
  archived?: boolean;
  fileSize?: number; 
  isLocalOnly?: boolean;
}

// User storage tracking interface
export interface UserStorage {
  userId: string;
  totalStorage: number; 
  maxStorage: number; 
  noteCount: number;
  lastUpdated: Date;
  isAdmin: boolean;
  displayName?: string; 
}

// Storage alert interface
export interface StorageAlert {
  type: 'warning' | 'error';
  message: string;
  percentage: number;
}