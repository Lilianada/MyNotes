import React, { useState } from "react";
import type { Note } from "@/types";
import { useNotes } from "@/contexts/note-context";
import { GripVertical, Trash2, Link, FolderTree } from "lucide-react";
import DeleteConfirmation from "./delete-confirmation";
import NoteDetails from "./note-details";
import { useToast } from "@/hooks/use-toast";
import TagFilter from "./tag-filter";

// New interface for note relationships info
interface NoteRelationshipInfo {
  isParent: boolean;
  isChild: boolean;
  isLinked: boolean;
}

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
  const { 
    notes, 
    selectNote, 
    selectedNoteId, 
    deleteNote,
    getChildNotes,
    getLinkedNotes
  } = useNotes();
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Sort notes by last updated date, then by creation date if updatedAt is the same
  const sortedNotes = [...notes].sort((a, b) => {
    // If both notes have updatedAt timestamps, sort by that first
    if (a.updatedAt && b.updatedAt) {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
    // If only one has updatedAt, prioritize that one
    if (a.updatedAt) return -1;
    if (b.updatedAt) return 1;
    // Fall back to createdAt if neither has updatedAt
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  
  // Filter notes by selected tag if a tag is selected
  const filteredNotes = selectedTag 
    ? sortedNotes.filter(note => note.tags?.includes(selectedTag))
    : sortedNotes;

  // Function to determine relationship status of a note
  const getNoteRelationshipInfo = (note: Note): NoteRelationshipInfo => {
    // Check if this note is a parent (has child notes)
    const childNotes = getChildNotes(note.id);
    const isParent = childNotes.length > 0;
    
    // Check if this note is a child (has a parent)
    const isChild = note.parentId !== null && note.parentId !== undefined;
    
    // Check if this note is linked to other notes
    const linkedNotes = getLinkedNotes(note.id);
    const isLinked = linkedNotes.length > 0;
    
    return { isParent, isChild, isLinked };
  };
  
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
        className={`fixed top-16 sm:top-0 left-0 z-30 w-64 sm:w-72 md:w-full bg-white dark:bg-gray-800 border-r border-gray-200 transform transition-all duration-300 ease-in-out shadow-lg h-full max-h-[calc(100vh_-_50px)]  sm:max-h-[calc(100vh_-_70px)] overflow-hidden ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 md:relative md:w-full md:m-2 md:border md:rounded-md md:shadow-sm md:transition-shadow`}
      >
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <header className="text-xs sm:text-sm">
            <p className="text-gray-500 dark:text-gray-400">
              {selectedTag 
                ? `${filteredNotes.length} notes tagged with #${selectedTag}` 
                : `You have ${notes.length} saved notes`}
            </p>
          </header>
        </div>

        {/* Tag Filter */}
        <div className="py-4 border-b border-gray-200">
        <TagFilter
          selectedTag={selectedTag}
          onSelectTag={(tag) => setSelectedTag(tag)}
        />
        </div>

        {/* Notes List */}

        {notes.length > 0 ? (
          <ul className=" md:max-h-[calc(100vh_-_230px)] overflow-y-auto p-2 scrollbar-hide">
            {filteredNotes.map((note) => {
              // Get relationship info for this note
              const relationInfo = getNoteRelationshipInfo(note);
              
              return (
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
                      {relationInfo.isParent && (
                        <span 
                          className="text-blue-600 mr-1"
                          title="Has child notes"
                        >
                          <FolderTree size={12} />
                        </span>
                      )}
                      {relationInfo.isChild && (
                        <span 
                          className="text-green-600 mr-1"
                          title="Is a child note"
                        >
                          <FolderTree size={12} className="rotate-180" />
                        </span>
                      )}
                      {relationInfo.isLinked && (
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
            )})}
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
