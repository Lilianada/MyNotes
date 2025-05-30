"use client";

import { Note, NoteCategory } from "@/types";
import { NoteOperations } from "./note-operations";

export function useNoteCategories(
  notes: Note[],
  setNotes: (notes: Note[] | ((prev: Note[]) => Note[])) => void,
  isAdmin: boolean,
  user: { uid: string } | null | undefined
) {
  const updateNoteCategory = async (id: number, category: NoteCategory | null): Promise<void> => {
    // Find the note to update
    const noteToUpdate = notes.find((note) => note.id === id);

    if (!noteToUpdate) return;
    
    const now = new Date();

    // Update in state first for immediate UI update with timestamp
    setNotes((prevNotes) =>
      prevNotes.map((note) => (note.id === id ? { ...note, category, updatedAt: now } : note))
    );

    try {
      await NoteOperations.updateNoteCategory(id, category, Boolean(isAdmin), user);
    } catch (error) {
      // Revert the state update if the operation fails
      setNotes((prevNotes) =>
        prevNotes.map((note) => (note.id === id ? { ...note, category: noteToUpdate.category } : note))
      );
      throw error;
    }
  };

  const updateCategory = async (updatedCategory: NoteCategory): Promise<void> => {
    try {
      // First, update all notes that use this category
      const notesWithCategory = notes.filter(note => note.category?.id === updatedCategory.id);
      
      // Update each note's category separately
      const updatePromises = notesWithCategory.map(note => {
        return NoteOperations.updateNoteCategory(
          note.id,
          updatedCategory,
          Boolean(isAdmin),
          user
        );
      });
      
      // Wait for all updates to complete
      await Promise.all(updatePromises);
      
      // Now update the local state
      setNotes(prevNotes => 
        prevNotes.map(note => 
          note.category?.id === updatedCategory.id
            ? { ...note, category: updatedCategory }
            : note
        )
      );
    } catch (error) {
      console.error("Failed to update category:", error);
      throw error;
    }
  };

  const deleteCategory = async (categoryId: string) => {
    try {
      // Remove the category from all notes
      await NoteOperations.removeCategory(categoryId, Boolean(isAdmin), user, notes);
      
      // Update the state for all notes that had this category
      setNotes(prevNotes => 
        prevNotes.map(note => 
          note.category && note.category.id === categoryId
            ? { ...note, category: null }
            : note
        )
      );
    } catch (error) {
      console.error("Failed to delete category:", error);
      throw error;
    }
  };

  return {
    updateNoteCategory,
    updateCategory,
    deleteCategory
  };
}
