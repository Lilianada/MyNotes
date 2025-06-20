"use client";

import { useState, useRef, useEffect } from "react";
import { Menu } from "./menu";
import { Menu as MenuIcon, X, Plus, Search, UserCircle } from "lucide-react";
import SearchNotes from "@/components/notes/search-notes";
import { useAuth } from "@/contexts/auth-context";
import { useStorage } from "@/contexts/storage-context";
import { StorageProgress } from "@/components/ui/storage-progress";
import { Note } from "@/types";
import { useAppState } from "@/lib/state/use-app-state";

interface HeaderProps {
  onNewNote: () => void;
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
  isCreatingNote?: boolean;
}

export function Header({
  onNewNote,
  toggleSidebar,
  isSidebarOpen,
  isCreatingNote = false,
}: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const { notes, selectNote, setCreatingNote } = useAppState();
  const searchRef = useRef<HTMLDivElement>(null);
  const { user, isAdmin } = useAuth();
  const { userStorage, storagePercentage } = useStorage();

  // Close search when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setMobileSearchOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="sticky top-0 flex items-center sm:py-3 sm:px-8 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-gray-200 shadow-sm z-40" role="banner">
      <div>
        <button
          onClick={toggleSidebar}
          className="p-1.5 text-gray-500 hover:text-gray-700 md:hidden focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded-md grid place-items-center"
          aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          aria-expanded={isSidebarOpen}
          aria-controls="sidebar"
        >
          {isSidebarOpen ? <X size={24} /> : <MenuIcon size={24} />}
        </button>
      </div>

      {/* Title is visible on all screens, centered on mobile */}
      <div className="flex-grow text-center md:text-left md:flex-grow-0 md:ml-4 text-lg font-medium text-gray-800">
        <h1 className="text-lg font-medium m-0">NoteIt-Down</h1>
      </div>

      {/* Search icon and dialog for all screen sizes */}
      {/* Spacer for layout */}
      <div className="flex-grow"></div>

      {/* Search button */}
      <div className="relative ml-auto mr-2" ref={searchRef}>
        <button
          onClick={() => setMenuOpen(false)}
          className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          aria-label="Search notes"
          title="Search notes"
          onMouseDown={(e) => {
            e.preventDefault(); // Prevent focus loss on click
            setMobileSearchOpen(!mobileSearchOpen);
          }}
        >
          <Search size={16} />
        </button>

        {/* Search dropdown */}
        {mobileSearchOpen && (
          <div className="absolute top-full mt-1 w-[calc(100vw-2rem)] sm:w-80 left-1/2 -translate-x-1/2 sm:left-auto sm:right-0 sm:translate-x-0 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 shadow-lg p-2" role="search">
              <SearchNotes
                notes={notes}
                onSelectNote={(note: Note) => {
                  selectNote(note.id);
                  setMobileSearchOpen(false);
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* We've replaced the mobile overlay with a universal dropdown approach */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => {
            // Directly set the creating note state in Zustand
            if (!isCreatingNote) {
              console.log('Setting creating note state to true');
              setCreatingNote(true);
              // Also call the prop method for backward compatibility
              if (onNewNote) onNewNote();
            }
          }}
          disabled={isCreatingNote}
          className={`p-1.5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 
            ${
              isCreatingNote
                ? "text-gray-300 cursor-not-allowed"
                : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
            }`}
          aria-label="Add new note"
          title={isCreatingNote ? "Creating note..." : "Add new note"}
        >
          <Plus size={18} className={isCreatingNote ? "animate-pulse" : ""} />
        </button>
        <Menu isOpen={menuOpen} setIsOpen={setMenuOpen} />
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('toggle-auth-dialog'))}
          className="p-1.5 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          aria-label="Account"
          title="Account"
        >
          <div className="flex items-center">
            {isAdmin || user ? (
              <UserCircle size={18} className="text-green-500" />
            ) : (
              <UserCircle size={18} className="text-gray-500" />
            )}
          </div>
        </button>
      </div>
    </header>
  );
}
