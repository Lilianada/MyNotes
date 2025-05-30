import React, { useState } from "react";
import type { Note } from "@/types";
import { useNotes } from "@/contexts/notes/note-context";
import DeleteConfirmation from "./delete-confirmation";
import NoteDetails from "./note-details";
import { useToast } from "@/hooks/use-toast";
import FilterBar from "./filter-bar";
import NoteListItem from "./sidebar/note-list-item";
import { useSortedAndFilteredNotes, generateFilterDescription, type FilterOptions } from "./sidebar/note-filtering";
import { getNoteRelationshipInfo, type NoteRelationshipInfo } from "./sidebar/note-relationships";

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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArchive, setSelectedArchive] = useState<boolean | null>(null);
  const { toast } = useToast();
  
  // Create filter options object
  const filterOptions: FilterOptions = {
    selectedTag,
    selectedCategory,
    selectedArchive
  };
  
  // Use the custom hook for sorting and filtering
  const { filteredNotes } = useSortedAndFilteredNotes(notes, filterOptions);

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
              {generateFilterDescription(filteredNotes.length, notes.length, filterOptions)}
            </p>
          </header>
        </div>

        {/* Filter Bar */}
        <div className="py-4 border-b border-gray-200">
          <FilterBar
            selectedTag={selectedTag}
            selectedCategory={selectedCategory}
            selectedArchive={selectedArchive}
            onSelectTag={(tag: string | null) => setSelectedTag(tag)}
            onSelectCategory={(category: string | null) => setSelectedCategory(category)}
            onSelectArchive={(archive: boolean | null) => setSelectedArchive(archive)}
          />
        </div>

        {/* Notes List */}

                {notes.length > 0 ? (
          <ul className=" md:max-h-[calc(100vh_-_230px)] overflow-y-auto p-2 scrollbar-hide">
            {filteredNotes.map((note) => {
              // Get relationship info for this note
              const relationInfo = getNoteRelationshipInfo(note, getChildNotes, getLinkedNotes);
              
              return (
                <NoteListItem
                  key={note.id}
                  note={note}
                  selectedNoteId={selectedNoteId}
                  isDeleting={isDeleting}
                  relationshipInfo={relationInfo}
                  onSelectNote={(note) => {
                    // Use context method if available, otherwise use prop method
                    if (selectNote) {
                      selectNote(note.id);
                    } else {
                      onSelectNote(note);
                    }
                  }}
                  onOpenDetails={handleOpenDetails}
                  onDeleteNote={handleDeleteNote}
                />
              );
            })}
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
