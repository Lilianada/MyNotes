"use client"
import type { Note } from "@/types"
import { useFont } from "@/contexts/font-context"
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'

interface MenuProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}

export function Menu({isOpen, setIsOpen }: MenuProps) {
  const { fontType, toggleFont } = useFont();
  
  const toggleMenu = () => {
    setIsOpen(!isOpen)
  }

  return (
    <div className="relative">
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
        </div>
      )}
    </div>
  )
}
