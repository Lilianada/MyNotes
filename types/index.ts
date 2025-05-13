// Types for the Notes app

export type Note = {
  id: number;
  content: string;
  createdAt: Date;
  noteTitle: string;
  filePath?: string;
  slug: string;
};