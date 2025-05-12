"use client"

import { forwardRef, useEffect, useState } from "react"
import type { Note } from "@/types"
import { KeyboardEvent } from 'react';
import MarkdownRenderer from "./markdown-renderer";
import NoteTitleEditor from "./note-title-editor";

interface NoteEditorProps {
  note: Note
  onChange: (content: string) => void
  onSave: () => void
  onUpdateTitle: (newTitle: string) => void
}

export const NoteEditor = forwardRef<HTMLTextAreaElement, NoteEditorProps>(function NoteEditor(
  { note, onChange, onSave, onUpdateTitle },
  ref,
) {
  const [renderHTML, setRenderHTML] = useState(false);

  useEffect(() => {
    // Auto-save when user stops typing
    const saveTimeout = setTimeout(() => {
      onSave()
    }, 1000)

    return () => clearTimeout(saveTimeout)
  }, [note.content, onSave])

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+S or Cmd+S to save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      onSave();
    }
    
    // Auto-convert "->" to arrow symbol (→) when typing ">"
    if (e.key === ">" && e.currentTarget.value.slice(-1) === "-") {
      e.preventDefault();
      
      const cursorPos = e.currentTarget.selectionStart;
      const newContent = 
        e.currentTarget.value.substring(0, cursorPos - 1) + 
        "→" + 
        e.currentTarget.value.substring(cursorPos);
      
      onChange(newContent);
      
      // Set cursor position after the arrow
      setTimeout(() => {
        const textarea = e.currentTarget;
        if (textarea) {
          textarea.selectionStart = cursorPos;
          textarea.selectionEnd = cursorPos;
        }
      }, 0);
    }
  };
  
  // Handle input changes with auto-conversions
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let newContent = e.target.value;
    
    // Auto-convert "->" to arrow (→)
    if (newContent.includes("->")) {
      newContent = newContent.replace(/\-\>/g, "→");
    }
    
    onChange(newContent);
  };

  // Toggle between edit view and rendered view
  const toggleView = () => {
    setRenderHTML(!renderHTML);
  };

  // Insert current date in YYYY-MM-DD format
  const insertCurrentDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    
    // Check if ref exists and is properly connected to the DOM element
    if (!ref || typeof ref !== 'object' || !ref.current) return;
    
    const textArea = ref.current;
    
    // Make sure selectionStart exists and is a number
    const cursorPos = typeof textArea.selectionStart === 'number' ? textArea.selectionStart : 0;
    
    const newContent = 
      note.content.substring(0, cursorPos) + 
      formattedDate + 
      note.content.substring(cursorPos);
    
    onChange(newContent);
    
    // Set cursor position after the inserted date
    setTimeout(() => {
      if (ref && ref.current) {
        const textAreaElement = ref.current;
        textAreaElement.selectionStart = cursorPos + formattedDate.length;
        textAreaElement.selectionEnd = cursorPos + formattedDate.length;
        textAreaElement.focus();
      }
    }, 0);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-2 flex justify-between items-center">
        <NoteTitleEditor 
          noteTitle={note.noteTitle}
          noteId={note.id} 
          onUpdateTitle={onUpdateTitle}
        />
        <div className="flex items-center space-x-2">
          <button
            onClick={insertCurrentDate}
            className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
            title="Insert current date"
          >
            Date
          </button>
          <button 
            onClick={toggleView} 
            className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
            title={renderHTML ? "Switch to edit mode" : "Switch to view mode"}
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
          />
        </div>
      ) : (
        <textarea
          onKeyDown={handleKeyDown}
          ref={ref}
          value={note.content}
          onChange={handleInputChange}
          className="w-full flex-1 p-0 border-none outline-none resize-none text-sm sm:text-[15px] bg-transparent scrollbar-hide text-justify"
          placeholder="Start typing with Markdown support... Use # for headings, **bold**, *italic*, and [ ] for checkboxes"
          autoFocus
        />
      )}
      
    </div>
  )
})

export default NoteEditor
