"use client";

import type { Note } from '@/types';

export interface FilterOptions {
  selectedTag: string | null;
  selectedCategory: string | null;
  selectedArchive: boolean | null;
}

export function useSortedAndFilteredNotes(notes: Note[], filterOptions: FilterOptions) {
  // Sort notes by last updated date, then by creation date if updatedAt is the same
  const sortedNotes = [...notes].sort((a, b) => {
    // If both notes have updatedAt timestamps, sort by that first
    if (a.updatedAt && b.updatedAt) {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
    // If only one has updatedAt, prioritize that one
    if (a.updatedAt) return -1;
    if (b.updatedAt) return 1;
    // Fall back to createdAt if neither has updatedAt
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  
  // Filter notes by selected tag, category, and archive status
  const filteredNotes = sortedNotes.filter(note => {
    // Filter by tag if selected
    if (filterOptions.selectedTag && (!note.tags || !note.tags.includes(filterOptions.selectedTag))) {
      return false;
    }
    
    // Filter by category if selected
    if (filterOptions.selectedCategory && note.category?.name !== filterOptions.selectedCategory) {
      return false;
    }
    
    // TODO: Filter by archive status when archived property is added to Note type
    // if (filterOptions.selectedArchive !== null && note.archived !== filterOptions.selectedArchive) {
    //   return false;
    // }
    
    return true;
  });

  return {
    sortedNotes,
    filteredNotes
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
