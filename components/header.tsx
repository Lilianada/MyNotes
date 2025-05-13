"use client"

import { useState, useRef, useEffect } from "react"
import { Menu } from "./menu"
import { Menu as MenuIcon, X, Plus, Search, UserCircle, CloudIcon, HardDriveIcon } from "lucide-react"
import { useNotes } from "@/contexts/note-context"
import SearchNotes from "./search-notes"
import { AuthDialog } from "./auth-dialog"
import { useAuth } from "@/contexts/auth-context"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface HeaderProps {
  onNewNote: () => void
  toggleSidebar: () => void
  isSidebarOpen: boolean
}

// Storage mode indicator component
function StorageModeIndicator() {
  const { user, isAdmin } = useAuth();
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center mr-2">
            {isAdmin && user ? (
              <CloudIcon size={16} className="text-green-500" />
            ) : (
              <HardDriveIcon size={16} className="text-gray-500" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{isAdmin && user ? "Firebase Cloud Storage" : "Local Storage"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function Header({ onNewNote, toggleSidebar, isSidebarOpen }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const { notes, selectNote } = useNotes()
  const searchRef = useRef<HTMLDivElement>(null)
  
  // Close search when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setMobileSearchOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])
  
  return (
    <header className="flex items-center py-3 px-4 sm:px-8 bg-white border-b border-gray-200 shadow-sm z-20 relative">
      <div>
        <button 
          onClick={toggleSidebar}
          className="p-1.5 text-gray-500 hover:text-gray-700 md:hidden focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded-md"
          aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          aria-expanded={isSidebarOpen}
          aria-controls="sidebar"
        >
          {isSidebarOpen ? (
            <X size={24} />
          ) : (
            <MenuIcon size={24} />
          )}
        </button>
      </div>
      
      {/* Title is visible on all screens, centered on mobile */}
      <div className="flex-grow text-center md:text-left md:flex-grow-0 md:ml-4 text-lg font-medium text-gray-800">
        Lily's Notes
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
          <div className="absolute top-full mt-1 w-80 right-0 z-50">
            <div className="bg-white rounded-md border border-gray-200 shadow-lg p-2">
              <SearchNotes 
                notes={notes} 
                onSelectNote={(note) => {
                  selectNote(note.id);
                  setMobileSearchOpen(false);
                }}
              />
            </div>
          </div>
        )}
      </div>
      
      {/* We've replaced the mobile overlay with a universal dropdown approach */}
      
      <div className="flex items-center space-x-1">
        <button
          onClick={onNewNote}
          className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          aria-label="Add new note"
          title="Add new note"
        >
          <Plus size={18} />
        </button>
        <AuthDialog
          trigger={
            <button 
              className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              aria-label="Account"
              title="Account"
            >
              <UserCircle size={18} />
            </button>
          }
        />
        <Menu isOpen={menuOpen} setIsOpen={setMenuOpen} />
        <StorageModeIndicator />
      </div>
    </header>
  )
}
