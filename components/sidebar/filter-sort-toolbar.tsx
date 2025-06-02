"use client";

import React, { useState } from 'react';
import { Filter, ArrowUpDown, Trash2, X, Tag, Archive, Folder, Globe } from 'lucide-react';
import TagsDropdown from '../filters/tags-dropdown';
import CategoriesDropdown from '../filters/categories-dropdown';
import ArchivesDropdown from '../filters/archives-dropdown';
import PublishedDropdown from '../filters/published-dropdown';

export type SortOption = 'updated' | 'created' | 'title' | 'wordCount';

interface FilterSortToolbarProps {
  // Filter props
  selectedTag: string | null;
  selectedCategory: string | null;
  selectedArchive: boolean | null;
  selectedPublished: boolean | null;
  onSelectTag: (tag: string | null) => void;
  onSelectCategory: (categoryId: string | null) => void;
  onSelectArchive: (isArchived: boolean | null) => void;
  onSelectPublished: (isPublished: boolean | null) => void;
  
  // Sort props
  sortBy: SortOption;
  sortOrder: 'asc' | 'desc';
  onSortChange: (sortBy: SortOption, sortOrder: 'asc' | 'desc') => void;
  
  // Selection and bulk delete props
  isSelectionMode: boolean;
  selectedNoteIds: Set<number>;
  filteredNotesLength: number;
  isBulkDeleting: boolean;
  onToggleSelectionMode: () => void;
  onSelectAll: () => void;
  onBulkDelete: () => void;
}

export function FilterSortToolbar({
  selectedTag,
  selectedCategory,
  selectedArchive,
  selectedPublished,
  onSelectTag,
  onSelectCategory,
  onSelectArchive,
  onSelectPublished,
  sortBy,
  sortOrder,
  onSortChange,
  isSelectionMode,
  selectedNoteIds,
  filteredNotesLength,
  isBulkDeleting,
  onToggleSelectionMode,
  onSelectAll,
  onBulkDelete,
}: FilterSortToolbarProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);

  const hasActiveFilters = selectedTag || selectedCategory || selectedArchive !== null || selectedPublished !== null;
  
  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'updated', label: 'Last Updated' },
    { value: 'created', label: 'Date Created' },
    { value: 'title', label: 'Title' },
    { value: 'wordCount', label: 'Word Count' },
  ];

  const handleSortOptionChange = (newSortBy: SortOption) => {
    const newOrder = newSortBy === sortBy && sortOrder === 'desc' ? 'asc' : 'desc';
    onSortChange(newSortBy, newOrder);
    setShowSort(false);
  };

  const clearAllFilters = () => {
    onSelectTag(null);
    onSelectCategory(null);
    onSelectArchive(null);
    onSelectPublished(null);
    setShowFilters(false);
  };

  if (isSelectionMode) {
    return (
      <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
        {/* First row: Selection count and select all */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {selectedNoteIds.size} selected
          </span>
          <button
            onClick={onSelectAll}
            className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 font-medium"
          >
            {selectedNoteIds.size === filteredNotesLength ? 'Deselect All' : 'Select All'}
          </button>
        </div>
        
        {/* Second row: Action buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={onBulkDelete}
            disabled={selectedNoteIds.size === 0 || isBulkDeleting}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-sm text-white bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 rounded disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            title={`Delete ${selectedNoteIds.size} selected notes`}
          >
            <Trash2 className="w-4 h-4" />
            <span className="text-xs">
              {isBulkDeleting ? 'Deleting...' : 'Delete'}
            </span>
          </button>
          <button
            onClick={onToggleSelectionMode}
            className="flex items-center justify-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            title="Cancel selection"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        {/* Left side - Filter and Sort icons */}
        <div className="flex items-center gap-2">
          {/* Filter Button */}
          <div className="relative">
            <button
              onClick={() => {
                setShowFilters(!showFilters);
                setShowSort(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors ${
                hasActiveFilters
                  ? 'text-blue-600 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20 dark:hover:bg-blue-900/30'
                  : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Filter</span>
              {hasActiveFilters && (
                <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
              )}
            </button>

            {/* Filter Dropdown */}
            {showFilters && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50">
                <div className="p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Filters</h3>
                    {hasActiveFilters && (
                      <button
                        onClick={clearAllFilters}
                        className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-gray-400" />
                      <div className="flex-1">
                        <TagsDropdown
                          selectedTag={selectedTag}
                          onSelectTag={onSelectTag}
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Folder className="w-4 h-4 text-gray-400" />
                      <div className="flex-1">
                        <CategoriesDropdown
                          selectedCategory={selectedCategory}
                          onSelectCategory={onSelectCategory}
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Archive className="w-4 h-4 text-gray-400" />
                      <div className="flex-1">
                        <ArchivesDropdown
                          selectedArchive={selectedArchive}
                          onSelectArchive={onSelectArchive}
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-gray-400" />
                      <div className="flex-1">
                        <PublishedDropdown
                          selectedPublished={selectedPublished}
                          onSelectPublished={onSelectPublished}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sort Button */}
          <div className="relative">
            <button
              onClick={() => {
                setShowSort(!showSort);
                setShowFilters(false);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              <ArrowUpDown className="w-4 h-4" />
              <span>Sort</span>
            </button>

            {/* Sort Dropdown */}
            {showSort && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50">
                <div className="p-2">
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 px-2 py-1 mb-1">
                    Sort by
                  </div>
                  {sortOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => handleSortOptionChange(option.value)}
                      className={`w-full text-left px-2 py-1.5 text-sm rounded transition-colors flex items-center justify-between ${
                        sortBy === option.value
                          ? 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20'
                          : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                      }`}
                    >
                      <span>{option.label}</span>
                      {sortBy === option.value && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {sortOrder === 'desc' ? '↓' : '↑'}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right side - Bulk Delete Button */}
        <button
          onClick={onToggleSelectionMode}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete</span>
        </button>
      </div>

      {/* Close dropdowns when clicking outside */}
      {(showFilters || showSort) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowFilters(false);
            setShowSort(false);
          }}
        />
      )}
    </div>
  );
}
