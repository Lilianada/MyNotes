import React from "react";
import type { Note } from "@/types";
import { FilterSortToolbar } from "./filter-sort-toolbar";
import { useSidebarState } from "./sidebar-hooks";
import { useSidebarHandlers } from "./sidebar-handlers";
import { SidebarHeader } from "./sidebar-header";
import { NotesList } from "./notes-list";
import { SidebarDialogs } from "./sidebar-dialogs";
import { useAppState } from "@/lib/state/app-state";
import { FilterOptions } from "@/lib/state/app-state";

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
    filterNotes,
    sortNotes,
    getChildNotes,
    getLinkedNotes,
    user
  } = useAppState();
  
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
      deleteNote(id, user, !!user?.isAdmin);
      state.setNoteToDelete(null);
      state.setIsDeleteDialogOpen(false);
    }
  });

  // Apply filters and sorting from the sidebar state to our notes
  const filteredNotes = React.useMemo(() => {
    let result = [...notes];
    
    // Combine all filters into a single FilterOptions object
    const filterOptions: FilterOptions = {};
    
    if (state.selectedTag) {
      filterOptions.tag = state.selectedTag;
    }
    
    if (state.selectedCategory) {
      filterOptions.category = state.selectedCategory;
    }
    
    if (state.selectedArchive !== null) {
      filterOptions.archived = state.selectedArchive;
    }
    
    if (state.selectedPublished !== null) {
      filterOptions.published = state.selectedPublished;
    }
    
    // Apply filters if any are set
    if (Object.keys(filterOptions).length > 0) {
      result = filterNotes(result, filterOptions);
    }
    
    // Apply sorting - map the sidebar's sort options to our store's sort fields
    const sortField = state.sortBy === 'updated' ? 'updatedAt' :
                     state.sortBy === 'created' ? 'createdAt' :
                     state.sortBy === 'title' ? 'noteTitle' : 
                     state.sortBy || 'updatedAt';
    
    result = sortNotes(result, sortField, state.sortOrder || 'desc');
    
    return result;
  }, [notes, state.selectedTag, state.selectedCategory, state.selectedArchive, state.selectedPublished, state.sortBy, state.sortOrder, filterNotes, sortNotes]);
  
  return (
    <>
      <aside 
        id="sidebar"
        className={`fixed top-16 sm:top-0 left-0 z-30 w-[80%] sm:w-72 md:w-full bg-white dark:bg-gray-800 border-r border-gray-200 transform transition-all duration-300 ease-in-out shadow-lg h-full max-h-[calc(100vh_-_54px)] sm:max-h-[calc(100vh_-_70px)] overflow-y-auto overflow-x-hidden ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 md:relative md:w-full md:m-2 md:border md:rounded-md md:shadow-sm md:transition-shadow`}
      >
        {/* Header */}
        <SidebarHeader 
          filteredNotesLength={filteredNotes.length}
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
          filteredNotesLength={filteredNotes.length}
          isBulkDeleting={state.isBulkDeleting}
          onToggleSelectionMode={handlers.handleToggleSelectionMode}
          onSelectAll={handlers.handleSelectAll}
          onBulkDelete={handlers.handleBulkDelete}
        />

        {/* Notes List */}
        <NotesList
          filteredNotes={filteredNotes}
          selectedNoteId={selectedNoteId}
          isDeleting={state.isDeleting}
          isSelectionMode={state.isSelectionMode}
          selectedNoteIds={state.selectedNoteIds}
          getChildNotes={getChildNotes}
          getLinkedNotes={getLinkedNotes}
          onSelectNote={onSelectNote}
          onOpenDetails={handlers.handleOpenDetails}
          onDeleteNote={handlers.handleDeleteNote}
          onToggleSelection={handlers.handleSelectNote}
          selectNote={(noteId) => selectNote(noteId)}
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
            deleteNote(noteId, user, !!user?.isAdmin);
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
          Array.from(state.selectedNoteIds).forEach(id => {
            // Ensure we're using the numeric ID
            deleteNote(id, user, !!user?.isAdmin);
          });
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
