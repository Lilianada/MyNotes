"use client";

import React from 'react';
import { Note, NoteCategory } from '@/types';
import { CategoryManager } from '../categories/category-manager';

interface CategoryTabContentProps {
  note: Note;
  categories: NoteCategory[];
  handleCategorySave: (category: NoteCategory | null) => Promise<void>;
  handleUpdateCategory: (category: NoteCategory) => Promise<void>;
  handleDeleteCategory: (categoryId: string) => Promise<void>;
}

export function CategoryTabContent({
  note,
  categories,
  handleCategorySave,
  handleUpdateCategory,
  handleDeleteCategory
}: CategoryTabContentProps) {
  return (
    <CategoryManager
      categories={categories}
      onSaveCategory={handleCategorySave}
      onSelectCategory={handleCategorySave}
      onUpdateCategory={handleUpdateCategory}
      onDeleteCategory={handleDeleteCategory}
      selectedCategoryId={note.category?.id}
    />
  );
}
