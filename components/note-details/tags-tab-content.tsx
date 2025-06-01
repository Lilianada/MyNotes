"use client";

import React from 'react';
import { Note } from '@/types';
import TagManagerSystem from '../tags/tag-manager-system';

interface TagsTabContentProps {
  note: Note;
  notes: Note[];
  updateTagAcrossNotes: (oldTag: string, newTag: string) => Promise<void>;
  deleteTagFromAllNotes: (tag: string) => Promise<void>;
  onSelectTag: (tag: string) => void;
  pendingTags?: string[];
  tagSelectionMode?: 'immediate' | 'multi-select';
  onToggleSelectionMode?: () => void;
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
  tagSelectionMode = 'immediate',
  onToggleSelectionMode,
  onApplyTagChanges,
  onCancelTagSelection
}: TagsTabContentProps) {
  // Determine which tags to show based on mode
  const currentTags = pendingTags || note.tags || [];
  
  return (
    <>
      <div className="bg-gray-50 dark:bg-gray-700 p-3 mb-4 rounded-md">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            <strong>Note:</strong> You can add up to 5 tags per note to help with organization.
          </p>
          {onToggleSelectionMode && (
            <button
              onClick={onToggleSelectionMode}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                tagSelectionMode === 'multi-select'
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-500'
              }`}
            >
              {tagSelectionMode === 'multi-select' ? 'Exit Multi-Select' : 'Multi-Select Mode'}
            </button>
          )}
        </div>
        
        {tagSelectionMode === 'multi-select' && (
          <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded border">
            💡 Click multiple tags to select/deselect them, then click "Apply Changes" to save.
          </div>
        )}
      </div>

      {/* Action buttons for multi-select mode */}
      {tagSelectionMode === 'multi-select' && (onApplyTagChanges || onCancelTagSelection) && (
        <div className="flex justify-end gap-2 mb-4">
          {onCancelTagSelection && (
            <button
              onClick={onCancelTagSelection}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
          )}
          {onApplyTagChanges && (
            <button
              onClick={onApplyTagChanges}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Apply Changes ({currentTags.length}/5)
            </button>
          )}
        </div>
      )}

      <TagManagerSystem 
        key={`tag-manager-${note.id}-${tagSelectionMode}`}
        allNotes={notes}
        onUpdateTagAcrossNotes={updateTagAcrossNotes}
        onDeleteTagFromAllNotes={deleteTagFromAllNotes}
        selectedTags={currentTags}
        maxTagsAllowed={5}
        onSelectTag={onSelectTag}
        selectionMode={tagSelectionMode}
      />
    </>
  );
}
