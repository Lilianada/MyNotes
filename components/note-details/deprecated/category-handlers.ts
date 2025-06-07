"use client";

import { useState, useCallback, useEffect } from 'react';
import { Note, NoteCategory } from '@/types';
import { TabType } from './note-details-hooks';
import { useNotes } from '@/contexts/notes/note-context';

export function useCategoryHandlers(
  note: Note | null,
  setActiveTab: (tab: TabType) => void
) {
  const [categories, setCategories] = useState<NoteCategory[]>([]);
  const { notes, updateNoteCategory, updateCategory, deleteCategory } = useNotes();
  
  // Extract all unique categories from notes when the component mounts
  useEffect(() => {
    const uniqueCategories = notes.reduce((acc: NoteCategory[], current: Note) => {
      if (current.category && !acc.find(c => c.id === current.category?.id)) {
        acc.push(current.category);
      }
      return acc;
    }, []);
    setCategories(uniqueCategories);
  }, [notes]);
  
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
