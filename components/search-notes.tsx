"use client"

import React, { useState, useEffect, useRef } from "react"
import { Search } from "lucide-react"
import { Note } from "@/types"
import { createPlainTextPreview } from "@/lib/markdown-utils"

interface SearchNotesProps {
  notes: Note[]
  onSelectNote: (note: Note) => void
}

interface EnhancedNote extends Note {
  matchTypes?: string[]
}

export function SearchNotes({ notes, onSelectNote }: SearchNotesProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<EnhancedNote[]>([])
  const searchInputRef = useRef<HTMLInputElement>(null)
  
  // Enhanced filter notes based on search query with scoring
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    const query = searchQuery.toLowerCase()
    const queryTerms = query.split(' ').filter(term => term.length > 0)
    
    const resultsWithScore = notes.map(note => {
      let score = 0
      let matchTypes: string[] = []
      
      // Check each query term
      for (const term of queryTerms) {
        // Title matches (highest priority)
        if (note.noteTitle.toLowerCase().includes(term)) {
          score += 10
          if (!matchTypes.includes('title')) matchTypes.push('title')
        }
        
        // Tag matches (high priority)
        if (note.tags && note.tags.some(tag => tag.toLowerCase().includes(term))) {
          score += 8
          const matchingTags = note.tags.filter(tag => tag.toLowerCase().includes(term))
          if (!matchTypes.includes('tags')) {
            matchTypes.push(`tags: ${matchingTags.join(', ')}`)
          }
        }
        
        // Category matches (high priority)
        if (note.category && note.category.name.toLowerCase().includes(term)) {
          score += 8
          if (!matchTypes.includes('category')) {
            matchTypes.push(`category: ${note.category.name}`)
          }
        }
        
        // Content matches (lower priority)
        if (note.content.toLowerCase().includes(term)) {
          score += 3
          if (!matchTypes.includes('content')) matchTypes.push('content')
        }
      }
      
      return { note, score, matchTypes }
    })
    
    // Filter notes with score > 0 and sort by score (descending)
    const results = resultsWithScore
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => ({ ...item.note, matchTypes: item.matchTypes }))

    setSearchResults(results)
  }, [searchQuery, notes])

  // Handle keyboard navigation in search results
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      // Keep focus but clear input
      setSearchQuery("")
    }
    // Add support for Enter to select first result
    if (e.key === "Enter" && searchResults.length > 0) {
      e.preventDefault()
      handleSelectNote(searchResults[0])
    }
  }

  // Function to determine what matched in the search
  const getMatchInfo = (note: Note, query: string) => {
    const lowerQuery = query.toLowerCase()
    const matches = []
    
    if (note.noteTitle.toLowerCase().includes(lowerQuery)) {
      matches.push('title')
    }
    
    if (note.content.toLowerCase().includes(lowerQuery)) {
      matches.push('content')
    }
    
    if (note.tags && note.tags.some(tag => tag.toLowerCase().includes(lowerQuery))) {
      const matchingTags = note.tags.filter(tag => tag.toLowerCase().includes(lowerQuery))
      matches.push(`tags: ${matchingTags.join(', ')}`)
    }
    
    if (note.category && note.category.name.toLowerCase().includes(lowerQuery)) {
      matches.push(`category: ${note.category.name}`)
    }
    
    return matches
  }

  // Enhanced function to highlight matched text with better support for multiple terms
  const highlightMatch = (text: string, query: string): JSX.Element => {
    if (!query || !text) return <>{text}</>;
    
    const queryTerms = query.toLowerCase().split(' ').filter(term => term.length > 0)
    let highlightedText = text
    
    // Apply highlighting for each term
    queryTerms.forEach(term => {
      const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
      highlightedText = highlightedText.replace(regex, '|||HIGHLIGHT_START|||$1|||HIGHLIGHT_END|||')
    })
    
    // Split by our markers and create elements
    const parts = highlightedText.split(/(|||HIGHLIGHT_START|||.*?|||HIGHLIGHT_END|||)/)
    
    return (
      <>
        {parts.map((part, index) => {
          if (part.startsWith('|||HIGHLIGHT_START|||') && part.endsWith('|||HIGHLIGHT_END|||')) {
            const highlightedContent = part.replace(/|||HIGHLIGHT_START|||/, '').replace(/|||HIGHLIGHT_END|||/, '')
            return <span key={index} className="bg-yellow-200">{highlightedContent}</span>
          }
          return <span key={index}>{part}</span>
        })}
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
          placeholder="Search notes, tags, categories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-9 w-full rounded-md border border-gray-200 bg-white pl-8 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
          autoFocus
        />
      </div>

      {searchResults.length > 0 && (
        <ul className="max-h-60 overflow-auto py-1">
          {searchResults.map((note) => {
            const matchInfo = note.matchTypes || getMatchInfo(note, searchQuery)
            return (
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
                {/* Show tags and category info */}
                <div className="flex items-center gap-2 mt-1">
                  {note.category && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800">
                      {highlightMatch(note.category.name, searchQuery)}
                    </span>
                  )}
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {note.tags.slice(0, 3).map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-700"
                        >
                          {highlightMatch(tag, searchQuery)}
                        </span>
                      ))}
                      {note.tags.length > 3 && (
                        <span className="text-xs text-gray-500">+{note.tags.length - 3} more</span>
                      )}
                    </div>
                  )}
                </div>
                {matchInfo.length > 0 && (
                  <div className="text-xs text-blue-600 mt-1">
                    Matches: {matchInfo.join(', ')}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {searchQuery && searchResults.length === 0 && (
        <div className="px-3 py-2 text-sm text-gray-500">No results found</div>
      )}
    </div>
  )
}

export default SearchNotes
