import React from "react";
import { Note } from "@/types";
import NoteListItem from "./note-list-item";
import { getNoteRelationshipInfo } from "./note-relationships";

interface NotesListProps {
  filteredNotes: Note[];
  selectedNoteId: number | null;
  isDeleting: number | null;
  isSelectionMode: boolean;
  selectedNoteIds: Set<number>;
  getChildNotes: (parentId: number) => Note[];
  getLinkedNotes: (noteId: number) => Note[];
  onSelectNote: (note: Note) => void;
  onOpenDetails: (note: Note, e: React.MouseEvent) => void;
  onDeleteNote: (note: Note, e: React.MouseEvent) => void;
  onToggleSelection: (noteId: number, isSelected: boolean) => void;
  selectNote?: (id: number) => void;
}

/**
 * Notes list component
 */
export function NotesList({
  filteredNotes,
  selectedNoteId,
  isDeleting,
  isSelectionMode,
  selectedNoteIds,
  getChildNotes,
  getLinkedNotes,
  onSelectNote,
  onOpenDetails,
  onDeleteNote,
  onToggleSelection,
  selectNote
}: NotesListProps) {
  if (filteredNotes.length === 0) {
    return (
      <p className="text-center text-gray-400 text-base p-4">No notes yet</p>
    );
  }

  return (
    <ul className="md:max-h-[calc(100vh_-_155px)] overflow-y-auto p-2 scrollbar-hide">
      {filteredNotes.map((note) => {
        const relationInfo = getNoteRelationshipInfo(note, getChildNotes, getLinkedNotes);
        
        return (
          <NoteListItem
            key={note.id}
            note={note}
            selectedNoteId={selectedNoteId}
            isDeleting={isDeleting}
            relationshipInfo={relationInfo}
            isSelectionMode={isSelectionMode}
            isSelected={selectedNoteIds.has(note.id)}
            onSelectNote={(note) => {
              if (selectNote) {
                selectNote(note.id);
              } else {
                onSelectNote(note);
              }
            }}
            onOpenDetails={onOpenDetails}
            onDeleteNote={onDeleteNote}
            onToggleSelection={onToggleSelection}
          />
        );
      })}
    </ul>
  );
}
