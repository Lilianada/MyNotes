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
        <button 
          onClick={onClose}
          className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
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
