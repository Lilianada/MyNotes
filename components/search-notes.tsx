"use client"

import React, { useState, useEffect, useRef } from "react"
import { Search } from "lucide-react"
import { Note } from "@/types"
import { createPlainTextPreview } from "@/lib/markdown-utils"

interface SearchNotesProps {
  notes: Note[]
  onSelectNote: (note: Note) => void
}

export function SearchNotes({ notes, onSelectNote }: SearchNotesProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Note[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchResultsRef = useRef<HTMLDivElement>(null)

  // Filter notes based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    const query = searchQuery.toLowerCase()
    const results = notes.filter(
      (note) =>
        note.noteTitle.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query)
    )

    setSearchResults(results)
  }, [searchQuery, notes])

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchResultsRef.current &&
        !searchResultsRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setIsSearching(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Handle keyboard navigation in search results
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsSearching(false)
    }
  }

  // Handle selecting a note from search results
  const handleSelectNote = (note: Note) => {
    onSelectNote(note)
    setIsSearching(false)
    setSearchQuery("")
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsSearching(true)}
          onKeyDown={handleKeyDown}
          className="h-9 w-full rounded-md border border-gray-200 bg-white pl-8 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
        />
      </div>

      {isSearching && searchResults.length > 0 && (
        <div
          ref={searchResultsRef}
          className="absolute top-full mt-1 w-full rounded-md border border-gray-200 bg-white shadow-md z-10"
        >
          <ul className="max-h-60 overflow-auto py-1">
            {searchResults.map((note) => (
              <li
                key={note.id}
                onClick={() => handleSelectNote(note)}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
              >
                <div className="font-medium text-sm">{note.noteTitle}</div>
                <div className="text-xs text-gray-500 truncate">
                  {createPlainTextPreview(note.content)}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isSearching && searchQuery && searchResults.length === 0 && (
        <div
          ref={searchResultsRef}
          className="absolute top-full mt-1 w-full rounded-md border border-gray-200 bg-white shadow-md z-10"
        >
          <div className="px-3 py-2 text-sm text-gray-500">No results found</div>
        </div>
      )}
    </div>
  )
}

export default SearchNotes
