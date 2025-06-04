"use client"
import { useState, useEffect, useRef } from "react"
import type { Note } from "@/types"
import { useFont } from "@/contexts/font-context"
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import HelpModal from "@/components/modals/help-modal"
import { StorageModal } from "@/components/modals/storage-modal"
import { HelpCircle, Download, HardDrive } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useAppState } from "@/lib/state/app-state"

interface MenuProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}

export function Menu({isOpen, setIsOpen }: MenuProps) {
  const { fontType, toggleFont } = useFont();
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isStorageModalOpen, setIsStorageModalOpen] = useState(false);
  const { notes } = useAppState();
  const { user, isAdmin } = useAuth();
  const menuRef = useRef<HTMLDivElement>(null);
  
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  }
  
  // Handle clicking outside of menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    // Add event listener only when menu is open
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, setIsOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button onClick={toggleMenu} className="p-1 text-gray-500 hover:text-gray-700" aria-label="Menu">
        •••
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10 p-2">
          <div className="py-2 px-4 border-b border-gray-100">
            <p className="text-xs text-gray-500">Font Settings</p>
          </div>
          <div className="p-2">
            <button
              onClick={() => {
                toggleFont();
                // Optional: close menu after selection
                setIsOpen(false);
              }}
              className="flex w-full items-center justify-between px-2 py-1 text-sm rounded hover:bg-gray-50"
            >
              <span>Font Type</span>
              <span className={`px-2 py-0.5 text-xs rounded-md ${
                fontType === 'mono' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {fontType === 'mono' ? 'Mono' : 'Sans'}
              </span>
            </button>
          </div>
          
          <div className="border-t border-gray-100 mt-2 pt-2">
            <div className="py-1 px-4">
              <p className="text-xs text-gray-500">Tools</p>
            </div>
            <div className="p-2 space-y-1">
              <button
                onClick={() => {
                  // Dispatch custom event for export dialog
                  console.log('Dispatching toggle-export-dialog event');
                  window.dispatchEvent(new CustomEvent('toggle-export-dialog'));
                  setIsOpen(false);
                }}
                className="flex w-full items-center px-2 py-1 text-sm rounded hover:bg-gray-50"
                disabled={notes.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                <span>Export</span>
              </button>
            </div>
          </div>

              {/* Storage Info - for all authenticated users */}
              {user && (
          <div className="border-t border-gray-100 mt-2 pt-2">
            <div className="py-1 px-4">
              <p className="text-xs text-gray-500">Storage</p>
            </div>
            <div className="p-2">
              
                <button
                  onClick={() => {
                    setIsStorageModalOpen(true);
                    setIsOpen(false);
                  }}
                  className="flex w-full items-center px-2 py-1 text-sm rounded hover:bg-gray-50 mt-1"
                >
                  <HardDrive className="w-4 h-4 mr-2" />
                  <span>{isAdmin ? "Storage Dashboard" : "Storage Info"}</span>
                </button>
            </div>
          </div>
              )}
          
          <div className="border-t border-gray-100 mt-2 pt-2">
            <div className="py-1 px-4">
              <p className="text-xs text-gray-500">Help</p>
            </div>
            <div className="p-2">
              <button
                onClick={() => {
                  setIsHelpModalOpen(true);
                  setIsOpen(false);
                }}
                className="flex w-full items-center px-2 py-1 text-sm rounded hover:bg-gray-50"
              >
                <HelpCircle className="w-4 h-4 mr-2" />
                <span>Help</span>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Help Modal */}
      <HelpModal 
        isOpen={isHelpModalOpen} 
        onClose={() => setIsHelpModalOpen(false)} 
      />
      
      {/* Storage Modal */}
      <StorageModal
        isOpen={isStorageModalOpen}
        onClose={() => setIsStorageModalOpen(false)}
      />
    </div>
  )
}
