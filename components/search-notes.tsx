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
  const searchInputRef = useRef<HTMLInputElement>(null)
  
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

  // Handle keyboard navigation in search results
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      // Keep focus but clear input
      setSearchQuery("")
    }
  }

  // Function to highlight matched text
  const highlightMatch = (text: string, query: string): JSX.Element => {
    if (!query || !text) return <>{text}</>;
    
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);
    
    if (index === -1) return <>{text}</>;
    
    return (
      <>
        {text.substring(0, index)}
        <span className="bg-yellow-200">{text.substring(index, index + query.length)}</span>
        {text.substring(index + query.length)}
      </>
    );
  };

  // Handle selecting a note from search results
  const handleSelectNote = (note: Note) => {
    onSelectNote(note)
    setSearchQuery("")
  }

  return (
    <div className="w-full">
      <div className="relative mb-2">
        <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-9 w-full rounded-md border border-gray-200 bg-white pl-8 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
          autoFocus
        />
      </div>

      {searchResults.length > 0 && (
        <ul className="max-h-60 overflow-auto py-1">
          {searchResults.map((note) => (
            <li
              key={note.id}
              onClick={() => handleSelectNote(note)}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer rounded-md"
            >
              <div className="font-medium text-sm">
                {highlightMatch(note.noteTitle, searchQuery)}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {highlightMatch(createPlainTextPreview(note.content), searchQuery)}
              </div>
            </li>
          ))}
        </ul>
      )}

      {searchQuery && searchResults.length === 0 && (
        <div className="px-3 py-2 text-sm text-gray-500">No results found</div>
      )}
    </div>
  )
}

export default SearchNotes
