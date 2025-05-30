import { useState } from "react";
import { Note } from "@/types";
import { useNotes } from "@/contexts/notes/note-context";
import { useToast } from "@/hooks/use-toast";
import { useSortedAndFilteredNotes, type FilterOptions } from "./note-filtering";

/**
 * Custom hook for managing sidebar state
 */
export function useSidebarState() {
  // Note state from context
  const { 
    notes, 
    selectNote, 
    selectedNoteId, 
    deleteNote,
    bulkDeleteNotes,
    getChildNotes,
    getLinkedNotes
  } = useNotes();

  // Local state
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  
  // Filter state
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

  return {
    // Note context
    notes,
    selectNote,
    selectedNoteId,
    deleteNote,
    bulkDeleteNotes,
    getChildNotes,
    getLinkedNotes,
    
    // Local state
    isDeleting,
    setIsDeleting,
    noteToDelete,
    setNoteToDelete,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    isDetailsOpen,
    setIsDetailsOpen,
    activeNote,
    setActiveNote,
    
    // Filter state
    selectedTag,
    setSelectedTag,
    selectedCategory,
    setSelectedCategory,
    selectedArchive,
    setSelectedArchive,
    filterOptions,
    filteredNotes,
    
    // Bulk selection state
    isSelectionMode,
    setIsSelectionMode,
    selectedNoteIds,
    setSelectedNoteIds,
    isBulkDeleting,
    setIsBulkDeleting,
    isBulkDeleteDialogOpen,
    setIsBulkDeleteDialogOpen,
    
    // Toast
    toast
  };
}
