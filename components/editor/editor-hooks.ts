import { useEffect, useRef } from "react";
import { EditorInstance } from "./types";

const CURSOR_POSITIONS_KEY = "noteEditorCursorPositions";

interface CursorPosition {
  line: number;
  column: number;
  timestamp: number;
}

function getStoredCursorPositions(): Record<number, CursorPosition> {
  try {
    const stored = localStorage.getItem(CURSOR_POSITIONS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveCursorPosition(noteId: number, line: number, column: number): void {
  try {
    const positions = getStoredCursorPositions();
    positions[noteId] = {
      line,
      column,
      timestamp: Date.now(),
    };
    // Clean up old positions (older than 30 days)
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    Object.keys(positions).forEach((key) => {
      const position = positions[parseInt(key)];
      if (position.timestamp < thirtyDaysAgo) {
        delete positions[parseInt(key)];
      }
    });
    localStorage.setItem(CURSOR_POSITIONS_KEY, JSON.stringify(positions));
  } catch {}
}

export function useEditorCursorState(editor: EditorInstance | null, noteId: number): void {
  // Save cursor position on every move/blur
  useEffect(() => {
    if (!editor) return;

    const save = () => {
      const pos = editor.getPosition();
      if (pos) saveCursorPosition(noteId, pos.lineNumber, pos.column);
    };

    const moveDisposable = editor.onDidChangeCursorPosition(save);
    const blurDisposable = editor.onDidBlurEditorText(save);

    // Immediate save on unmount
    return () => {
      save();
      moveDisposable.dispose();
      blurDisposable.dispose();
    };
  }, [editor, noteId]);

  // Restore cursor position when editor/note changes (including on reload)
  useEffect(() => {
    if (!editor) return;
    const positions = getStoredCursorPositions();
    const saved = positions[noteId];

    // Wait for model to be ready before setting position
    const restore = () => {
      if (!editor) return;
      const model = editor.getModel();
      if (model && saved) {
        // Clamp to valid line/column
        const maxLine = model.getLineCount();
        const line = Math.min(Math.max(1, saved.line), maxLine);
        const maxCol = model.getLineContent(line).length + 1;
        const column = Math.min(Math.max(1, saved.column), maxCol);
        editor.setPosition({ lineNumber: line, column });
        editor.revealPositionInCenter({ lineNumber: line, column });
      } else {
        editor.setPosition({ lineNumber: 1, column: 1 });
      }
      editor.focus();
    };

    // Delay to ensure model is ready (Monaco quirk)
    const timeout = setTimeout(restore, 80);
    return () => clearTimeout(timeout);
  }, [editor, noteId]);
}