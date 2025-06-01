import { useEffect, useRef } from 'react';
import { EditorInstance } from './types';

// Storage key for cursor positions
const CURSOR_POSITIONS_KEY = 'noteEditorCursorPositions';

// Interface for cursor position data
interface CursorPosition {
  line: number;
  column: number;
  timestamp: number;
}

// Helper to get stored cursor positions
function getStoredCursorPositions(): Record<number, CursorPosition> {
  try {
    const stored = localStorage.getItem(CURSOR_POSITIONS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.warn('Failed to load cursor positions:', error);
    return {};
  }
}

// Helper to save cursor position
function saveCursorPosition(noteId: number, line: number, column: number): void {
  try {
    const positions = getStoredCursorPositions();
    positions[noteId] = {
      line,
      column,
      timestamp: Date.now()
    };
    
    // Clean up old positions (older than 30 days)
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    Object.keys(positions).forEach(key => {
      const position = positions[parseInt(key)];
      if (position.timestamp < thirtyDaysAgo) {
        delete positions[parseInt(key)];
      }
    });
    
    localStorage.setItem(CURSOR_POSITIONS_KEY, JSON.stringify(positions));
  } catch (error) {
    console.warn('Failed to save cursor position:', error);
  }
}

// This hook manages the cursor position and selection in the Monaco Editor with persistence
export function useEditorCursorState(
  editor: EditorInstance | null,
  content: string,
  previousContent: string | null
): void {
  const isRestoringRef = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!editor) return;

    // Save cursor position with throttling
    const saveCursor = (noteId: number) => {
      if (isRestoringRef.current) return;
      
      const position = editor.getPosition();
      if (position) {
        saveCursorPosition(noteId, position.lineNumber, position.column);
      }
    };

    // Throttled save function
    const throttledSave = (noteId: number) => {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => saveCursor(noteId), 500);
    };

    // Store the save functions on the editor for access from other hooks
    (editor as any).__saveCursor = saveCursor;
    (editor as any).__throttledSave = throttledSave;

    return () => {
      clearTimeout(saveTimeoutRef.current);
    };
  }, [editor]);

  useEffect(() => {
    // If content changed externally, maintain cursor position
    if (editor && previousContent !== null && content !== previousContent) {
      const selection = editor.getSelection();
      
      if (selection) {
        // After update, restore the position
        const position = selection.getPosition();
        if (position) {
          isRestoringRef.current = true;
          setTimeout(() => {
            editor.setPosition(position);
            editor.revealPositionInCenter(position);
            isRestoringRef.current = false;
          }, 0);
        }
      }
    }
  }, [editor, content, previousContent]);
}

// This hook manages editor focus and cursor restoration
export function useEditorFocus(
  editor: EditorInstance | null,
  noteId: number
): void {
  const hasRestoredRef = useRef<number | null>(null);
  const currentNoteIdRef = useRef<number>(noteId);

  // Update current note ID
  useEffect(() => {
    currentNoteIdRef.current = noteId;
  }, [noteId]);

  useEffect(() => {
    if (!editor) return;

    // Set up cursor position saving listeners for this note
    const saveCursor = () => {
      const saveFn = (editor as any).__saveCursor;
      if (saveFn) {
        saveFn(currentNoteIdRef.current);
      }
    };

    const throttledSave = () => {
      const throttleFn = (editor as any).__throttledSave;
      if (throttleFn) {
        throttleFn(currentNoteIdRef.current);
      }
    };

    // Add event listeners for saving cursor position
    const selectionDisposable = editor.onDidChangeCursorPosition(throttledSave);
    const blurDisposable = editor.onDidBlurEditorText(saveCursor);

    // Restore cursor position if this is a new note
    if (hasRestoredRef.current !== noteId) {
      const restoreCursor = () => {
        const positions = getStoredCursorPositions();
        const savedPosition = positions[noteId];
        
        if (savedPosition) {
          const { line, column } = savedPosition;
          const position = { lineNumber: line, column };
          
          editor.setPosition(position);
          editor.revealPositionInCenter(position);
          
          console.log(`Restored cursor position for note ${noteId}: line ${line}, column ${column}`);
        }
        
        editor.focus();
        hasRestoredRef.current = noteId;
      };

      // Delay to ensure editor is fully initialized
      const timeout = setTimeout(restoreCursor, 150);

      return () => {
        clearTimeout(timeout);
        selectionDisposable?.dispose();
        blurDisposable?.dispose();
      };
    } else {
      // Just focus if already restored
      setTimeout(() => editor.focus(), 100);
      
      return () => {
        selectionDisposable?.dispose();
        blurDisposable?.dispose();
      };
    }
  }, [editor, noteId]);
}
