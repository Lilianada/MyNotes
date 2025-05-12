import React, { useState } from "react";
import type { Note } from "@/types";
import { useNotes } from "@/contexts/note-context";
import { Trash2 } from "lucide-react";
import { deleteNoteFile } from "@/app/delete-actions";

interface ListProps {
  isSidebarOpen: boolean;
  onSelectNote: (note: Note) => void;
  onUpdateNoteTitle?: (id: number, newTitle: string) => string;
}

export default function List({
  isSidebarOpen,
  onSelectNote,
  onUpdateNoteTitle,
}: ListProps) {
  // Use notes from context
  const { notes, selectNote, selectedNoteId, deleteNote } = useNotes();
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  
  // Sort notes from newest to oldest
  const sortedNotes = [...notes].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  
  const handleDeleteNote = async (note: Note, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (confirm(`Are you sure you want to delete "${note.noteTitle}"?`)) {
      setIsDeleting(note.id);
      
      // If note has a file path, delete the file too
      if (note.filePath) {
        await deleteNoteFile(note.filePath);
      }
      
      // Remove from context/state
      deleteNote(note.id);
      setIsDeleting(null);
    }
  };
  
  return (
    <aside 
      className={`fixed inset-y-0 left-0 z-20 w-80 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out shadow-lg ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 md:relative md:w-full md:mt-8 md:border md:rounded-md md:shadow-sm`}
    >
      <div className="p-4 border-b border-gray-200">
        <header className="text-sm">
          <p className="text-gray-500">Hi Lily,</p>
          <p className="text-gray-500">You have {notes.length} saved notes</p>
        </header>
      </div>

      {notes.length > 0 ? (
        <ul className="max-h-[calc(100vh-200px)] overflow-y-auto p-2">
          {sortedNotes.map((note) => (
            <li
              key={note.id}
              className={`p-2 hover:bg-gray-50 rounded cursor-pointer flex items-center justify-between ${
                selectedNoteId === note.id ? "bg-blue-50" : ""
              }`}
            >
              <button
                onClick={() => {
                  // Use context method if available, otherwise use prop method
                  if (selectNote) {
                    selectNote(note.id);
                  } else {
                    onSelectNote(note);
                  }
                }}
                className="flex-1 text-left truncate"
              >
                <span className="truncate capitalize">
                  {note.noteTitle || `Note #${note.id}`}
                </span>
              </button>
              <button
                onClick={(e) => handleDeleteNote(note, e)}
                disabled={isDeleting === note.id}
                className={`ml-2 p-1 ${
                  isDeleting === note.id 
                    ? "text-gray-300" 
                    : "text-gray-400 hover:text-red-500"
                }`}
                aria-label={`Delete note ${note.noteTitle}`}
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-center text-gray-400 p-4">No notes yet</p>
      )}
      
      {/* Mobile overlay to close sidebar when clicking outside */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-30 z-10 md:hidden"
          onClick={() => document.dispatchEvent(new CustomEvent('close-sidebar'))}
        />
      )}
    </aside>
  );
}
