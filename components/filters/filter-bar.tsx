"use client";

import React from 'react';
import TagsDropdown from './tags-dropdown';
import CategoriesDropdown from './categories-dropdown';
import ArchivesDropdown from './archives-dropdown';
import PublishedDropdown from './published-dropdown';

interface FilterBarProps {
  selectedTag: string | null;
  selectedCategory: string | null;
  selectedArchive: boolean | null;
  selectedPublished: boolean | null;
  onSelectTag: (tag: string | null) => void;
  onSelectCategory: (categoryId: string | null) => void;
  onSelectArchive: (isArchived: boolean | null) => void;
  onSelectPublished: (isPublished: boolean | null) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  selectedTag,
  selectedCategory,
  selectedArchive,
  selectedPublished,
  onSelectTag,
  onSelectCategory,
  onSelectArchive,
  onSelectPublished,
}) => {
  return (
    <div className="px-4 py-3 border-b border-gray-200">
      <div className="flex items-center gap-2 flex-wrap">
        <TagsDropdown
          selectedTag={selectedTag}
          onSelectTag={onSelectTag}
        />
        <CategoriesDropdown
          selectedCategory={selectedCategory}
          onSelectCategory={onSelectCategory}
        />
        <ArchivesDropdown
          selectedArchive={selectedArchive}
          onSelectArchive={onSelectArchive}
          selectedPublished={selectedPublished}
          onSelectPublished={onSelectPublished}
        />
      </div>
    </div>
  );
};

export default FilterBar;
