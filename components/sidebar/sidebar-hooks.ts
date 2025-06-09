import { useState } from "react";
import { Note } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useSortedAndFilteredNotes, type FilterOptions } from "./note-filtering";
import type { SortOption } from "./filter-sort-toolbar";
import { useAppState } from "@/lib/state/use-app-state";

/**
 * Custom hook for managing sidebar state
 */
export function useSidebarState() {
  // Note state from app state
  const { 
    notes, 
    selectNote, 
    selectedNoteId, 
    deleteNote,
    bulkDeleteNotes,
    getChildNotes,
    getLinkedNotes
  } = useAppState();

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
  const [selectedPublished, setSelectedPublished] = useState<boolean | null>(null);
  
  // Sort state
  const [sortBy, setSortBy] = useState<SortOption>('updated');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
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
    selectedArchive,
    selectedPublished
  };
  
  // Use the custom hook for sorting and filtering
  const { filteredNotes } = useSortedAndFilteredNotes(notes, filterOptions, sortBy, sortOrder);

  // Sort change handler
  const handleSortChange = (newSortBy: SortOption, newSortOrder: 'asc' | 'desc') => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
  };

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
    selectedPublished,
    setSelectedPublished,
    filterOptions,
    filteredNotes,
    
    // Sort state
    sortBy,
    sortOrder,
    handleSortChange,
    
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
