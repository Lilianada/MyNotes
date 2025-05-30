"use client";

import { Note } from "@/types";
import { NoteOperations } from "./note-operations";

export function useNoteRelationships(
  notes: Note[],
  setNotes: (notes: Note[] | ((prev: Note[]) => Note[])) => void,
  isAdmin: boolean,
  user: { uid: string } | null | undefined
) {
  // Handle updating note parent
  const updateNoteParent = async (id: number, parentId: number | null): Promise<void> => {
    try {
      // Find the note to update
      const noteToUpdate = notes.find(note => note.id === id);
      if (!noteToUpdate) {
        throw new Error(`Note with ID ${id} not found`);
      }

      // Create updated note
      const updatedNote = { ...noteToUpdate, parentId, updatedAt: new Date() };

      // Save to storage
      await NoteOperations.updateNoteData(id, updatedNote, Boolean(isAdmin), user);

      // Update local state
      setNotes(prevNotes => 
        prevNotes.map(note => note.id === id ? updatedNote : note)
      );
    } catch (error) {
      console.error("Failed to update note parent:", error);
      throw error;
    }
  };

  // Handle updating note links (bidirectional)
  const updateNoteLinks = async (id: number, linkedNoteIds: number[]): Promise<void> => {
    try {
      // Find the note to update
      const noteToUpdate = notes.find(note => note.id === id);
      if (!noteToUpdate) {
        throw new Error(`Note with ID ${id} not found`);
      }

      // Create updated note
      const updatedNote = { ...noteToUpdate, linkedNoteIds, updatedAt: new Date() };

      // Save to storage
      await NoteOperations.updateNoteData(id, updatedNote, Boolean(isAdmin), user);

      // Update local state with this note's links
      const updatedNotes = notes.map(note => note.id === id ? updatedNote : note);

      // Implement bidirectional linking - update all linked notes to link back
      const promises = linkedNoteIds.map(async linkedId => {
        const linkedNote = updatedNotes.find(note => note.id === linkedId);
        if (!linkedNote) return;

        // If this note is not already in the linked note's links, add it
        if (!linkedNote.linkedNoteIds?.includes(id)) {
          const updatedLinks = [...(linkedNote.linkedNoteIds || []), id];
          const updatedLinkedNote = { 
            ...linkedNote, 
            linkedNoteIds: updatedLinks,
            updatedAt: new Date()
          };

          // Save to storage
          await NoteOperations.updateNoteData(linkedId, updatedLinkedNote, Boolean(isAdmin), user);

          // Update in our updatedNotes array
          return updatedLinkedNote;
        }
        return linkedNote;
      });

      // Wait for all bidirectional link updates
      const bidirectionalResults = await Promise.all(promises);

      // Create final notes array with all updates
      const finalUpdatedNotes = updatedNotes.map(note => {
        const updatedLinkedNote = bidirectionalResults.find(ln => ln && ln.id === note.id);
        return updatedLinkedNote || note;
      });

      // Update state with all changes
      setNotes(finalUpdatedNotes);
    } catch (error) {
      console.error("Failed to update note links:", error);
      throw error;
    }
  };

  // Get all child notes for a given parent
  const getChildNotes = (parentId: number): Note[] => {
    return notes.filter(note => note.parentId === parentId);
  };

  // Get all linked notes for a given note
  const getLinkedNotes = (noteId: number): Note[] => {
    const note = notes.find(n => n.id === noteId);
    if (!note || !note.linkedNoteIds || note.linkedNoteIds.length === 0) {
      return [];
    }
    return notes.filter(n => note.linkedNoteIds?.includes(n.id));
  };

  return {
    updateNoteParent,
    updateNoteLinks,
    getChildNotes,
    getLinkedNotes
  };
}
