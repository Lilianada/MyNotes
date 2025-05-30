import React from "react";

interface BulkDeleteControlsProps {
  isSelectionMode: boolean;
  selectedNoteIds: Set<number>;
  filteredNotesLength: number;
  isBulkDeleting: boolean;
  onToggleSelectionMode: () => void;
  onSelectAll: () => void;
  onBulkDelete: () => void;
}

/**
 * Bulk delete controls component
 */
export function BulkDeleteControls({
  isSelectionMode,
  selectedNoteIds,
  filteredNotesLength,
  isBulkDeleting,
  onToggleSelectionMode,
  onSelectAll,
  onBulkDelete
}: BulkDeleteControlsProps) {
  if (!isSelectionMode) {
    return (
      <div className="px-3 mt-2">
        <button
          onClick={onToggleSelectionMode}
          className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          Select Multiple
        </button>
      </div>
    );
  }

  return (
    <div className="px-3 mt-2 flex justify-between items-center">
      <div className="flex items-center gap-2">
        <button
          onClick={onSelectAll}
          className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
        >
          {selectedNoteIds.size === filteredNotesLength ? 'Deselect All' : 'Select All'}
        </button>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {selectedNoteIds.size} selected
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onBulkDelete}
          disabled={selectedNoteIds.size === 0 || isBulkDeleting}
          className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 disabled:text-gray-400 disabled:cursor-not-allowed"
        >
          {isBulkDeleting ? 'Deleting...' : `Delete (${selectedNoteIds.size})`}
        </button>
        <button
          onClick={onToggleSelectionMode}
          className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
