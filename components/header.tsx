"use client"

import { useState } from "react"
import { Menu } from "./menu"
import { Menu as MenuIcon, X, Plus } from "lucide-react"
import { useNotes } from "@/contexts/note-context"

interface HeaderProps {
  onNewNote: () => void
  toggleSidebar: () => void
  isSidebarOpen: boolean
}

export function Header({ onNewNote, toggleSidebar, isSidebarOpen }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  
  return (
    <header className="flex justify-between items-center py-3 px-4 sm:px-8 bg-white border-b border-gray-200 shadow-sm z-40 relative">
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
      <div className="text-lg font-medium text-gray-800">Lily's Notes</div>
      <div className="flex items-center space-x-1">
        <button
          onClick={onNewNote}
          className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          aria-label="Add new note"
          title="Add new note"
        >
          <Plus size={18} />
        </button>
        <Menu isOpen={menuOpen} setIsOpen={setMenuOpen} />
      </div>
    </header>
  )
}
