import React, { useState } from "react";
import type { Note } from "@/types";
import { useNotes } from "@/contexts/note-context";
import { GripVertical, Trash2,  } from "lucide-react";
import DeleteConfirmation from "./delete-confirmation";
import NoteDetails from "./note-details";
import { useToast } from "@/hooks/use-toast";

interface SidebarProps {
  isSidebarOpen: boolean;
  onSelectNote: (note: Note) => void;
  onUpdateNoteTitle?: (id: number, newTitle: string) => string;
}

export default function Sidebar({
  isSidebarOpen,
  onSelectNote,
  onUpdateNoteTitle,
}: SidebarProps) {
  // Use notes from context
  const { notes, selectNote, selectedNoteId, deleteNote } = useNotes();
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const { toast } = useToast();
  
  // Sort notes from newest to oldest
  const sortedNotes = [...notes].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  
  const handleDeleteNote = async (note: Note, e: React.MouseEvent) => {
    e.stopPropagation();
    // Open the delete confirmation dialog
    setNoteToDelete(note);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDelete = async () => {
    if (noteToDelete) {
      setIsDeleting(noteToDelete.id);
      
      try {
        // The deleteNote function in the context now handles both state and file deletion
        await deleteNote(noteToDelete.id);
        
        // Show success toast
        toast({
          title: "Note deleted",
          description: `"${noteToDelete.noteTitle || `Note #${noteToDelete.id}`}" has been deleted.`,
          variant: "default",
        });
      } catch (error) {
        console.error("Error deleting note:", error);
        
        // Show error toast
        toast({
          title: "Error",
          description: "Failed to delete note. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsDeleting(null);
        setNoteToDelete(null);
        setIsDeleteDialogOpen(false);
      }
    }
  };

  const handleOpenDetails = (note: Note, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveNote(note);
    setIsDetailsOpen(true);
  };
  
  return (
    <>
    <aside 
      id="sidebar"
      className={`fixed inset-y-0 left-0 z-30 w-80 bg-white border-r border-gray-200 transform transition-all duration-300 ease-in-out shadow-lg ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 md:relative md:w-full md:m-4 md:border md:rounded-md md:shadow-sm md:transition-shadow`}
    >
      <div className="p-4 border-b border-gray-200">
        <header className="text-sm">
          <p className="text-gray-500">You have {notes.length} saved notes</p>
        </header>
      </div>

      {notes.length > 0 ? (
        <ul className="max-h-[calc(100vh-125px)] overflow-y-auto p-2 scrollbar-hide">
          {sortedNotes.map((note) => (
            <li
              key={note.id}
              className={`p-2 text-sm hover:bg-gray-50 rounded cursor-pointer flex items-center justify-between ${
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
                {note.category && (
                  <span 
                    className="w-2 h-2 rounded-full mr-2 inline-block"
                    style={{ backgroundColor: note.category.color }}
                    title={note.category.name}
                  />
                )}
                <span className="truncate capitalize">
                  {note.noteTitle || `Note #${note.id}`}
                </span>
              </button>
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => handleOpenDetails(note, e)}
                  className="p-1 text-gray-400 hover:text-blue-500"
                  aria-label={`View details of note ${note.noteTitle}`}
                >
                  <GripVertical size={16} />
                </button>
                <button
                  onClick={(e) => handleDeleteNote(note, e)}
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
          ))}
        </ul>
      ) : (
        <p className="text-center text-gray-400 p-4">No notes yet</p>
      )}
      
    </aside>

      {/* Delete Confirmation Dialog */}
      {noteToDelete && (
        <DeleteConfirmation
          isOpen={isDeleteDialogOpen}
          onClose={() => {
            setIsDeleteDialogOpen(false);
            setNoteToDelete(null);
          }}
          onConfirm={confirmDelete}
          title="Delete Note"
          description={`Are you sure you want to delete "${noteToDelete.noteTitle}"? This action cannot be undone.`}
        />
      )}

      {/* Note Details Dialog */}
      {activeNote && isDetailsOpen && (
        <NoteDetails
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          note={activeNote}
        />
      )}
    </>
  );
}
