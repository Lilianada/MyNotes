"use client";

import React from 'react';
import { Note } from '@/types';
import { UnifiedNoteDetailsTabs, UnifiedTabContent } from './unified-note-details-tabs';
import { useUnifiedNoteDetails } from './unified-note-details-hooks';

interface UnifiedNoteDetailsProps {
  note: Note;
  isOpen: boolean;
  onClose: () => void;
}

export function UnifiedNoteDetails({ note, isOpen, onClose }: UnifiedNoteDetailsProps) {
  // Use our unified hooks
  const noteDetailsHooks = useUnifiedNoteDetails(note, isOpen);
  const { activeTab, setActiveTab } = noteDetailsHooks;
  
  if (!note || !isOpen) return null;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold">{note.noteTitle || 'Note Details'}</h2>
      </div>
      
      <div className="overflow-y-auto flex-1">
        <UnifiedNoteDetailsTabs activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <div className="p-4">
          <UnifiedTabContent tab={activeTab} note={note} hooks={noteDetailsHooks} />
        </div>
      </div>
    </div>
  );
}
