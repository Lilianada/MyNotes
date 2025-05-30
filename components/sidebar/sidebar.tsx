import React from "react";
import type { Note } from "@/types";
import FilterBar from "../filters/filter-bar";
import { useSidebarState } from "./sidebar-hooks";
import { useSidebarHandlers } from "./sidebar-handlers";
import { SidebarHeader } from "./sidebar-header";
import { BulkDeleteControls } from "./bulk-delete-controls";
import { NotesList } from "./notes-list";
import { SidebarDialogs } from "./sidebar-dialogs";

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
  
  // Use custom hooks for state and handlers
  const state = useSidebarState();
  const handlers = useSidebarHandlers(state);

  
  return (
    <>
      <aside 
        id="sidebar"
        className={`fixed top-16 sm:top-0 left-0 z-30 w-64 sm:w-72 md:w-full bg-white dark:bg-gray-800 border-r border-gray-200 transform transition-all duration-300 ease-in-out shadow-lg h-full max-h-[calc(100vh_-_50px)]  sm:max-h-[calc(100vh_-_70px)] overflow-hidden ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 md:relative md:w-full md:m-2 md:border md:rounded-md md:shadow-sm md:transition-shadow`}
      >
        {/* Header */}
        <SidebarHeader 
          filteredNotesLength={state.filteredNotes.length}
          totalNotesLength={state.notes.length}
          filterOptions={state.filterOptions}
        />

        {/* Filter Bar */}
        <div className="py-4 border-b border-gray-200">
          <FilterBar
            selectedTag={state.selectedTag}
            selectedCategory={state.selectedCategory}
            selectedArchive={state.selectedArchive}
            onSelectTag={state.setSelectedTag}
            onSelectCategory={state.setSelectedCategory}
            onSelectArchive={state.setSelectedArchive}
          />
          
          {/* Bulk Delete Controls */}
          <BulkDeleteControls
            isSelectionMode={state.isSelectionMode}
            selectedNoteIds={state.selectedNoteIds}
            filteredNotesLength={state.filteredNotes.length}
            isBulkDeleting={state.isBulkDeleting}
            onToggleSelectionMode={handlers.handleToggleSelectionMode}
            onSelectAll={handlers.handleSelectAll}
            onBulkDelete={handlers.handleBulkDelete}
          />
        </div>

        {/* Notes List */}
        <NotesList
          filteredNotes={state.filteredNotes}
          selectedNoteId={state.selectedNoteId}
          isDeleting={state.isDeleting}
          isSelectionMode={state.isSelectionMode}
          selectedNoteIds={state.selectedNoteIds}
          getChildNotes={state.getChildNotes}
          getLinkedNotes={state.getLinkedNotes}
          onSelectNote={onSelectNote}
          onOpenDetails={handlers.handleOpenDetails}
          onDeleteNote={handlers.handleDeleteNote}
          onToggleSelection={handlers.handleSelectNote}
          selectNote={state.selectNote}
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
        onConfirmDelete={handlers.confirmDelete}
        isBulkDeleteDialogOpen={state.isBulkDeleteDialogOpen}
        selectedCount={state.selectedNoteIds.size}
        onCloseBulkDeleteDialog={() => {
          state.setIsBulkDeleteDialogOpen(false);
        }}
        onConfirmBulkDelete={handlers.confirmBulkDelete}
        activeNote={state.activeNote}
        isDetailsOpen={state.isDetailsOpen}
        onCloseDetails={() => state.setIsDetailsOpen(false)}
      />
    </>
  );
}
