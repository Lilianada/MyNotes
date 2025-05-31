"use client";

import { forwardRef, useEffect, useState, useRef } from "react";
import type { Note } from "@/types";
import { KeyboardEvent } from "react";
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { useFont } from '@/contexts/font-context';
import MarkdownRenderer from "@/components/markdown/markdown-renderer";
import NoteTitleEditor from "@/components/navigation/note-title-editor";
import WordCount from "@/components/utils/word-count";
import EditorShortcuts from "./editor-shortcuts";
import MonacoMarkdownEditor from "./monaco-markdown-editor";
import { useEditorWithHistory } from "@/lib/edit-history/edit-history-hooks";
import { useAuth } from "@/contexts/auth-context";

interface NoteEditorProps {
  note: Note;
  onChange: (content: string) => void;
  onSave: () => void;
  onUpdateTitle: (newTitle: string) => void;
}

export const NoteEditor = forwardRef<HTMLTextAreaElement, NoteEditorProps>(
  function NoteEditor({ note, onChange, onSave, onUpdateTitle }, ref) {
    const [renderHTML, setRenderHTML] = useState(false);
    const [useMonacoEditor, setUseMonacoEditor] = useState(true);
    const lastCursorPositionRef = useRef<{ start: number; end: number }>({ start: 0, end: 0 });
    const { fontType } = useFont();
    
    // Track whether we're currently in the middle of an update
    const isUpdatingRef = useRef(false);

    // Get auth context for edit history
    const { isAdmin, user } = useAuth();

    // Get the appropriate font family based on font context
    const fontFamilyClass = fontType === 'mono' ? GeistMono.className : GeistSans.className;

    // Integrate edit history with enhanced autosave
    const { handleContentChange, handleSave } = useEditorWithHistory(
      note,
      onChange,
      onSave,
      isAdmin,
      user
      // Use default configuration from edit-history service
    );

    // Focus the editor ONLY when a new note is selected
    useEffect(() => {
      if (ref && typeof ref === "object" && ref.current) {
        ref.current.focus();
      }
      // Only run when note.id changes
    }, [note.id, ref]);

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
      // Ctrl+S or Cmd+S to save
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave(); // Use enhanced save with history
      }
      
      // Auto-complete parentheses, brackets, and backticks
      const bracketPairs: Record<string, string> = {
        '(': ')',
        '[': ']',
        '{': '}',
        '`': '`', // Add backticks for code formatting
      };
      
      // Handle Enter key between brackets to add proper indentation
      if (e.key === 'Enter' && ref && typeof ref === "object" && ref.current) {
        const textarea = ref.current;
        const { selectionStart, selectionEnd } = textarea;
        const textBefore = textarea.value.substring(0, selectionStart);
        const textAfter = textarea.value.substring(selectionEnd);
        
        // Check if cursor is between matching brackets
        const lastChar = textBefore[textBefore.length - 1];
        const nextChar = textAfter[0];
        
        if (Object.entries(bracketPairs).some(([open, close]) => lastChar === open && nextChar === close)) {
          e.preventDefault();
          
          // Calculate the indentation of the current line
          const lastNewLine = textBefore.lastIndexOf('\n');
          const currentLineStart = lastNewLine === -1 ? 0 : lastNewLine + 1;
          const currentLine = textBefore.substring(currentLineStart);
          const indentation = currentLine.match(/^\s*/)?.[0] || '';
          const extraIndentation = lastChar === '{' ? '  ' : ''; // Add extra indent for curly braces
          
          // Insert newlines with proper indentation
          const newText = 
            textBefore + 
            '\n' + indentation + extraIndentation + 
            '\n' + indentation + 
            textAfter;
          
          onChange(newText);
          
          // Position cursor on the middle line with proper indentation
          const newCursorPos = selectionStart + 1 + indentation.length + extraIndentation.length;
          
          requestAnimationFrame(() => {
            if (ref && typeof ref === "object" && ref.current) {
              ref.current.selectionStart = newCursorPos;
              ref.current.selectionEnd = newCursorPos;
            }
          });
          return;
        }
      }
      
      // The inverse map for closing brackets
      const closingBrackets = Object.values(bracketPairs);
      const isClosingBracket = closingBrackets.includes(e.key);
      
      if (ref && typeof ref === "object" && ref.current) {
        const textarea = ref.current;
        const { selectionStart, selectionEnd } = textarea;
        
        // Special handling for triple backticks (code blocks)
        if (e.key === '`' && textarea.value.substring(selectionStart - 2, selectionStart) === '``') {
          e.preventDefault();
          
          // Insert a code block with placeholder
          const newText = 
            textarea.value.substring(0, selectionStart - 2) + 
            '```\n' + 
            (selectionStart === selectionEnd ? '' : textarea.value.substring(selectionStart, selectionEnd)) +
            '\n```' + 
            textarea.value.substring(selectionEnd);
            
          onChange(newText);
          
          // Position cursor inside the code block
          const cursorPos = selectionStart - 2 + 4; // After "```\n"
          requestAnimationFrame(() => {
            if (ref && typeof ref === "object" && ref.current) {
              ref.current.selectionStart = cursorPos;
              ref.current.selectionEnd = cursorPos;
            }
          });
          return;
        }
        
        // Skip over closing brackets if they already exist
        if (isClosingBracket && 
            selectionStart === selectionEnd && 
            textarea.value[selectionStart] === e.key) {
          e.preventDefault();
          // Just move the cursor past the existing closing bracket
          textarea.selectionStart = selectionStart + 1;
          textarea.selectionEnd = selectionEnd + 1;
          return;
        }
        
        // Auto-insert closing brackets
        if (bracketPairs[e.key]) {
          const selectedText = textarea.value.substring(selectionStart, selectionEnd);
          
          // If text is selected, wrap it with brackets/backticks
          if (selectedText) {
            e.preventDefault();
            const newText = 
              textarea.value.substring(0, selectionStart) + 
              e.key + selectedText + bracketPairs[e.key] + 
              textarea.value.substring(selectionEnd);
            
            onChange(newText);
            
            // Set cursor position after the update
            requestAnimationFrame(() => {
              if (ref && typeof ref === "object" && ref.current) {
                // Place cursor after the closing bracket
                ref.current.selectionStart = selectionEnd + 2;
                ref.current.selectionEnd = selectionEnd + 2;
              }
            });
          } else {
            // If no text is selected, add closing bracket and position cursor between them
            e.preventDefault();
            const newText = 
              textarea.value.substring(0, selectionStart) + 
              e.key + bracketPairs[e.key] + 
              textarea.value.substring(selectionEnd);
            
            onChange(newText);
            
            // Set cursor position between the brackets
            requestAnimationFrame(() => {
              if (ref && typeof ref === "object" && ref.current) {
                ref.current.selectionStart = selectionStart + 1;
                ref.current.selectionEnd = selectionStart + 1;
              }
            });
          }
        }
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
      
      // Update content using enhanced handler with history tracking
      handleContentChange(value);
      
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
      // Save current state before toggling using enhanced save
      if (!renderHTML) {
        handleSave();
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
            <EditorShortcuts />
            {!renderHTML && (
              <button
                onClick={() => setUseMonacoEditor(prev => !prev)}
                className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
                title={useMonacoEditor ? "Switch to simple editor" : "Switch to advanced editor"}
                type="button"
              >
                {useMonacoEditor ? "Simple Editor" : "Advanced Editor"}
              </button>
            )}
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
            <MarkdownRenderer
              content={note.content}
              onChange={onChange}
              className="markdown-body"
            />
          </div>
        ) : (
          <div className="w-full h-full flex-1">
            {useMonacoEditor ? (
              <div className="h-full">
                <MonacoMarkdownEditor
                  note={note}
                  onChange={handleContentChange}
                  onSave={handleSave}
                />
              </div>
            ) : (
              <textarea
                onKeyDown={handleKeyDown}
                ref={ref}
                value={note.content}
                onChange={handleInputChange}
                className={`w-full h-full flex-1 p-4 border-none outline-none resize-none text-sm sm:text-[15px] bg-transparent scrollbar-hide text-justify leading-relaxed tracking-wide ${fontFamilyClass}`}
                placeholder="Make things as simple as possible, but not simpler. -Albert Einstein"
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
        )}
      </div>
    );
  }
);

export default NoteEditor;