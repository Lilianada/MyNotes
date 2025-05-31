"use client"

import React, { useState, useEffect, useRef } from "react"
import { Search } from "lucide-react"
import { Note } from "@/types"
import { createPlainTextPreview } from "@/lib/markdown/markdown-utils"

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

      for (const term of queryTerms) {
        if (note.noteTitle.toLowerCase().includes(term)) {
          score += 10
          if (!matchTypes.includes('title')) matchTypes.push('title')
        }

        if (note.tags && note.tags.some(tag => tag.toLowerCase().includes(term))) {
          score += 8
          const matchingTags = note.tags.filter(tag => tag.toLowerCase().includes(term))
          if (!matchTypes.some((mt) => mt.startsWith('tags:'))) {
            matchTypes.push(`tags: ${matchingTags.join(', ')}`)
          }
        }

        if (note.category && note.category.name.toLowerCase().includes(term)) {
          score += 8
          if (!matchTypes.some((mt) => mt.startsWith('category:'))) {
            matchTypes.push(`category: ${note.category.name}`)
          }
        }

        if (note.content.toLowerCase().includes(term)) {
          score += 3
          if (!matchTypes.includes('content')) matchTypes.push('content')
        }
      }

      return { note, score, matchTypes }
    })

    const results = resultsWithScore
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => ({ ...item.note, matchTypes: item.matchTypes }))

    setSearchResults(results)
  }, [searchQuery, notes])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setSearchQuery("")
    }
    if (e.key === "Enter" && searchResults.length > 0) {
      e.preventDefault()
      handleSelectNote(searchResults[0])
    }
  }

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

  // Returns the first line containing any of the search terms, or a generic preview if none found
  const getLineWithMatch = (content: string, query: string): string => {
    if (!query || !content) return createPlainTextPreview(content);

    const queryTerms = query
      .toLowerCase()
      .split(' ')
      .filter(term => term.length > 0);

    if (queryTerms.length === 0) return createPlainTextPreview(content);

    const lines = content.split(/\r?\n/);
    for (const line of lines) {
      for (const term of queryTerms) {
        if (line.toLowerCase().includes(term)) {
          return line;
        }
      }
    }
    return createPlainTextPreview(content);
  };

  const highlightMatch = (text: string, query: string): JSX.Element => {
    if (!query || !text) return <>{text}</>;

    const queryTerms = query
      .toLowerCase()
      .split(' ')
      .filter(term => term.length > 0);

    if (queryTerms.length === 0) return <>{text}</>;

    const regex = new RegExp(`(${queryTerms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
    const parts = text.split(regex);

    return (
      <>
        {parts.map((part, i) =>
          queryTerms.some(term => part && part.toLowerCase() === term) ? (
            <span key={i} className="bg-yellow-200">{part}</span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </>
    );
  };

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
            const previewLine = getLineWithMatch(note.content, searchQuery)
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
                  {highlightMatch(previewLine, searchQuery)}
                </div>
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