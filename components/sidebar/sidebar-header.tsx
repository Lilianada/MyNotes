import React from "react";
import { generateFilterDescription, type FilterOptions } from "./note-filtering";

interface SidebarHeaderProps {
  filteredNotesLength: number;
  totalNotesLength: number;
  filterOptions: FilterOptions;
}

/**
 * Sidebar header component
 */
export function SidebarHeader({
  filteredNotesLength,
  totalNotesLength,
  filterOptions
}: SidebarHeaderProps) {
  return (
    <div className="p-3 border-b border-gray-200 dark:border-gray-700">
      <header className="text-xs sm:text-sm">
        <p className="text-gray-500 dark:text-gray-400">
          {generateFilterDescription(filteredNotesLength, totalNotesLength, filterOptions)}
        </p>
      </header>
    </div>
  );
}
