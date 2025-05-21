// Types for the Notes app

export interface NoteCategory {
  id: string;
  name: string;
  color: string;
}

export interface NoteEditHistory {
  timestamp: Date;
  editType: 'create' | 'update' | 'title';
}

export interface Note {
  id: number;
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
}