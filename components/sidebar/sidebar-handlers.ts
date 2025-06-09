import { Note } from "@/types";

/**
 * Event handlers for sidebar operations
 */
export function useSidebarHandlers(state: any) {
  const {
    deleteNote,
    bulkDeleteNotes,
    setIsDeleting,
    setNoteToDelete,
    setIsDeleteDialogOpen,
    setActiveNote,
    setIsDetailsOpen,
    isSelectionMode,
    setIsSelectionMode,
    selectedNoteIds,
    setSelectedNoteIds,
    setIsBulkDeleting,
    setIsBulkDeleteDialogOpen,
    filteredNotes,
    toast
  } = state;

  const handleDeleteNote = async (note: Note, e: React.MouseEvent) => {
    e.stopPropagation();
    setNoteToDelete(note);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDelete = async () => {
    const { noteToDelete } = state;
    if (!noteToDelete) return;
    
    setIsDeleting(noteToDelete.id);
    console.log('Deleting note:', noteToDelete.id);
    
    try {
      // Show loading toast
      const loadingToast = toast({
        title: "Deleting note",
        description: "Please wait while we delete your note...",
        variant: "default",
      });
      
      // Call deleteNote (user and isAdmin are handled internally)
      const result = await deleteNote(noteToDelete.id);
      
      // Dismiss loading toast if it's still showing
      if (loadingToast && loadingToast.dismiss) {
        loadingToast.dismiss();
      }
      
      // Show success toast
      toast({
        title: "Note deleted",
        description: `"${noteToDelete.noteTitle || `Note #${noteToDelete.id}`}" has been deleted.`,
        variant: "default",
      });
    } catch (error) {
      console.error("Error deleting note:", error);
      
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
  };

  const handleOpenDetails = (note: Note, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveNote(note);
    setIsDetailsOpen(true);
  };

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
      setSelectedNoteIds(new Set(filteredNotes.map((note: Note) => note.id)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedNoteIds.size === 0) return;
    setIsBulkDeleteDialogOpen(true);
  };

  const confirmBulkDelete = async () => {
    if (selectedNoteIds.size === 0) return;
    
    setIsBulkDeleting(true);
    console.log('Bulk deleting notes:', Array.from(selectedNoteIds));
    
    try {
      // Show loading toast
      const loadingToast = toast({
        title: "Deleting notes",
        description: `Please wait while we delete ${selectedNoteIds.size} note(s)...`,
        variant: "default",
      });
      
      const idsToDelete = Array.from(selectedNoteIds);
      
      // Call bulkDeleteNotes (user and isAdmin are handled internally)
      const result = await bulkDeleteNotes(idsToDelete);
      console.log('Bulk delete result:', result);
      
      // Dismiss loading toast if it's still showing
      if (loadingToast && loadingToast.dismiss) {
        loadingToast.dismiss();
      }
      
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

  return {
    handleDeleteNote,
    confirmDelete,
    handleOpenDetails,
    handleToggleSelectionMode,
    handleSelectNote,
    handleSelectAll,
    handleBulkDelete,
    confirmBulkDelete
  };
}
