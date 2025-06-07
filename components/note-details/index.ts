"use client";

/**
 * Note Details Components
 * 
 * This module exports the components used for displaying note details.
 * We use the unified components which provide a consistent UI for note details.
 */

// Export the unified note details components
export { UnifiedNoteDetails } from './unified-note-details';
export { useUnifiedNoteDetails } from './unified-note-details-hooks';
export type { TabType } from './unified-note-details-hooks';
export { UnifiedNoteDetailsTabs, UnifiedTabContent } from './unified-note-details-tabs';

// For backward compatibility, export UnifiedNoteDetails as NoteDetails
export { UnifiedNoteDetails as NoteDetails } from './unified-note-details';
export { NoteDetails as NoteDetailsComponent } from './note-details';
