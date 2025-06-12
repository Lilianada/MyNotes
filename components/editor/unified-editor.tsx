"use client";

import React, { forwardRef, useState, useEffect, useRef } from "react";
import dynamic from 'next/dynamic';
import type { Note } from "@/types";
import { useAppState } from "@/lib/state/use-app-state";
import MarkdownRenderer from "@/components/markdown/markdown-renderer";
import NoteTitleEditor from "@/components/modals/new-note-modal";
import { useMonacoConfig } from "./monaco-config-hook";
import { configureEditorOptions, configureEditorShortcuts } from "./editor-config";
import { useUnifiedEditorState } from "./unified-editor-hooks";
import { useSimpleEditorCursor } from "./simple-editor-hooks";
import { configureMarkdownLanguage } from '@/lib/markdown/monaco-markdown-completions';
import { configureWikiLinkCompletion } from '@/lib/markdown/monaco-wiki-links';
import { Monaco, EditorInstance } from './types';
import { Button } from '@/components/ui/button';
import { Eye, Code, Copy, MoreVertical, Smartphone } from "lucide-react";
import WordCount from "@/components/utils/word-count";
import { useToast } from "@/components/ui/use-toast";
import { MobileOptimizedEditor } from "./mobile-optimized-editor";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
    // Create a local ref if external ref is not provided
    const localTextareaRef = useRef<HTMLTextAreaElement>(null);
    // Ensure we always have a RefObject by using the local ref if the forwarded ref is a function
    const textareaRef = (typeof ref === 'function') ? localTextareaRef : (ref || localTextareaRef);
    
    // Use the simple editor cursor position hook for textarea
    useSimpleEditorCursor(note, textareaRef);
    const { notes } = useAppState();
    const { toast } = useToast();
    const [isMobile, setIsMobile] = useState(false);
    const [monacoLoadFailed, setMonacoLoadFailed] = useState(false);
    
    // Detect mobile devices
    useEffect(() => {
      const checkMobile = () => {
        // Only check width, not user agent, for more reliable detection
        const mobile = window.innerWidth < 768;
        setIsMobile(mobile);
        
        // Automatically disable Monaco on mobile devices
        if (mobile) {
          setMonacoLoadFailed(true);
        }
      };
      
      // Check on mount
      checkMobile();
      
      // Check on resize
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }, []);
    
    // Only reset Monaco failure state when note changes if we're not on mobile
    useEffect(() => {
      if (!isMobile) {
        setMonacoLoadFailed(false);
      }
    }, [note.id, isMobile]);

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
    const { handleEditorDidMount } = useMonacoConfig();
    
    // Always keep editor visible to prevent loading delays
    // This eliminates the "Editor loading..." message when switching modes
    const [isEditorVisible, setIsEditorVisible] = useState(true);
    const editorContainerRef = useRef<HTMLDivElement>(null);
    
    // Set editor always visible for better user experience
    useEffect(() => {
      // Always keep editor visible to prevent loading delays
      setIsEditorVisible(true);
      
      // We're no longer using IntersectionObserver as it causes the loading delay
      // Monaco editor will now stay mounted even when not visible
      // This improves the switching experience between edit and view modes
    }, [note.id]); // Re-run when note changes to ensure editor is visible

    // Handle editor mounting
    const onEditorDidMount = (editor: EditorInstance, monaco: Monaco) => {
      setEditorInstance(editor);
      
      // Apply basic Monaco configuration through our hook
      handleEditorDidMount(editor, monaco);
      
      // Configure wiki link completion with note titles
      configureWikiLinkCompletion(monaco, notes.filter(note => note.noteTitle).map(note => note.noteTitle || ''));
      
      // Configure editor options based on theme and font
      configureEditorOptions(editor, isDarkTheme, fontFamily);
      
      // Set up keyboard shortcuts for saving
      configureEditorShortcuts(monaco, editor, handleSave);
    };

    // Handle Monaco editor load errors
    const handleMonacoLoadError = (error: Error) => {
      console.error('Monaco editor failed to load:', error);
      setMonacoLoadFailed(true);
      toast({
        title: "Editor failed to load",
        description: "Using simplified editor instead",
        duration: 3000,
      });
    };

    return (
      <div className="flex flex-col h-full overflow-hidden">
        {/* Combined title and toolbar */}
        <div className="flex items-center justify-between px-3 border-b border-gray-200 dark:border-gray-800">
          {/* Title editor on the left */}
          <div className="flex-grow mr-4">
            <NoteTitleEditor
              noteTitle={note.noteTitle}
              onUpdateTitle={onUpdateTitle}
              noteId={note.id}
            />
          </div>

          {/* Editor tools on the right - different for mobile vs desktop */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Preview toggle button */}
            <Button
              variant="outline"
              size="sm"
              onClick={togglePreview}
              title={renderHTML ? "Show editor" : "Show preview"}
            >
              {renderHTML ? <Code size={16} /> : <Eye size={16} />}
            </Button>

            {/* Word count - hide on very small screens */}
            <div className="hidden sm:flex items-center mx-2">
              <WordCount content={note.content || ""} />
            </div>

            {/* Dropdown menu for additional options */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Editor Options</DropdownMenuLabel>
                {!isMobile && (
                  <DropdownMenuItem onClick={toggleEditorMode}>
                    {useMonacoEditor ? "Switch to plain text editor" : "Switch to Monaco editor"}
                  </DropdownMenuItem>
                )}
                {isMobile && (
                  <DropdownMenuItem onClick={handleSave}>
                    Save Note
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => {
                  navigator.clipboard.writeText(note.content || "");
                  toast({
                    title: "Copied to clipboard",
                    description: "Note content copied to clipboard",
                    duration: 2000,
                  });
                }}>
                  Copy Content
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Editor content */}
        <div className="flex-grow relative overflow-y-auto pb-4">
          {renderHTML ? (
            // Render markdown preview
            <div className={`h-full overflow-auto p-4 ${fontFamilyClass}`}>
              <MarkdownRenderer content={note.content || ""} />
            </div>
          ) : isMobile || monacoLoadFailed ? (
            // Simple editor for mobile screens or when Monaco fails
            <div className="h-full w-full relative flex flex-col" aria-label="Simple text editor">
              <textarea
                ref={textareaRef}
                className={`w-full flex-1 min-h-0 p-4 resize-none outline-none bg-white dark:bg-gray-900 overflow-auto text-[15px] ${fontFamilyClass}`}
                value={note.content || ""}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="Start writing..."
                spellCheck={true}
                autoCapitalize="sentences"
                autoComplete="on"
                autoCorrect="on"
              />
            </div>
          ) : (
            // Desktop editor options - only show Monaco on desktop
            <div className="flex flex-col h-full max-h-[calc(100vh_-_7rem)] md:max-h-[calc(100vh_-_7rem)]">
              {!isMobile && useMonacoEditor && !monacoLoadFailed ? (
                // Monaco editor - only for desktop
                <div 
                  ref={editorContainerRef}
                  className="h-full w-full" 
                  aria-live="polite" 
                  aria-label="Monaco code editor"
                >
                  {isEditorVisible && (
                    <MonacoEditor
                      height="100%"
                      language="markdown"
                      theme={isDarkTheme ? "vs-dark" : "vs"}
                      defaultValue={note.content || ""}
                      value={note.content || ""}
                      onChange={(value) => value !== undefined && handleContentChange(value)}
                      onMount={onEditorDidMount}
                      // error={handleMonacoLoadError}
                      options={{
                        automaticLayout: true,
                        wordWrap: 'on',
                        minimap: { enabled: false },
                        scrollBeyondLastLine: true,
                        fontSize: 14,
                        lineHeight: 1.6,
                        quickSuggestions: true,
                        padding: { top: 16 },
                        folding: true,
                        accessibilitySupport: 'on',
                        ariaLabel: 'Markdown Editor',
                        scrollbar: {
                          verticalScrollbarSize: 10,
                          horizontalScrollbarSize: 5,
                          alwaysConsumeMouseWheel: false
                        },
                        renderLineHighlight: 'all',
                        cursorBlinking: 'smooth',
                        cursorSmoothCaretAnimation: 'on',
                        smoothScrolling: true
                      }}
                    />
                  )}
                  {/* Loading indicator removed to prevent delays */}
                </div>
              ) : (
                // Plain text editor fallback - used for mobile or when Monaco fails
                <div className="h-full w-full relative flex flex-col" aria-label="Simple text editor">
                  <textarea
                    ref={ref}
                    className={`w-full flex-1 min-h-0 p-4 resize-none outline-none bg-white dark:bg-gray-900 overflow-auto text-[15px] ${fontFamilyClass}`}
                    value={note.content || ""}
                    onChange={(e) => handleContentChange(e.target.value)}
                    placeholder="Start writing..."
                    spellCheck={true}
                    autoCapitalize="sentences"
                    autoComplete="on"
                    autoCorrect="on"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
);
