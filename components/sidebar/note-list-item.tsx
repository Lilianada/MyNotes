"use client";

import React from 'react';
import type { Note } from '@/types';
import { GripVertical, Trash2, Link, FolderTree, BadgeCheck } from 'lucide-react';

interface NoteListItemProps {
  note: Note;
  selectedNoteId: number | null;
  isDeleting: number | null;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onSelectNote: (note: Note) => void;
  onOpenDetails: (note: Note, e: React.MouseEvent) => void;
  onDeleteNote: (note: Note, e: React.MouseEvent) => void;
  onToggleSelection?: (noteId: number, isSelected: boolean) => void;
}

export default function NoteListItem({
  note,
  selectedNoteId,
  isDeleting,
  isSelectionMode = false,
  isSelected = false,
  onSelectNote,
  onOpenDetails,
  onDeleteNote,
  onToggleSelection,
}: NoteListItemProps) {
  return (
    <li
      key={note.id}
      className={`p-2 text-sm hover:bg-gray-50 rounded cursor-pointer flex items-center justify-between hover:bg-blue-50 transition-colors ${
        selectedNoteId === note.id ? "bg-blue-50" : ""
      } ${isSelected ? "bg-blue-50" : ""}`}
      aria-selected={selectedNoteId === note.id}
    >
      {/* Checkbox for selection mode */}
      {isSelectionMode && (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => {
            e.stopPropagation();
            onToggleSelection?.(note.id, e.target.checked);
          }}
          className="mr-2 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          aria-label={`Select ${note.noteTitle}`}
        />
      )}
      
      <button
        onClick={() => {
          if (isSelectionMode) {
            onToggleSelection?.(note.id, !isSelected);
          } else {
            onSelectNote(note);
          }
        }}
        className="flex-1 text-left truncate flex items-center"
        aria-label={`Open note: ${note.noteTitle}`}
        aria-current={selectedNoteId === note.id ? 'true' : 'false'}
      >
        <div className="flex items-center mr-2">
          {note.category && (
            <span 
              className="w-2 h-2 rounded-full mr-1 inline-block"
              style={{ backgroundColor: note.category.color }}
              title={note.category.name}
              aria-label={`Category: ${note.category.name}`}
              role="presentation"
            />
          )}
          
          {note.publish && (
           <BadgeCheck className='h-4 w-4 text-green-500' />
          )}
        </div>
        <span className="truncate capitalize">
          {note.noteTitle || `Note #${note.id}`}
        </span>
      </button>
      
      {/* Action buttons - hide in selection mode */}
      {!isSelectionMode && (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => onOpenDetails(note, e)}
            className="p-1 text-gray-400 hover:text-blue-500"
            aria-label={`View details of note ${note.noteTitle}`}
          >
            <GripVertical size={16} />
          </button>
          <button
            onClick={(e) => onDeleteNote(note, e)}
            disabled={isDeleting === note.id}
            className={`p-1 ${
              isDeleting === note.id 
                ? "text-gray-300" 
                : "text-gray-400 hover:text-red-500"
            }`}
            aria-label={`Delete note ${note.noteTitle}`}
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}
    </li>
  );
}
