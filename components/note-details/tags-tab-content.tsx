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
}

export function TagsTabContent({ 
  note, 
  notes, 
  updateTagAcrossNotes, 
  deleteTagFromAllNotes, 
  onSelectTag 
}: TagsTabContentProps) {
  return (
    <>
      <div className="bg-gray-50 dark:bg-gray-700 p-2 mb-4 rounded-md">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          <strong>Note:</strong> You can add up to 5 tags per note to help with organization.
        </p>
      </div>
      <TagManagerSystem 
        key={`tag-manager-${note.id}`}
        allNotes={notes}
        onUpdateTagAcrossNotes={updateTagAcrossNotes}
        onDeleteTagFromAllNotes={deleteTagFromAllNotes}
        selectedTags={note.tags || []}
        maxTagsAllowed={5}
        onSelectTag={onSelectTag}
      />
    </>
  );
}
