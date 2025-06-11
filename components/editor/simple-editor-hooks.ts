"use client";

import { useEffect, useRef } from "react";

// Extend Window interface to include our custom property
declare global {
  interface Window {
    cursorSaveTimeout?: ReturnType<typeof setTimeout>;
  }
}
import type { Note } from "@/types";

// Storage key for simple editor cursor positions
const SIMPLE_CURSOR_POSITIONS_KEY = "simpleEditorCursorPositions";

// Types for cursor position tracking
interface SimpleCursorPosition {
  start: number;
  end: number;
  timestamp: number;
}

type SimpleCursorPositions = Record<number | string, SimpleCursorPosition>;

/**
 * Hook for managing cursor position in simple textarea editor
 */
export function useSimpleEditorCursor(
  note: Note,
  textareaRef: React.RefObject<HTMLTextAreaElement>
) {
  const prevNoteIdRef = useRef<number | string | null>(null);

  useEffect(() => {
    if (!note?.id || !textareaRef.current) return;
    
    const textarea = textareaRef.current;
    
    // Save cursor position when textarea changes or component unmounts
    const saveCursorPosition = () => {
      try {
        const positions = getStoredCursorPositions();
        positions[note.id] = {
          start: textarea.selectionStart,
          end: textarea.selectionEnd,
          timestamp: Date.now(),
        };
        
        cleanupOldPositions(positions);
        localStorage.setItem(SIMPLE_CURSOR_POSITIONS_KEY, JSON.stringify(positions));
      } catch (e) {
        console.error("Failed to save textarea cursor position:", e);
      }
    };

    // Restore cursor position when note changes
    const restoreCursorPosition = () => {
      try {
        if (prevNoteIdRef.current !== note.id) {
          const positions = getStoredCursorPositions();
          const savedPosition = positions[note.id];
          
          if (savedPosition) {
            // Use a small delay to ensure the textarea is ready
            setTimeout(() => {
              try {
                // Only set if the content is loaded and textarea is available
                if (textarea && textarea.value) {
                  // Ensure positions are within bounds
                  const maxLength = textarea.value.length;
                  const start = Math.min(savedPosition.start, maxLength);
                  const end = Math.min(savedPosition.end, maxLength);
                  
                  textarea.setSelectionRange(start, end);
                  textarea.focus();
                }
              } catch (err) {
                console.error("Error setting textarea cursor position:", err);
              }
            }, 50);
          }
        }
      } catch (e) {
        console.error("Failed to restore textarea cursor position:", e);
      }
    };

    // Set up event listeners for cursor position saving
    const handleSelectionChange = () => {
      if (window.cursorSaveTimeout) {
        clearTimeout(window.cursorSaveTimeout);
      }
      window.cursorSaveTimeout = setTimeout(() => {
        saveCursorPosition();
      }, 300);
    };
    
    // Attach event listeners
    textarea.addEventListener('click', handleSelectionChange);
    textarea.addEventListener('keyup', handleSelectionChange);
    textarea.addEventListener('select', handleSelectionChange);
    
    // Restore position if needed
    restoreCursorPosition();
    prevNoteIdRef.current = note.id;
    
    return () => {
      // Save position on unmount
      saveCursorPosition();
      
      // Clean up event listeners
      textarea.removeEventListener('click', handleSelectionChange);
      textarea.removeEventListener('keyup', handleSelectionChange);
      textarea.removeEventListener('select', handleSelectionChange);
      
      // Clear any pending timeouts
      if (window.cursorSaveTimeout) {
        clearTimeout(window.cursorSaveTimeout);
      }
    };
  }, [note?.id, textareaRef]);
}

// Helper functions for cursor position management
function getStoredCursorPositions(): SimpleCursorPositions {
  try {
    const stored = localStorage.getItem(SIMPLE_CURSOR_POSITIONS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function cleanupOldPositions(positions: SimpleCursorPositions): void {
  // Clean up old positions (older than 30 days)
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  Object.keys(positions).forEach((key) => {
    const position = positions[key];
    if (position.timestamp < thirtyDaysAgo) {
      delete positions[key];
    }
  });
}
