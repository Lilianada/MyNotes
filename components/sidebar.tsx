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
    bulkDeleteNotes,
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
  
  // Bulk selection state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedNoteIds, setSelectedNoteIds] = useState<Set<number>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  
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

  // Bulk delete handlers
  const handleToggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedNoteIds(new Set());
  };

  const handleSelectNote = (noteId: number, isSelected: boolean) => {
    const newSelection = new Set(selectedNoteIds);
    if (isSelected) {
      newSelection.add(noteId);
    } else {
      newSelection.delete(noteId);
    }
    setSelectedNoteIds(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedNoteIds.size === filteredNotes.length) {
      setSelectedNoteIds(new Set());
    } else {
      setSelectedNoteIds(new Set(filteredNotes.map(note => note.id)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedNoteIds.size === 0) return;
    setIsBulkDeleteDialogOpen(true);
  };

  const confirmBulkDelete = async () => {
    if (selectedNoteIds.size === 0) return;
    
    setIsBulkDeleting(true);
    
    try {
      const idsToDelete = Array.from(selectedNoteIds);
      
      const result = await bulkDeleteNotes(idsToDelete);
      
      // Show success/failure toast
      if (result.failed.length === 0) {
        toast({
          title: "Notes deleted",
          description: `Successfully deleted ${result.successful.length} note(s).`,
          variant: "default",
        });
      } else {
        toast({
          title: "Partial deletion",
          description: `Deleted ${result.successful.length} note(s). Failed to delete ${result.failed.length} note(s).`,
          variant: "destructive",
        });
      }
      
      // Reset bulk selection state
      setIsSelectionMode(false);
      setSelectedNoteIds(new Set());
    } catch (error) {
      console.error("Error during bulk delete:", error);
      toast({
        title: "Error",
        description: "Failed to delete notes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsBulkDeleting(false);
      setIsBulkDeleteDialogOpen(false);
    }
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
          
          {/* Bulk Delete Controls */}
          {!isSelectionMode ? (
            <div className="px-3 mt-2">
              <button
                onClick={handleToggleSelectionMode}
                className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Select Multiple
              </button>
            </div>
          ) : (
            <div className="px-3 mt-2 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSelectAll}
                  className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                >
                  {selectedNoteIds.size === filteredNotes.length ? 'Deselect All' : 'Select All'}
                </button>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedNoteIds.size} selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBulkDelete}
                  disabled={selectedNoteIds.size === 0 || isBulkDeleting}
                  className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  {isBulkDeleting ? 'Deleting...' : `Delete (${selectedNoteIds.size})`}
                </button>
                <button
                  onClick={handleToggleSelectionMode}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
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
                  isSelectionMode={isSelectionMode}
                  isSelected={selectedNoteIds.has(note.id)}
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
                  onToggleSelection={handleSelectNote}
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

      {/* Bulk Delete Confirmation Dialog */}
      <DeleteConfirmation
        isOpen={isBulkDeleteDialogOpen}
        onClose={() => {
          setIsBulkDeleteDialogOpen(false);
        }}
        onConfirm={confirmBulkDelete}
        title="Delete Multiple Notes"
        description={`Are you sure you want to delete ${selectedNoteIds.size} note(s)? This action cannot be undone.`}
      />

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
