"use client";

import type { Note } from '@/types';

export interface NoteRelationshipInfo {
  isParent: boolean;
  isChild: boolean;
  isLinked: boolean;
}

export function getNoteRelationshipInfo(
  note: Note,
  getChildNotes: (noteId: number) => Note[],
  getLinkedNotes: (noteId: number) => Note[]
): NoteRelationshipInfo {
  // Check if this note is a parent (has child notes)
  const childNotes = getChildNotes(note.id);
  const isParent = childNotes.length > 0;
  
  // Check if this note is a child (has a parent)
  const isChild = note.parentId !== null && note.parentId !== undefined;
  
  // Check if this note is linked to other notes
  const linkedNotes = getLinkedNotes(note.id);
  const isLinked = linkedNotes.length > 0;
  
  return { isParent, isChild, isLinked };
}
