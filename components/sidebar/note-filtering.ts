"use client";

import type { Note } from '@/types';
import type { SortOption } from './filter-sort-toolbar';

export interface FilterOptions {
  selectedTag: string | null;
  selectedCategory: string | null;
  selectedArchive: boolean | null;
}

export function useSortedAndFilteredNotes(
  notes: Note[], 
  filterOptions: FilterOptions,
  sortBy: SortOption = 'updated',
  sortOrder: 'asc' | 'desc' = 'desc'
) {
  // Filter notes first
  const filteredNotes = notes.filter(note => {
    // Hide archived notes unless specifically filtering for them
    if (filterOptions.selectedArchive === null && note.archived) {
      return false;
    }
    
    // Filter by tag if selected
    if (filterOptions.selectedTag && (!note.tags || !note.tags.includes(filterOptions.selectedTag))) {
      return false;
    }
    
    // Filter by category if selected
    if (filterOptions.selectedCategory && note.category?.name !== filterOptions.selectedCategory) {
      return false;
    }
    
    // Filter by archive status if selected
    if (filterOptions.selectedArchive !== null && note.archived !== filterOptions.selectedArchive) {
      return false;
    }
    
    return true;
  });

  // Sort the filtered notes
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'updated':
        // Sort by last updated date, then by creation date if updatedAt is the same
        if (a.updatedAt && b.updatedAt) {
          comparison = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        } else if (a.updatedAt) {
          comparison = -1;
        } else if (b.updatedAt) {
          comparison = 1;
        } else {
          comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        break;
        
      case 'created':
        comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        break;
        
      case 'title':
        comparison = a.noteTitle.localeCompare(b.noteTitle);
        break;
        
      case 'wordCount':
        const aWordCount = a.wordCount || 0;
        const bWordCount = b.wordCount || 0;
        comparison = bWordCount - aWordCount;
        break;
        
      default:
        comparison = 0;
    }
    
    // Apply sort order
    return sortOrder === 'asc' ? -comparison : comparison;
  });

  return {
    sortedNotes,
    filteredNotes: sortedNotes
  };
}

export function generateFilterDescription(
  filteredCount: number,
  totalCount: number,
  filterOptions: FilterOptions
): string {
  const hasFilters = filterOptions.selectedTag || filterOptions.selectedCategory || filterOptions.selectedArchive !== null;
  
  if (!hasFilters) {
    return `You have ${totalCount} saved notes`;
  }
  
  let filterDesc = [];
  if (filterOptions.selectedTag) filterDesc.push(`#${filterOptions.selectedTag}`);
  if (filterOptions.selectedCategory) filterDesc.push(`${filterOptions.selectedCategory}`);
  if (filterOptions.selectedArchive === true) filterDesc.push('archived');
  if (filterOptions.selectedArchive === false) filterDesc.push('unarchived');
  
  return `${filteredCount} notes ${filterDesc.length > 0 ? `filtered by ${filterDesc.join(', ')}` : ''}`;
}
