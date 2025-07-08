"use client";

import React, { useRef, useState, useEffect, useCallback } from 'react';
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
  const [containerHeight, setContainerHeight] = useState(400); // Start with reasonable default
  
  const itemHeight = 48;
  
  // Stable height calculation function
  const calculateHeight = useCallback(() => {
    if (!containerRef.current) return;
    
    try {
      const rect = containerRef.current.getBoundingClientRect();
      const availableHeight = rect.height;
      const minHeight = 200;
      const newHeight = Math.max(minHeight, availableHeight - 20); // Leave some padding
      
      if (newHeight !== containerHeight) {
        setContainerHeight(newHeight);
      }
    } catch (error) {
      console.error('Error calculating container height:', error);
    }
  }, [containerHeight]);
  
  // Memoized note selection handler
  const handleNoteSelect = useCallback((note: Note) => {
    // Use requestAnimationFrame for smooth transitions
    requestAnimationFrame(() => {
      try {
        if (selectNote) {
          selectNote(note.id);
        } else {
          onSelectNote(note);
        }
      } catch (error) {
        console.error('Error selecting note:', error);
      }
    });
  }, [selectNote, onSelectNote]);
  
  // Render a note item
  const renderNoteItem = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const note = filteredNotes[index];
    
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
  }, [filteredNotes, selectedNoteId, isDeleting, isSelectionMode, selectedNoteIds, handleNoteSelect, onOpenDetails, onDeleteNote, onToggleSelection]);
  
  // Use ResizeObserver for better performance and accuracy
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    // Initial calculation with delay to ensure DOM is ready
    const initialTimer = setTimeout(calculateHeight, 100);
    
    // Use ResizeObserver if available, fallback to resize listener
    if (typeof window !== 'undefined' && typeof ResizeObserver !== 'undefined') {
      const resizeObserver = new ResizeObserver((entries) => {
        // Debounce the height calculation
        const timer = setTimeout(() => {
          calculateHeight();
        }, 50);
        
        return () => clearTimeout(timer);
      });
      
      resizeObserver.observe(container);
      
      return () => {
        clearTimeout(initialTimer);
        resizeObserver.disconnect();
      };
    } else {
      // Fallback for older browsers
      const handleResize = () => {
        calculateHeight();
      };
      
      window.addEventListener('resize', handleResize);
      
      return () => {
        clearTimeout(initialTimer);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [calculateHeight]);
  
  // Recalculate when notes change
  useEffect(() => {
    const timeoutId = setTimeout(calculateHeight, 100);
    return () => clearTimeout(timeoutId);
  }, [filteredNotes.length, calculateHeight]);
  
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
  
  return (
    <div 
      ref={containerRef} 
      className="virtualized-container p-2"
      role="list" 
      aria-label="Notes list"
    >
      <List
        height={containerHeight}
        width="100%"
        itemCount={filteredNotes.length}
        itemSize={itemHeight}
        className="react-window-list"
      >
        {renderNoteItem}
      </List>
    </div>
  );
}
