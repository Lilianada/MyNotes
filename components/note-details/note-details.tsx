"use client";

import React from 'react';
import { Note } from '@/types';
import { UnifiedNoteDetailsTabs, UnifiedTabContent } from './unified-note-details-tabs';
import { useUnifiedNoteDetails } from './unified-note-details-hooks';
import {
  UltraTransparentDialog,
  UltraTransparentDialogContent,
  UltraTransparentDialogHeader,
  UltraTransparentDialogTitle,
} from '../ui/ultra-transparent-dialog';

interface NoteDetailsProps {
  note: Note;
  isOpen: boolean;
  onClose: () => void;
}

export function NoteDetails({ note, isOpen, onClose }: NoteDetailsProps) {
  // The useUnifiedNoteDetails hook only needs note and isOpen
  const hooks = useUnifiedNoteDetails(note, isOpen);
  
  return (
    <UltraTransparentDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <UltraTransparentDialogContent className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md overflow-hidden">
        <UltraTransparentDialogHeader>
          <UltraTransparentDialogTitle className="text-lg font-semibold">
            {note?.noteTitle || 'Note Details'}
          </UltraTransparentDialogTitle>
        </UltraTransparentDialogHeader>
        
        <UnifiedNoteDetailsTabs activeTab={hooks.activeTab} setActiveTab={hooks.setActiveTab} />
        
        <div className="p-4">
          {/* The UnifiedTabContent component handles all tab content rendering */}
          {note && <UnifiedTabContent tab={hooks.activeTab} note={note} hooks={hooks} />}
        </div>
      </UltraTransparentDialogContent>
    </UltraTransparentDialog>
  );
}

export default NoteDetails;
