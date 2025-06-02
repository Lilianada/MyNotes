"use client";

import React, { useState } from 'react';
import { Note } from '@/types';
import { Check, Hash, X, Plus, Tag } from 'lucide-react';
import { useTagProcessing } from '../tags/use-tag-processing';
import { useUserPreferences } from '@/contexts/user-preferences-context';

interface TagsTabContentProps {
  note: Note;
  notes: Note[];
  updateTagAcrossNotes: (oldTag: string, newTag: string) => Promise<void>;
  deleteTagFromAllNotes: (tag: string) => Promise<void>;
  onSelectTag: (tag: string) => void;
  pendingTags?: string[];
  onApplyTagChanges?: () => void;
  onCancelTagSelection?: () => void;
}

export function TagsTabContent({ 
  note, 
  notes, 
  updateTagAcrossNotes, 
  deleteTagFromAllNotes, 
  onSelectTag,
  pendingTags,
  onApplyTagChanges,
  onCancelTagSelection
}: TagsTabContentProps) {
  const { sortedTags } = useTagProcessing(notes);
  const { addRecentTag } = useUserPreferences();
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);

  // Use pending tags if in multi-select mode, otherwise use note's actual tags
  const currentTags = pendingTags || note.tags || [];
  const maxTagsAllowed = 5;
  const hasChanges = pendingTags && JSON.stringify(pendingTags.sort()) !== JSON.stringify((note.tags || []).sort());

  // Handle tag selection
  const handleTagClick = (tag: string) => {
    addRecentTag(tag);
    onSelectTag(tag);
  };

  // Handle creating new tag
  const handleCreateTag = async () => {
    const trimmedTagName = newTagName.trim().toLowerCase();
    if (!trimmedTagName) {
      setNameError('Please enter a tag name');
      return;
    }

    // Check if tag already exists
    const tagExists = sortedTags.some(tagInfo => tagInfo.tag.toLowerCase() === trimmedTagName);
    if (tagExists) {
      setNameError('A tag with this name already exists');
      return;
    }

    try {
      // Add the new tag to current selection if we have room
      if (currentTags.length < maxTagsAllowed) {
        onSelectTag(trimmedTagName);
      }
      
      // Reset form
      setNewTagName('');
      setNameError(null);
      setIsCreatingTag(false);
      
      // Note: The tag will be persisted when the user clicks "Apply Changes"
      // and will then appear in the Available Tags section
    } catch (error: any) {
      setNameError(error.message || 'Failed to create tag');
    }
  };

  const handleCancelCreate = () => {
    setIsCreatingTag(false);
    setNewTagName('');
    setNameError(null);
  };

  return (
    <div className="space-y-6">
      {/* Current Tags Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 flex items-center">
            <Tag size={16} className="mr-2" />
            Current Tags ({currentTags.length}/{maxTagsAllowed})
          </h3>
          {hasChanges && (
            <div className="flex gap-2">
              {onCancelTagSelection && (
                <button
                  onClick={onCancelTagSelection}
                  className="px-3 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              )}
              {onApplyTagChanges && (
                <button
                  onClick={onApplyTagChanges}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Apply Changes
                </button>
              )}
            </div>
          )}
        </div>
        
        {currentTags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {currentTags.map(tag => (
              <div 
                key={tag} 
                className="flex items-center bg-blue-100 dark:bg-blue-800 text-blue-900 dark:text-blue-100 rounded-full px-3 py-1.5 text-sm font-medium shadow-sm"
              >
                <Check size={14} className="mr-1.5 text-blue-600 dark:text-blue-300" />
                <span>#{tag}</span>
                <button
                  onClick={() => handleTagClick(tag)}
                  className="ml-2 text-blue-600 dark:text-blue-300 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full p-0.5 transition-colors"
                  aria-label={`Remove tag ${tag}`}
                  title="Remove tag"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="text-gray-400 dark:text-gray-500 mb-2">
              <Tag size={24} className="mx-auto opacity-50" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">No tags selected</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Choose from available tags below or create new ones</p>
          </div>
        )}
        
        {currentTags.length >= maxTagsAllowed && (
          <div className="mt-3 p-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded text-xs text-orange-700 dark:text-orange-300">
            <strong>Tag limit reached:</strong> Remove a tag to add another one.
          </div>
        )}
      </div>

      {/* Available Tags Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Available Tags</h3>
          <button
            onClick={() => setIsCreatingTag(true)}
            className="flex items-center px-3 py-1.5 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors shadow-sm"
          >
            <Plus size={14} className="mr-1" />
            New Tag
          </button>
        </div>

        {/* Create Tag Form */}
        {isCreatingTag && (
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="space-y-3">
              <div>
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => {
                    setNewTagName(e.target.value);
                    setNameError(null);
                  }}
                  placeholder="Enter tag name"
                  className={`w-full px-3 py-2 text-sm border rounded-md ${
                    nameError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                  autoFocus
                />
                {nameError && (
                  <p className="text-xs text-red-500 mt-1">{nameError}</p>
                )}
              </div>
              
              <div className="flex justify-end gap-2">
                <button
                  onClick={handleCancelCreate}
                  className="px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTag}
                  disabled={!newTagName.trim()}
                  className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Create Tag
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tags Grid */}
        <div className="grid gap-2 max-h-80 overflow-y-auto">
          {sortedTags.length > 0 ? (
            sortedTags.map(({ tag, count }) => {
              const isSelected = currentTags.includes(tag);
              const canSelect = !isSelected && currentTags.length < maxTagsAllowed;
              const canInteract = isSelected || canSelect;
              
              return (
                <button
                  key={tag}
                  onClick={() => canInteract && handleTagClick(tag)}
                  disabled={!canInteract}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                    isSelected 
                      ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-900 dark:text-blue-100 shadow-sm' 
                      : canSelect
                        ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100'
                        : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-60'
                  }`}
                >
                  <div className="flex items-center">
                    {isSelected ? (
                      <div className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white mr-3">
                        <Check size={12} />
                      </div>
                    ) : (
                      <div className={`flex items-center justify-center w-5 h-5 rounded-full mr-3 ${
                        canSelect 
                          ? 'border-2 border-gray-300 dark:border-gray-600' 
                          : 'border-2 border-gray-200 dark:border-gray-700'
                      }`}>
                        {canSelect && (
                          <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                    )}
                    <span className={`text-sm font-medium ${isSelected ? 'text-blue-900 dark:text-blue-100' : ''}`}>
                      #{tag}
                    </span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    isSelected 
                      ? 'bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  }`}>
                    {count} {count === 1 ? 'note' : 'notes'}
                  </span>
                </button>
              );
            })
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 dark:text-gray-500 mb-2">
                <Hash size={32} className="mx-auto opacity-50" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">No tags available</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Create your first tag to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
