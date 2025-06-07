"use client";

import React from "react";
import { Note } from "@/types";
import DeleteConfirmation from "../modals/delete-confirmation";
import { UnifiedNoteDetails } from "@/components/note-details";
import {
  Sheet,
  SheetContent,
  SheetOverlay
} from "@/components/ui/sheet";

interface SidebarDialogsProps {
  // Delete dialog
  noteToDelete: Note | null;
  isDeleteDialogOpen: boolean;
  onCloseDeleteDialog: () => void;
  onConfirmDelete: () => void;
  
  // Bulk delete dialog
  isBulkDeleteDialogOpen: boolean;
  selectedCount: number;
  onCloseBulkDeleteDialog: () => void;
  onConfirmBulkDelete: () => void;
  
  // Details dialog
  activeNote: Note | null;
  isDetailsOpen: boolean;
  onCloseDetails: () => void;
}

/**
 * Sidebar dialogs component
 */
export function SidebarDialogs({
  noteToDelete,
  isDeleteDialogOpen,
  onCloseDeleteDialog,
  onConfirmDelete,
  isBulkDeleteDialogOpen,
  selectedCount,
  onCloseBulkDeleteDialog,
  onConfirmBulkDelete,
  activeNote,
  isDetailsOpen,
  onCloseDetails
}: SidebarDialogsProps) {
  return (
    <>
      {/* Delete Confirmation Dialog */}
      {noteToDelete && (
        <DeleteConfirmation
          isOpen={isDeleteDialogOpen}
          onClose={onCloseDeleteDialog}
          onConfirm={onConfirmDelete}
          title="Delete Note"
          description={`Are you sure you want to delete "${noteToDelete.noteTitle}"? This action cannot be undone.`}
        />
      )}

      {/* Bulk Delete Confirmation Dialog */}
      <DeleteConfirmation
        isOpen={isBulkDeleteDialogOpen}
        onClose={onCloseBulkDeleteDialog}
        onConfirm={onConfirmBulkDelete}
        title="Delete Multiple Notes"
        description={`Are you sure you want to delete ${selectedCount} note(s)? This action cannot be undone.`}
      />

      {/* Note Details Sheet */}
      <Sheet open={isDetailsOpen && !!activeNote} onOpenChange={(open) => {
        if (!open) onCloseDetails();
      }}>
        <SheetOverlay className="bg-black/60" />
        <SheetContent side="right" className="w-full sm:max-w-md md:max-w-lg p-0 border-l border-gray-200 dark:border-gray-700">
          {activeNote && (
            <UnifiedNoteDetails
              isOpen={isDetailsOpen}
              onClose={onCloseDetails}
              note={activeNote}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
