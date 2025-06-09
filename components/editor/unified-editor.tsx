"use client";

import React, { forwardRef, useState, useEffect, useRef } from "react";
import dynamic from 'next/dynamic';
import type { Note } from "@/types";
import { useAppState } from "@/lib/state/use-app-state";
import MarkdownRenderer from "@/components/markdown/markdown-renderer";
import NoteTitleEditor from "@/components/modals/new-note-modal";
import WordCount from "@/components/utils/word-count";
import { useUnifiedEditorState, useMonacoConfig } from "./unified-editor-hooks";
import { configureMarkdownLanguage } from '@/lib/markdown/monaco-markdown-completions';
import { configureWikiLinkCompletion } from '@/lib/markdown/monaco-wiki-links';
import { Monaco, EditorInstance } from './types';
import { Button } from '@/components/ui/button';
import { Eye, Code, Copy, MoreVertical, Smartphone } from "lucide-react";
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
      };
      
      // Check on mount
      checkMobile();
      
      // Check on resize
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }, []);
    
    // Reset Monaco failure state when note changes
    useEffect(() => {
      setMonacoLoadFailed(false);
    }, [note.id]);

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
    
    // Track if the editor component is visible
    const [isEditorVisible, setIsEditorVisible] = useState(false);
    const editorContainerRef = useRef<HTMLDivElement>(null);
    
    // Always set editor visible by default
    useEffect(() => {
      // Set editor visible immediately for better user experience
      setIsEditorVisible(true);
      
      // Only use IntersectionObserver for performance optimization
      const observer = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          if (!entry.isIntersecting) {
            // Only update if not visible to avoid unnecessary re-renders
            setIsEditorVisible(false);
          } else {
            setIsEditorVisible(true);
          }
        },
        { threshold: 0.05 } // 5% visibility is enough
      );
      
      if (editorContainerRef.current) {
        observer.observe(editorContainerRef.current);
      }
      
      return () => {
        observer.disconnect();
      };
    }, []);

    // Handle editor mounting
    const onEditorDidMount = (editor: EditorInstance, monaco: Monaco) => {
      setEditorInstance(editor);
      
      // Configure Monaco for markdown editing
      configureMarkdownLanguage(monaco);
      configureWikiLinkCompletion(monaco, notes.map((note: any) => note.noteTitle));
      
      // Set up keyboard shortcuts and other editor configuration
      handleEditorDidMount(monaco, editor);
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
          ) : isMobile ? (
            // Mobile-optimized editor for small screens and touch devices
            <MobileOptimizedEditor 
              note={note} 
              onChange={handleContentChange} 
              onSave={handleSave} 
            />
          ) : (
            // Desktop editor options
            <div className="flex flex-col h-full max-h-[calc(100vh_-_7rem)] md:max-h-[calc(100vh_-_7rem)]">
              {useMonacoEditor ? (
                // Monaco editor
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
                      options={{
                        automaticLayout: true,
                        wordWrap: 'on',
                        minimap: { enabled: false },
                        scrollBeyondLastLine: !isMobile,
                        fontSize: isMobile ? 16 : 14, // Larger font on mobile
                        lineHeight: 1.6,
                        quickSuggestions: !isMobile, // Disable suggestions on mobile
                        padding: { top: 16 },
                        folding: !isMobile,
                        accessibilitySupport: 'on',
                        ariaLabel: 'Markdown Editor',
                        scrollbar: {
                          verticalScrollbarSize: isMobile ? 14 : 10,
                          horizontalScrollbarSize: isMobile ? 14 : 5,
                          alwaysConsumeMouseWheel: false
                        },
                        renderLineHighlight: 'all',
                        cursorBlinking: 'smooth',
                        cursorSmoothCaretAnimation: 'on',
                        smoothScrolling: true
                      }}
                    />
                  )}
                  {!isEditorVisible && (
                    <div className="h-full w-full flex items-center justify-center bg-gray-50 dark:bg-gray-800">
                      <p className="text-gray-500 dark:text-gray-400">Editor loading...</p>
                    </div>
                  )}
                </div>
              ) : (
                // Plain text editor fallback
                <div className="h-full w-full relative flex flex-col" aria-label="Simple text editor">
                  <textarea
                    ref={ref}
                    className={`w-full flex-1 min-h-0 p-4 resize-none outline-none bg-white dark:bg-gray-900 overflow-auto text-[15px] ${fontFamilyClass}`}
                    value={note.content || ""}
                    onChange={(e) => handleContentChange(e.target.value)}
                    placeholder="Start writing..."
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
