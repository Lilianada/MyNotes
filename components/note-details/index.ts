"use client";

// Export the unified note details components
export { UnifiedNoteDetails } from './unified-note-details';
export { useUnifiedNoteDetails } from './unified-note-details-hooks';
export type { TabType } from './unified-note-details-hooks';

// For backward compatibility, export UnifiedNoteDetails as NoteDetails
export { UnifiedNoteDetails as NoteDetails } from './unified-note-details';
