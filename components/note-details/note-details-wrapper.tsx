"use client";

import React from 'react';
import { Note } from '@/types/index';
import { UnifiedNoteDetails } from './unified-note-details';

interface NoteDetailsProps {
  note: Note;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Wrapper component for backward compatibility
 * @deprecated Use UnifiedNoteDetails instead
 */
export function NoteDetails({ note, isOpen, onClose }: NoteDetailsProps) {
  return (
    <UnifiedNoteDetails 
      note={note}
      isOpen={isOpen}
      onClose={onClose}
    />
  );
}
