"use client";

import { useState, useCallback } from 'react';
import { Note, NoteCategory } from '@/types';
import { TabType } from './note-details-hooks';
import { useNotes } from '@/contexts/notes/note-context';

export function useCategoryHandlers(
  note: Note | null,
  setActiveTab: (tab: TabType) => void
) {
  const [categories, setCategories] = useState<NoteCategory[]>([]);
  const { updateNoteCategory, updateCategory, deleteCategory } = useNotes();
  
  const handleCategorySave = useCallback(async (category: NoteCategory | null) => {
    if (!note) return;
    
    try {
      // note.id is a number
      await updateNoteCategory(note.id, category);
      setActiveTab('details');
    } catch (error) {
      console.error('Failed to update category:', error);
    }
  }, [note, updateNoteCategory, setActiveTab]);

  const handleUpdateCategory = useCallback(async (category: NoteCategory) => {
    try {
      await updateCategory(category);
      setCategories(prev => 
        prev.map(c => c.id === category.id ? category : c)
      );
    } catch (error) {
      console.error("Failed to update category:", error);
    }
  }, [updateCategory]);

  const handleDeleteCategory = useCallback(async (categoryId: string) => {
    try {
      await deleteCategory(categoryId);
      setCategories(prev => prev.filter(c => c.id !== categoryId));
    } catch (error) {
      console.error("Failed to delete category:", error);
    }
  }, [deleteCategory]);

  return {
    categories,
    setCategories,
    handleCategorySave,
    handleUpdateCategory,
    handleDeleteCategory
  };
}
