import { useEffect } from 'react';
import { EditorInstance } from './types';

// This hook manages the cursor position and selection in the Monaco Editor
export function useEditorCursorState(
  editor: EditorInstance | null,
  content: string,
  previousContent: string | null
): void {
  useEffect(() => {
    // If content changed externally, we need to maintain cursor position
    if (editor && previousContent !== null && content !== previousContent) {
      // Get current position before update
      const selection = editor.getSelection();
      
      if (selection) {
        // After update, restore the position
        const position = selection.getPosition();
        if (position) {
          setTimeout(() => {
            editor.setPosition(position);
            editor.revealPositionInCenter(position);
          }, 0);
        }
      }
    }
  }, [editor, content, previousContent]);
}

// This hook manages editor focus
export function useEditorFocus(
  editor: EditorInstance | null,
  noteId: number
): void {
  useEffect(() => {
    // Focus editor when note changes
    if (editor) {
      setTimeout(() => {
        editor.focus();
      }, 100);
    }
  }, [editor, noteId]);
}
