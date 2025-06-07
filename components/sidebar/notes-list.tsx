import React from "react";
import { Note } from "@/types";
import NoteListItem from "./note-list-item";
import { NoteListSkeleton } from "@/components/ui/note-skeleton";
import { useAppState } from "@/lib/state/app-state";

interface NotesListProps {
  filteredNotes: Note[];
  selectedNoteId: number | null;
  isDeleting: number | null;
  isSelectionMode: boolean;
  selectedNoteIds: Set<number>;

  onSelectNote: (note: Note) => void;
  onOpenDetails: (note: Note, e: React.MouseEvent) => void;
  onDeleteNote: (note: Note, e: React.MouseEvent) => void;
  onToggleSelection: (noteId: number, isSelected: boolean) => void;
  selectNote?: (id: number) => void;
  isLoading?: boolean;
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
  
  onSelectNote,
  onOpenDetails,
  onDeleteNote,
  onToggleSelection,
  selectNote,
  isLoading
}: NotesListProps) {
  // Get global loading state if not provided as prop
  const { isLoading: globalLoading } = useAppState();
  const showLoading = isLoading ?? globalLoading;
  
  if (showLoading) {
    return <NoteListSkeleton count={7} />;
  }
  if (filteredNotes.length === 0) {
    return (
      <p className="text-center text-gray-400 text-base p-4" role="status">No notes yet</p>
    );
  }

  return (
    <ul className="md:max-h-[calc(100vh_-_155px)] overflow-y-auto p-2 scrollbar-hide" role="list" aria-label="Notes list">
      {filteredNotes.map((note) => {
        return (
          <NoteListItem
            key={note.id}
            note={note}
            selectedNoteId={selectedNoteId}
            isDeleting={isDeleting}
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
