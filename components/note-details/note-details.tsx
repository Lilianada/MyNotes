"use client";

import React, { useState, useEffect } from 'react';
import { Note } from '@/types';
import NoteRelationships from '@/components/relationships/note-relationships';
import { UnifiedNoteDetailsTabs, UnifiedTabContent } from './unified-note-details-tabs';
import { useUnifiedNoteDetails } from './unified-note-details-hooks';
import { useAppState } from '@/lib/state/app-state';
import { logger } from '@/lib/utils/logger';

interface NoteDetailsProps {
  note: Note;
  isOpen: boolean;
  onClose: () => void;
}

export function NoteDetails({ note, isOpen, onClose }: NoteDetailsProps) {
  // The useUnifiedNoteDetails hook only needs note and isOpen
  const hooks = useUnifiedNoteDetails(note, isOpen);
  
  if (!isOpen) return null;
  
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]"
      onClick={onClose}
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold">Note Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            &times;
          </button>
        </div>
        
        <UnifiedNoteDetailsTabs activeTab={hooks.activeTab} setActiveTab={hooks.setActiveTab} />
        
        <div className="p-4">
          {/* The UnifiedTabContent component handles all tab content rendering */}
          {note && <UnifiedTabContent tab={hooks.activeTab} note={note} hooks={hooks} />}
        </div>
      </div>
    </div>
  );
}

export default NoteDetails;
