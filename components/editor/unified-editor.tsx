"use client";

import React, { forwardRef } from "react";
import dynamic from 'next/dynamic';
import type { Note } from "@/types";
import { useAppState } from "@/lib/state/app-state";
import MarkdownRenderer from "@/components/markdown/markdown-renderer";
import NoteTitleEditor from "@/components/modals/new-note-modal";
import WordCount from "@/components/utils/word-count";
import { useUnifiedEditorState, useMonacoConfig } from "./unified-editor-hooks";
import { configureMarkdownLanguage } from '@/lib/markdown/monaco-markdown-completions';
import { configureWikiLinkCompletion } from '@/lib/markdown/monaco-wiki-links';
import { Monaco, EditorInstance } from './types';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Code, FileText, Copy, MoreVertical } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Dynamically import Monaco Editor with no SSR
const MonacoEditor = dynamic(
  () => import('@monaco-editor/react').then(mod => mod.default),
  { ssr: false }
);

interface UnifiedEditorProps {
  note: Note;
  onChange: (content: string) => void;
  onSave: () => void;
  onUpdateTitle: (newTitle: string) => void;
}

export const UnifiedEditor = forwardRef<HTMLTextAreaElement, UnifiedEditorProps>(
  function UnifiedEditor({ note, onChange, onSave, onUpdateTitle }, ref) {
    const { notes } = useAppState();
    const { toast } = useToast();
    
    // Use our consolidated hook for state management
    const {
      renderHTML,
      useMonacoEditor,
      isDarkTheme,
      editorInstance,
      fontFamily,
      fontFamilyClass,
      setEditorInstance,
      toggleEditorMode,
      togglePreview,
      handleContentChange,
      handleSave
    } = useUnifiedEditorState(note, onChange, onSave);
    
    // Use Monaco configuration hook
    const { handleEditorDidMount } = useMonacoConfig(
      editorInstance,
      handleSave,
      isDarkTheme,
      fontFamily
    );
    
    // Handle editor mounting
    const onEditorDidMount = (editor: EditorInstance, monaco: Monaco) => {
      setEditorInstance(editor);
      
      
      // Configure Monaco for markdown editing
      configureMarkdownLanguage(monaco);
      configureWikiLinkCompletion(monaco, notes.map((note: any) => note.noteTitle));
      
      // Set up keyboard shortcuts and other editor configuration
      handleEditorDidMount(monaco, editor);
    };

    return (
      <div className="flex flex-col h-full overflow-hidden">
        {/* Note title editor */}
        <NoteTitleEditor 
          noteTitle={note.noteTitle} 
          onUpdateTitle={onUpdateTitle}
          noteId={note.id}
        />
        
        {/* Editor toolbar */}
        <div className="flex gap-2 py-2 px-1 border-b border-gray-200 dark:border-gray-800">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={togglePreview}
            title={renderHTML ? "Show editor" : "Show preview"}
          >
            {renderHTML ? <Code size={16} /> : <Eye size={16} />}
          </Button>
          
          {/* Copy button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(note.content || "");
              toast({
                title: "Copied to clipboard",
                description: "Note content copied to clipboard",
                duration: 2000,
              });
            }}
            title="Copy note content"
          >
            <Copy size={16} />
          </Button>
          
          {/* Word count */}
          <div className="flex items-center mx-2">
            <WordCount content={note.content || ""} />
          </div>
          
          {/* Dropdown menu for additional options */}
          <div className="ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Editor Options</DropdownMenuLabel>
                <DropdownMenuItem onClick={toggleEditorMode}>
                  {useMonacoEditor ? "Switch to plain text editor" : "Switch to Monaco editor"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Keyboard Shortcuts</DropdownMenuLabel>
                <div className="p-2 text-xs text-gray-500">
                  <div className="flex justify-between mb-1">
                    <span>Save</span>
                    <span className="font-mono">Ctrl+S</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span>Bold</span>
                    <span className="font-mono">Ctrl+B</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span>Italic</span>
                    <span className="font-mono">Ctrl+I</span>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Editor content */}
        <div className="flex-grow relative overflow-hidden">
          {renderHTML ? (
            // Render markdown preview
            <div className={`h-full overflow-auto p-4 ${fontFamilyClass}`}>
              <MarkdownRenderer content={note.content || ""} />
            </div>
          ) : (
            // Render active editor
            <>
              {useMonacoEditor ? (
                // Monaco editor
                <div className="h-full w-full overflow-hidden">
                  <MonacoEditor
                    height="100%"
                    language="markdown"
                    theme={isDarkTheme ? "vs-dark" : "vs"}
                    value={note.content || ""}
                    onChange={(value) => value !== undefined && handleContentChange(value)}
                    onMount={onEditorDidMount}
                    options={{
                      automaticLayout: true,
                      wordWrap: 'on',
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      fontSize: 14,
                      lineHeight: 1.5,
                      quickSuggestions: true,
                      scrollbar: {
                        verticalScrollbarSize: 10,
                        horizontalScrollbarSize: 10
                      }
                    }}
                  />
                </div>
              ) : (
                // Plain text editor
                <textarea
                  ref={ref}
                  className={`w-full h-full p-4 resize-none outline-none bg-white dark:bg-gray-900 ${fontFamilyClass}`}
                  value={note.content || ""}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder="Start writing..."
                />
              )}
            </>
          )}
        </div>
      </div>
    );
  }
);
