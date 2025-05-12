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
    <header className="flex justify-between items-center py-2 px-4 bg-white border-b border-gray-200">
      <div>
        <button 
          onClick={toggleSidebar}
          className="p-1 text-gray-500 hover:text-gray-700 md:hidden"
          aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {isSidebarOpen ? (
            <X size={24} />
          ) : (
            <MenuIcon size={24} />
          )}
        </button>
      </div>
      <div className="text-lg font-medium text-gray-800">Notes</div>
      <div className="flex items-center">
        <button
          onClick={onNewNote}
          className="p-1 text-gray-500 hover:text-gray-700 mr-2"
          aria-label="Add new note"
        >
          <Plus size={24} />
        </button>
        <Menu isOpen={menuOpen} setIsOpen={setMenuOpen} />
      </div>
    </header>
  )
}
