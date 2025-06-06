"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import type { Note } from "@/types";
import { useFont } from '@/contexts/font-context';
import { useTheme } from 'next-themes';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { useAuth } from "@/contexts/auth-context";
import { useEditorWithHistory } from "@/lib/edit-history/edit-history-hooks";
import { editor } from 'monaco-editor';
import { Monaco, EditorInstance } from "./types";
import { useUIStore } from "@/lib/state/ui-store";

// Storage key for cursor positions
const CURSOR_POSITIONS_KEY = "noteEditorCursorPositions";

// Types for cursor position tracking
interface CursorPosition {
  line: number;
  column: number;
  timestamp: number;
}

type CursorPositions = Record<number, CursorPosition>;

/**
 * Main hook for editor state management - consolidates multiple editor-related hooks
 */
export function useUnifiedEditorState(
  note: Note,
  onChange: (content: string) => void,
  onSave: () => void
) {
  // Theme and font states
  const { theme } = useTheme();
  const { fontType } = useFont();
  const isDarkTheme = theme === 'dark';
  const { isAdmin, user } = useAuth();
  
  // Get editor preferences from UI store
  const useMonacoEditor = useUIStore(state => state.useMonacoEditor);
  const setUseMonacoEditor = useUIStore(state => state.setUseMonacoEditor);
  
  // Editor states
  const [renderHTML, setRenderHTML] = useState(false);
  const [editorInstance, setEditorInstance] = useState<EditorInstance | null>(null);
  
  // References
  const lastCursorPositionRef = useRef<{ start: number; end: number }>({ start: 0, end: 0 });
  const isUpdatingRef = useRef(false);
  const prevNoteIdRef = useRef<number | null>(null);

  // Font family based on context
  const fontFamily = useMemo(() => {
    return fontType === 'mono' ? GeistMono.style.fontFamily : GeistSans.style.fontFamily;
  }, [fontType]);
  
  const fontFamilyClass = fontType === 'mono' ? GeistMono.className : GeistSans.className;

  // Integrate with edit history
  const { handleContentChange, handleSave } = useEditorWithHistory(
    note,
    onChange,
    onSave,
    isAdmin,
    user
  );

  // Toggle editor mode
  const toggleEditorMode = () => {
    setUseMonacoEditor(!useMonacoEditor);
  };

  // Toggle preview mode
  const togglePreview = () => {
    setRenderHTML(!renderHTML);
  };
  
  // Cursor position management
  useEffect(() => {
    if (!editorInstance || !note?.id) return;
    
    // Save cursor position when editor changes or component unmounts
    const saveCursorPosition = () => {
      try {
        const position = editorInstance.getPosition();
        if (position) {
          const positions = getStoredCursorPositions();
          positions[note.id] = {
            line: position.lineNumber,
            column: position.column,
            timestamp: Date.now(),
          };
          
          cleanupOldPositions(positions);
          localStorage.setItem(CURSOR_POSITIONS_KEY, JSON.stringify(positions));
        }
      } catch (e) {
        console.error("Failed to save cursor position:", e);
      }
    };

    // Restore cursor position when note changes
    const restoreCursorPosition = () => {
      try {
        if (prevNoteIdRef.current !== note.id) {
          const positions = getStoredCursorPositions();
          const savedPosition = positions[note.id];
          
          if (savedPosition) {
            editorInstance.setPosition({
              lineNumber: savedPosition.line,
              column: savedPosition.column
            });
            editorInstance.revealPositionInCenter({
              lineNumber: savedPosition.line,
              column: savedPosition.column
            });
          }
        }
      } catch (e) {
        console.error("Failed to restore cursor position:", e);
      }
    };
    
    // Set up position saving on editor changes
    const disposable = editorInstance.onDidChangeCursorPosition(() => {
      saveCursorPosition();
    });
    
    // Reset undo/redo stack when switching to a different note
    if (prevNoteIdRef.current !== note.id) {
      try {
        const monaco = (window as any).monaco;
        if (monaco) {
          // Optimize model creation and disposal
          const model = editorInstance.getModel();
          if (model) {
            // Store the current model in a cache for faster retrieval if we return to this note
            const modelCache = (window as any).__noteModelsCache = (window as any).__noteModelsCache || {};
            
            // Save the current model to cache if it's not already there
            if (prevNoteIdRef.current) {
              modelCache[prevNoteIdRef.current] = model;
            }
            
            // Check if we already have a model for this note
            if (modelCache[note.id]) {
              try {
                // Use the cached model
                editorInstance.setModel(modelCache[note.id]);
                // Focus the editor after a short delay to ensure the DOM is ready
                setTimeout(() => {
                  try {
                    if (editorInstance && document.contains(editorInstance.getDomNode())) {
                      editorInstance.focus();
                    }
                  } catch (focusError) {
                    // Suppress focus errors
                  }
                }, 50);
              } catch (modelError) {
                // Handle model errors silently
                delete modelCache[note.id]; // Remove invalid model from cache
                try {
                  // Create a new model as fallback
                  const content = note.content || '';
                  const newModel = monaco.editor.createModel(content, 'markdown');
                  editorInstance.setModel(newModel);
                  modelCache[note.id] = newModel;
                } catch (fallbackError) {
                  // Last resort - just log and continue
                }
              }
            } else {
              // Create a new model with the note content
              try {
                const language = model.getLanguageId();
                const content = note.content || '';
                const newModel = monaco.editor.createModel(content, language);
                editorInstance.setModel(newModel);
                
                // Store in cache
                modelCache[note.id] = newModel;
              } catch (createError) {
                // Suppress model creation errors
              }
            }
          }
        }
      } catch (error) {
        // Catch all errors to prevent console spam
      }
    }
    
    // Restore position if needed
    restoreCursorPosition();
    prevNoteIdRef.current = note.id;
    
    return () => {
      saveCursorPosition();
      disposable.dispose();
    };
  }, [editorInstance, note?.id]);

  return {
    // States
    renderHTML,
    useMonacoEditor,
    isDarkTheme,
    editorInstance,
    fontFamily,
    fontFamilyClass,
    
    // References
    lastCursorPositionRef,
    isUpdatingRef,
    
    // Actions
    setEditorInstance,
    toggleEditorMode,
    togglePreview,
    handleContentChange,
    handleSave
  };
}

// Helper functions for cursor position management
function getStoredCursorPositions(): CursorPositions {
  try {
    const stored = localStorage.getItem(CURSOR_POSITIONS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function cleanupOldPositions(positions: CursorPositions): void {
  // Clean up old positions (older than 30 days)
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  Object.keys(positions).forEach((key) => {
    const position = positions[parseInt(key)];
    if (position.timestamp < thirtyDaysAgo) {
      delete positions[parseInt(key)];
    }
  });
}

/**
 * Hook for Monaco editor configuration
 */
export function useMonacoConfig(
  editorInstance: EditorInstance | null,
  onSave: () => void,
  isDarkTheme: boolean,
  fontFamily?: string
) {
  // Configure editor when instance is available
  useEffect(() => {
    if (!editorInstance) return;
    
    // Configure Monaco options
    editorInstance.updateOptions({
      fontFamily: fontFamily || 'var(--font-mono)',
      fontSize: 14,
      lineHeight: 1.6,
      minimap: { enabled: false },
      padding: { top: 16 },
      folding: true,
      wordWrap: 'on',
      wrappingStrategy: 'advanced',
      wordWrapBreakAfterCharacters: ' \t',
      wordWrapBreakBeforeCharacters: ' \t',
      autoClosingBrackets: 'always',
      autoClosingQuotes: 'always',
      autoIndent: 'full',
      cursorBlinking: 'smooth',
      cursorSmoothCaretAnimation: 'on',
      scrollBeyondLastLine: true,
      smoothScrolling: true,
      theme: isDarkTheme ? 'vs-dark' : 'vs'
    });
    
  }, [editorInstance, isDarkTheme, fontFamily]);
  
  // Configure shortcuts when monaco is initialized
  const handleEditorDidMount = (monaco: Monaco, editor: EditorInstance) => {
    // Add shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onSave();
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyZ, () => {
      editor.trigger('keyboard', 'undo', null);
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyZ, () => {
      editor.trigger('keyboard', 'redo', null);
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Space, () => {
      editor.trigger('keyboard', 'editor.action.triggerSuggest', null);
    });

    // Configure markdown specific features
    if (monaco.languages && monaco.languages.setLanguageConfiguration) {
      // Configure markdown language features if needed
    }
  };
  
  return { handleEditorDidMount };
}
