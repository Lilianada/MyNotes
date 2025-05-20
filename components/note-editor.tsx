"use client";

import { forwardRef, useEffect, useState, useRef } from "react";
import type { Note } from "@/types";
import { KeyboardEvent } from "react";
import MarkdownRenderer from "./markdown-renderer";
import NoteTitleEditor from "./note-title-editor";
import WordCount from "./word-count";

interface NoteEditorProps {
  note: Note;
  onChange: (content: string) => void;
  onSave: () => void;
  onUpdateTitle: (newTitle: string) => void;
}

const editorStyles = `
  .note-editor-textarea {
    letter-spacing: 0.025em !important;
    line-height: 2 !important;
    padding: 1rem;
    width: 100%;
    height: 100%;
    resize: none;
    outline: none;
    border: none;
    overflow-y: auto;
  }
`;

export const NoteEditor = forwardRef<HTMLTextAreaElement, NoteEditorProps>(
  function NoteEditor({ note, onChange, onSave, onUpdateTitle }, ref) {
    const [renderHTML, setRenderHTML] = useState(false);
    const lastCursorPositionRef = useRef<{ start: number; end: number }>({ start: 0, end: 0 });
    
    // Track whether we're currently in the middle of an update
    const isUpdatingRef = useRef(false);

    // Focus the editor ONLY when a new note is selected
    useEffect(() => {
      if (ref && typeof ref === "object" && ref.current) {
        ref.current.focus();
      }
      // Only run when note.id changes
    }, [note.id, ref]);

    useEffect(() => {
      // Auto-save when user stops typing
      const saveTimeout = setTimeout(() => {
        onSave();
      }, 1000);

      return () => clearTimeout(saveTimeout);
    }, [note.content, onSave]);

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
      // Ctrl+S or Cmd+S to save
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        onSave();
      }
      
      // Store cursor position on key down
      if (ref && typeof ref === "object" && ref.current) {
        lastCursorPositionRef.current = {
          start: ref.current.selectionStart,
          end: ref.current.selectionEnd
        };
      }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      // Prevent recursive updates
      if (isUpdatingRef.current) return;
      isUpdatingRef.current = true;
      
      const { value, selectionStart, selectionEnd } = e.target;
      
      // Store current cursor position
      const cursorPosition = {
        start: selectionStart,
        end: selectionEnd
      };
      
      // Update content
      onChange(value);
      
      // Restore cursor position after state update
      requestAnimationFrame(() => {
        if (ref && typeof ref === "object" && ref.current) {
          ref.current.selectionStart = cursorPosition.start;
          ref.current.selectionEnd = cursorPosition.end;
        }
        isUpdatingRef.current = false;
      });
    };

    const toggleView = () => {
      // Save current state before toggling
      if (!renderHTML) {
        onSave();
      }
      setRenderHTML((prev) => !prev);
    };

    return (
      <div className="flex flex-col h-full max-h-[calc(100vh_-_7rem)]">
        <div className="mb-2 flex justify-between items-center">
          <NoteTitleEditor
            noteTitle={note.noteTitle}
            noteId={note.id}
            onUpdateTitle={onUpdateTitle}
          />
          <div className="flex items-center space-x-2">
            <WordCount content={note.content} />
            <button
              onClick={toggleView}
              className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
              title={renderHTML ? "Switch to edit mode" : "Switch to view mode"}
              type="button"
            >
              {renderHTML ? "Edit" : "View"}
            </button>
          </div>
        </div>

        {renderHTML ? (
          <div className="flex-1 h-full overflow-hidden">
            <style jsx global>{editorStyles}</style>
            <MarkdownRenderer content={note.content} onChange={onChange} />
          </div>
        ) : (
          <textarea
            onKeyDown={handleKeyDown}
            ref={ref}
            value={note.content}
            onChange={handleInputChange}
            className="w-full h-full flex-1 p-4 border-none outline-none resize-none text-sm sm:text-[15px] bg-transparent scrollbar-hide text-justify leading-relaxed tracking-wide"
            placeholder="Start typing with Markdown support..."
            spellCheck="false"
            onCompositionStart={() => isUpdatingRef.current = true}
            onCompositionEnd={(e) => {
              isUpdatingRef.current = false;
              // Trigger an onChange manually to ensure IME input is captured correctly
              handleInputChange(e as unknown as React.ChangeEvent<HTMLTextAreaElement>);
            }}
          />
        )}
      </div>
    );
  }
);

export default NoteEditor;