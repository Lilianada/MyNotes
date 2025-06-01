"use client";

import React from 'react';
import { Note } from '@/types';
import { SelectedTags } from './selected-tags';
import { TagList } from './tag-list';
import { CreateTagForm } from './create-tag-form';
import { useTagProcessing } from './use-tag-processing';

/**
 * This component manages a list of tags across all notes
 * and allows users to edit or delete existing tags or create new ones
 */
interface TagManagerSystemProps {
  allNotes: Note[];
  onUpdateTagAcrossNotes: (oldTag: string, newTag: string) => Promise<void>;
  onDeleteTagFromAllNotes: (tag: string) => Promise<void>;
  selectedTags: string[];
  onSelectTag: (tag: string) => void;
  maxTagsAllowed?: number;
  selectionMode?: 'immediate' | 'multi-select';
}

export function TagManagerSystem({ 
  allNotes = [], 
  onUpdateTagAcrossNotes, 
  onDeleteTagFromAllNotes,
  selectedTags = [],
  onSelectTag,
  maxTagsAllowed = 5,
  selectionMode = 'immediate'
}: TagManagerSystemProps) {
  const { sortedTags } = useTagProcessing(allNotes);

  const handleCreateTag = async (tagName: string) => {
    // Normalize to lowercase for case-insensitive comparison
    const normalizedTagName = tagName.toLowerCase();
    
    console.log(`[TAG UI] Attempting to create new tag: "${normalizedTagName}"`);
    
    // Check if this tag already exists
    const tagNameExists = sortedTags.some(
      tagInfo => tagInfo.tag.toLowerCase() === normalizedTagName
    );
    
    if (tagNameExists) {
      console.log(`[TAG UI] Tag already exists: "${normalizedTagName}"`);
      throw new Error('A tag with this name already exists');
    }
    
    console.log(`[TAG UI] Registering new tag: "${normalizedTagName}"`);
    
    // Register the new tag in the system
    await onUpdateTagAcrossNotes('', normalizedTagName);
    console.log(`[TAG UI] Tag registered successfully: "${normalizedTagName}"`);
    
    // If we haven't reached the tag limit, add it to the current note
    if (selectedTags.length < maxTagsAllowed) {
      console.log(`[TAG UI] Adding tag to current note: "${normalizedTagName}"`);
      try {
        // Make sure we're not replacing existing tags, just adding the new one
        onSelectTag(normalizedTagName);
        console.log(`[TAG UI] Tag successfully added to current note: "${normalizedTagName}"`);
      } catch (selectError) {
        console.error('[TAG UI] Error adding tag to current note:', selectError);
        // Still consider tag creation successful even if adding to note fails
      }
    } else {
      console.log(`[TAG UI] Tag limit reached (${maxTagsAllowed}), not adding to current note`);
    }
    
    console.log(`[TAG UI] Tag creation complete for: "${normalizedTagName}"`);
  };

  const handleDeleteTag = async (tag: string) => {
    console.log(`[TAG UI] Attempting to delete tag: "${tag}"`);
    
    await onDeleteTagFromAllNotes(tag);
    console.log(`[TAG UI] Tag successfully deleted: "${tag}"`);
    
    // Check if this tag was on the current note and remove it from selectedTags
    if (selectedTags.includes(tag)) {
      console.log(`[TAG UI] Removing deleted tag from current note: "${tag}"`);
      onSelectTag(tag); // This will toggle/remove the tag from the current note
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium">Tags</h3>
        <span className={`text-xs ${selectedTags.length >= maxTagsAllowed ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
          {selectedTags.length} of {maxTagsAllowed} tags used
        </span>
      </div>
      
      <SelectedTags 
        selectedTags={selectedTags}
        onSelectTag={onSelectTag}
        maxTagsAllowed={maxTagsAllowed}
      />
      
      <TagList 
        tags={sortedTags}
        selectedTags={selectedTags}
        onSelectTag={onSelectTag}
        onUpdateTag={onUpdateTagAcrossNotes}
        onDeleteTag={handleDeleteTag}
        maxTagsAllowed={maxTagsAllowed}
        selectionMode={selectionMode}
      />
      
      <CreateTagForm 
        onCreateTag={handleCreateTag}
        maxTagsAllowed={maxTagsAllowed}
        selectedTagsCount={selectedTags.length}
      />
    </div>
  );
}

export default TagManagerSystem;
