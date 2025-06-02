// Types for the Notes app

export interface NoteCategory {
  id: string;
  name: string;
  color: string;
}

export interface NoteEditHistory {
  timestamp: Date;
  editType: 'create' | 'update' | 'title' | 'tags' | 'category' | 'autosave';
  contentSnapshot?: string; // Store content snapshot for significant changes
  contentLength?: number; // Track content length for change detection
  changePercentage?: number; // Track percentage of content changed
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
  fileSize?: number; // File size in bytes
}

// User storage tracking interface
export interface UserStorage {
  userId: string;
  totalStorage: number; // Total storage used in bytes
  maxStorage: number; // Storage limit in bytes (10MB for regular users)
  noteCount: number;
  lastUpdated: Date;
  isAdmin: boolean;
  displayName?: string; // Optional user display name
}

// Storage alert interface
export interface StorageAlert {
  type: 'warning' | 'error';
  message: string;
  percentage: number;
}