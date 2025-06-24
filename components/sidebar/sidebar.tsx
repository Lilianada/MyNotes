import React from "react";
import type { Note } from "@/types";
import { FilterSortToolbar } from "./filter-sort-toolbar";
import { useSidebarState } from "./sidebar-hooks";
import { useSidebarHandlers } from "./sidebar-handlers";
import { SidebarHeader } from "./sidebar-header";
import { VirtualizedNotesList } from "./virtualized-notes-list";
import { SidebarDialogs } from "./sidebar-dialogs";
import { useAppState, FilterOptions, SortField } from "@/lib/state/use-app-state";
import { useToast } from "@/hooks/use-toast";
import type { SortOption } from "./filter-sort-toolbar";

interface SidebarProps {
  isSidebarOpen: boolean;
  onSelectNote: (note: Note) => void;
}

export default function Sidebar({
  isSidebarOpen,
  onSelectNote,
}: SidebarProps) {
  // Use our consolidated app state
  const { 
    notes, 
    selectedNoteId, 
    deleteNote, 
    selectNote,
    getChildNotes,
    getLinkedNotes,
    filterNotes,
    sortNotes,
    bulkDeleteNotes,
    user,
    isAdmin
  } = useAppState();
  
  const { toast } = useToast();
  
  // Use custom hooks for state and handlers
  // We'll keep using these hooks for now but integrate with our new state management
  const state = useSidebarState();
  const handlers = useSidebarHandlers({
    ...state,
    notes,
    selectedNoteId,
    selectNote: (id: number) => {
      selectNote(id);
      state.selectNote(id);
    },
    deleteNote: (id: number) => {
      deleteNote(id);
      state.setNoteToDelete(null);
      state.setIsDeleteDialogOpen(false);
    }
  });

  // Apply filters and sorting
  const filterOptions: FilterOptions = {
    tag: state.selectedTag || undefined,
    category: state.selectedCategory || undefined,
    archived: state.selectedArchive !== null ? state.selectedArchive : undefined,
    published: state.selectedPublished !== null ? state.selectedPublished : undefined,
  };
  
  // Map sidebar sort options to the app state sort fields
  const getSortField = (sortOption: SortOption): SortField => {
    switch (sortOption) {
      case 'title': return 'noteTitle';
      case 'created': return 'createdAt';
      case 'updated': return 'updatedAt';
      default: return 'updatedAt';
    }
  };
  
  const filteredNotes = filterNotes(notes, filterOptions);
  const sortedNotes = sortNotes(filteredNotes, getSortField(state.sortBy), state.sortOrder);

  const bulkDeleteHandler = async (noteIds: number[]) => {
    try {
      // Call the bulkDeleteNotes function (user and isAdmin are handled internally)
      await bulkDeleteNotes(noteIds);
      
      toast({
        title: "Notes deleted",
        description: `Successfully deleted ${noteIds.length} note(s).`,
        variant: "default",
      });
    } catch (error) {
      console.error("Error during bulk delete:", error);
      toast({
        title: "Error",
        description: "Failed to delete notes. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <aside 
        id="sidebar"
        className={`fixed top-[var(--header-height)] sm:top-0 left-0 z-30 w-[85%] sm:w-72 md:w-full bg-white dark:bg-gray-800 border-r border-gray-200 transform transition-all duration-300 ease-in-out shadow-lg h-[calc(100vh-var(--header-height))] max-h-[calc(100vh_-_5rem)] md:h-full overflow-x-hidden scrollbar-hide flex flex-col${
          isSidebarOpen ? ' translate-x-0' : ' -translate-x-full'
        } md:translate-x-0 md:relative md:w-full md:m-2 md:border md:rounded-md md:shadow-sm md:transition-shadow`}
        aria-label="Sidebar navigation"
        tabIndex={!isSidebarOpen && typeof window !== 'undefined' && window.innerWidth < 768 ? -1 : undefined}
        aria-hidden={!isSidebarOpen && typeof window !== 'undefined' && window.innerWidth < 768}
      >
        {/* Header */}
        <SidebarHeader 
          filteredNotesLength={sortedNotes.length}
          totalNotesLength={notes.length}
          filterOptions={state.filterOptions}
        />

        {/* Filter, Sort, and Bulk Delete Toolbar */}
        <FilterSortToolbar
          selectedTag={state.selectedTag}
          selectedCategory={state.selectedCategory}
          selectedArchive={state.selectedArchive}
          selectedPublished={state.selectedPublished}
          onSelectTag={state.setSelectedTag}
          onSelectCategory={state.setSelectedCategory}
          onSelectArchive={state.setSelectedArchive}
          onSelectPublished={state.setSelectedPublished}
          sortBy={state.sortBy}
          sortOrder={state.sortOrder}
          onSortChange={state.handleSortChange}
          isSelectionMode={state.isSelectionMode}
          selectedNoteIds={state.selectedNoteIds}
          filteredNotesLength={sortedNotes.length}
          isBulkDeleting={state.isBulkDeleting}
          onToggleSelectionMode={handlers.handleToggleSelectionMode}
          onSelectAll={handlers.handleSelectAll}
          onBulkDelete={handlers.handleBulkDelete}
        />

        {/* Notes List */}
        <VirtualizedNotesList
          filteredNotes={sortedNotes}
          selectedNoteId={selectedNoteId}
          isDeleting={state.isDeleting}
          isSelectionMode={state.isSelectionMode}
          selectedNoteIds={state.selectedNoteIds}

          onSelectNote={onSelectNote}
          onOpenDetails={handlers.handleOpenDetails}
          onDeleteNote={handlers.handleDeleteNote}
          onToggleSelection={handlers.handleSelectNote}
          selectNote={(noteId: number) => selectNote(noteId)}
        />
      </aside>

      {/* All Dialogs */}
      <SidebarDialogs
        noteToDelete={state.noteToDelete}
        isDeleteDialogOpen={state.isDeleteDialogOpen}
        onCloseDeleteDialog={() => {
          state.setIsDeleteDialogOpen(false);
          state.setNoteToDelete(null);
        }}
        onConfirmDelete={() => {
          if (state.noteToDelete) {
            // Ensure we're using the numeric ID
            const noteId = typeof state.noteToDelete === 'object' ? 
              state.noteToDelete.id : state.noteToDelete;
            deleteNote(noteId);
            state.setIsDeleteDialogOpen(false);
            state.setNoteToDelete(null);
          }
        }}
        isBulkDeleteDialogOpen={state.isBulkDeleteDialogOpen}
        selectedCount={state.selectedNoteIds.size}
        onCloseBulkDeleteDialog={() => {
          state.setIsBulkDeleteDialogOpen(false);
        }}
        onConfirmBulkDelete={() => {
          // Delete all selected notes
          bulkDeleteHandler(Array.from(state.selectedNoteIds));
          state.setIsBulkDeleteDialogOpen(false);
          state.setSelectedNoteIds(new Set());
          state.setIsSelectionMode(false);
        }}
        activeNote={state.activeNote}
        isDetailsOpen={state.isDetailsOpen}
        onCloseDetails={() => state.setIsDetailsOpen(false)}
      />
    </>
  );
}
