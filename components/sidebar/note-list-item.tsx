"use client";

import React from 'react';
import type { Note } from '@/types';
import { GripVertical, Trash2, Link, FolderTree } from 'lucide-react';

interface NoteRelationshipInfo {
  isParent: boolean;
  isChild: boolean;
  isLinked: boolean;
}

interface NoteListItemProps {
  note: Note;
  selectedNoteId: number | null;
  isDeleting: number | null;
  relationshipInfo: NoteRelationshipInfo;
  onSelectNote: (note: Note) => void;
  onOpenDetails: (note: Note, e: React.MouseEvent) => void;
  onDeleteNote: (note: Note, e: React.MouseEvent) => void;
}

export default function NoteListItem({
  note,
  selectedNoteId,
  isDeleting,
  relationshipInfo,
  onSelectNote,
  onOpenDetails,
  onDeleteNote,
}: NoteListItemProps) {
  return (
    <li
      key={note.id}
      className={`p-2 text-sm hover:bg-gray-50 rounded cursor-pointer flex items-center justify-between ${
        selectedNoteId === note.id ? "bg-blue-50" : ""
      }`}
    >
      <button
        onClick={() => onSelectNote(note)}
        className="flex-1 text-left truncate flex items-center"
      >
        <div className="flex items-center mr-2">
          {note.category && (
            <span 
              className="w-2 h-2 rounded-full mr-1 inline-block"
              style={{ backgroundColor: note.category.color }}
              title={note.category.name}
            />
          )}
          {relationshipInfo.isParent && (
            <span 
              className="text-blue-600 mr-1"
              title="Has child notes"
            >
              <FolderTree size={12} />
            </span>
          )}
          {relationshipInfo.isChild && (
            <span 
              className="text-green-600 mr-1"
              title="Is a child note"
            >
              <FolderTree size={12} className="rotate-180" />
            </span>
          )}
          {relationshipInfo.isLinked && (
            <span 
              className="text-purple-600 mr-1"
              title="Has linked notes"
            >
              <Link size={12} />
            </span>
          )}
          {note.publish && (
            <span 
              className="text-emerald-600 mr-1"
              title="Published note"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="12" 
                height="12" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z" />
                <path d="M12 7c1.5 0 2.75 1.5 4 1.5 1 0 2.25-.5 3-1" />
              </svg>
            </span>
          )}
        </div>
        <span className="truncate capitalize">
          {note.noteTitle || `Note #${note.id}`}
        </span>
      </button>
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
    </li>
  );
}
