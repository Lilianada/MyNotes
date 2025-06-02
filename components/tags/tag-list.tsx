"use client";

import React from 'react';
import { TagItem } from './tag-item';

interface TagInfo {
  tag: string;
  count: number;
}

interface TagListProps {
  tags: TagInfo[];
  selectedTags: string[];
  onSelectTag: (tag: string) => void;
  onUpdateTag: (oldTag: string, newTag: string) => Promise<void>;
  onDeleteTag: (tag: string) => Promise<void>;
  maxTagsAllowed: number;
  selectionMode?: 'immediate' | 'multi-select';
}

export function TagList({ 
  tags, 
  selectedTags, 
  onSelectTag, 
  onUpdateTag, 
  onDeleteTag, 
  maxTagsAllowed,
  selectionMode = 'immediate'
}: TagListProps) {
  const canSelectMoreTags = selectedTags.length < maxTagsAllowed;
  const existingTags = tags.map(t => t.tag);

  if (tags.length === 0) {
    return (
      <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-hide">
        <p className="text-sm text-gray-500">No tags yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-hide">
      {tags.map(({ tag, count }) => (
        <TagItem
          key={tag}
          tag={tag}
          count={count}
          isSelected={selectedTags.includes(tag)}
          onSelectTag={onSelectTag}
          onUpdateTag={onUpdateTag}
          onDeleteTag={onDeleteTag}
          canSelectMoreTags={canSelectMoreTags}
          existingTags={existingTags}
        />
      ))}
    </div>
  );
}
