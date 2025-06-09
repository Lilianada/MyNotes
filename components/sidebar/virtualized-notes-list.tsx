"use client";

import React, { useRef, useState, useEffect } from 'react';
import { FixedSizeList as List } from 'react-window';
import type { Note } from '@/types';
import NoteListItem from './note-list-item';
import { NoteListSkeleton } from '@/components/ui/note-skeleton';
import { useAppState } from '@/lib/state/use-app-state';

interface VirtualizedNotesListProps {
  filteredNotes: Note[];
  selectedNoteId: number | null;
  isDeleting: number | null;
  isSelectionMode: boolean;
  selectedNoteIds: Set<number>;
  onSelectNote: (note: Note) => void;
  onOpenDetails: (note: Note, e: React.MouseEvent) => void;
  onDeleteNote: (note: Note, e: React.MouseEvent) => void;
  onToggleSelection: (noteId: number, isSelected: boolean) => void;
  selectNote?: (id: number) => void;
  isLoading?: boolean;
}

export function VirtualizedNotesList({
  filteredNotes,
  selectedNoteId,
  isDeleting,
  isSelectionMode,
  selectedNoteIds,
  onSelectNote,
  onOpenDetails,
  onDeleteNote,
  onToggleSelection,
  selectNote,
  isLoading
}: VirtualizedNotesListProps) {
  const { isLoading: globalLoading } = useAppState();
  const showLoading = isLoading ?? globalLoading;
  
  // Container ref to measure available height
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(400); // Default height
  
  // Item height (can be adjusted based on your design)
  const itemHeight = 48; // Height of each note item in pixels
  
  // Update container height on mount and window resize
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
      }
    };
    
    // Initial measurement
    updateHeight();
    
    // Add resize listener
    window.addEventListener('resize', updateHeight);
    
    // Cleanup
    return () => window.removeEventListener('resize', updateHeight);
  }, []);
  
  // Loading state
  if (showLoading) {
    return <NoteListSkeleton count={7} />;
  }
  
  // Empty state
  if (filteredNotes.length === 0) {
    return (
      <p className="text-center text-gray-400 text-base p-4" role="status">No notes yet</p>
    );
  }
  
  // Render a note item
  const renderNoteItem = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const note = filteredNotes[index];
    
    // Safe note selection handler to prevent Monaco editor errors
    const handleNoteSelect = (note: Note) => {
      // First, check if we're on mobile
      const isMobile = typeof window !== 'undefined' && 
        (window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
      
      // Use a longer delay on mobile devices to ensure the sidebar animation completes
      const delay = isMobile ? 300 : 50;
      
      // Use setTimeout to defer the selection until after any sidebar animations
      // This helps prevent Monaco editor errors when the sidebar is being hidden
      setTimeout(() => {
        try {
          if (selectNote) {
            selectNote(note.id);
          } else {
            onSelectNote(note);
          }
        } catch (error) {
          console.error('Error selecting note:', error);
        }
      }, delay);
    };
    
    return (
      <div style={style}>
        <NoteListItem
          key={note.id}
          note={note}
          selectedNoteId={selectedNoteId}
          isDeleting={isDeleting}
          isSelectionMode={isSelectionMode}
          isSelected={selectedNoteIds.has(note.id)}
          onSelectNote={handleNoteSelect}
          onOpenDetails={onOpenDetails}
          onDeleteNote={onDeleteNote}
          onToggleSelection={onToggleSelection}
        />
      </div>
    );
  };
  
  return (
    <div 
      ref={containerRef} 
      className="md:max-h-[calc(100vh_-_155px)] overflow-hidden p-2"
      role="list" 
      aria-label="Notes list"
    >
      <List
        height={containerHeight}
        width="100%"
        itemCount={filteredNotes.length}
        itemSize={itemHeight}
        className="scrollbar-hide"
      >
        {renderNoteItem}
      </List>
    </div>
  );
}
