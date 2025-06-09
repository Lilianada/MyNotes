"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ArrowLeft } from 'lucide-react';
import { useAppState } from '@/lib/state/use-app-state';
import { Note } from '@/types';
import { useRouter } from 'next/navigation';

interface MobileSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileSearchModal({ isOpen, onClose }: MobileSearchModalProps) {
  const { notes, selectNote } = useAppState();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Note[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      setSearchTerm('');
      setSearchResults([]);
    }
  }, [isOpen]);

  // Handle search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    const term = searchTerm.toLowerCase();
    const results = notes.filter(note => 
      note.noteTitle.toLowerCase().includes(term) || 
      (note.content && note.content.toLowerCase().includes(term))
    );
    
    setSearchResults(results);
  }, [searchTerm, notes]);

  // Handle note selection
  const handleSelectNote = (note: Note) => {
    selectNote(note.id);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex flex-col">
      {/* Search header */}
      <div className="flex items-center p-3 border-b border-gray-200 dark:border-gray-800">
        <button 
          onClick={onClose}
          className="mr-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 flex items-center bg-gray-100 dark:bg-gray-800 rounded-full px-3 py-1.5">
          <Search size={18} className="text-gray-500 dark:text-gray-400 mr-2" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search notes..."
            className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-gray-100"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoComplete="off"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Search results */}
      <div className="flex-1 overflow-y-auto">
        {searchResults.length === 0 && searchTerm && (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            No results found for "{searchTerm}"
          </div>
        )}
        
        {searchResults.length > 0 && (
          <ul className="divide-y divide-gray-200 dark:divide-gray-800">
            {searchResults.map((note) => (
              <li key={note.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <button
                  className="w-full text-left p-4"
                  onClick={() => handleSelectNote(note)}
                >
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                    {note.noteTitle}
                  </h3>
                  {note.content && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                      {note.content}
                    </p>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
