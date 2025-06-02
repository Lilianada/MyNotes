"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { useFont } from '@/contexts/font-context';
import { useMonacoThemes } from '@/hooks/use-monaco-themes';
import { useNotes } from "@/contexts/notes/note-context";
import { configureMarkdownLanguage } from '@/lib/markdown/monaco-markdown-completions';
import { configureWikiLinkCompletion } from '@/lib/markdown/monaco-wiki-links';
import { MonacoEditorProps, Monaco, EditorInstance } from './types';
import { 
  configureEditorShortcuts, 
  configureBracketCompletion,  
  configureEditorOptions 
} from './editor-config';
import { useEditorCursorState } from './editor-hooks';

// Dynamically import Monaco Editor with no SSR
const Editor = dynamic(
  () => import('@monaco-editor/react').then(mod => mod.default),
  { ssr: false }
);

export function MonacoMarkdownEditor({ note, onChange, onSave }: MonacoEditorProps): JSX.Element {
  const { theme } = useTheme();
  const { fontType } = useFont();
  const isDarkTheme = theme === 'dark';
  const { notes } = useNotes();
  const { defineMonacoThemes } = useMonacoThemes();
  const [editorInstance, setEditorInstance] = React.useState<EditorInstance | null>(null);

  // Get the appropriate font family based on font context
  const fontFamily = React.useMemo(() => {
    return fontType === 'mono' ? GeistMono.style.fontFamily : GeistSans.style.fontFamily;
  }, [fontType]);

  // Manage cursor position and restoration (replaces useEditorFocus and previousContent logic)
  useEditorCursorState(editorInstance, note.id);

  // Update editor font and mobile settings when font type or window size changes
  React.useEffect(() => {
    if (editorInstance) {
      configureEditorOptions(editorInstance, isDarkTheme, fontFamily);
    }

    const handleResize = () => {
      if (editorInstance) {
        setTimeout(() => {
          configureEditorOptions(editorInstance, isDarkTheme, fontFamily);
          editorInstance.layout();
        }, 100);
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [editorInstance, isDarkTheme, fontFamily]);

  // Handle editor mounting
  const handleEditorDidMount = (editor: EditorInstance, monaco: Monaco) => {
    setEditorInstance(editor);

    // Configure Monaco editor
    configureEditorOptions(editor, isDarkTheme, fontFamily);
    configureEditorShortcuts(monaco, editor, onSave);
    configureBracketCompletion(editor);

    // Configure markdown language features
    configureMarkdownLanguage(monaco);
    configureWikiLinkCompletion(monaco, notes.map(note => note.noteTitle));
  };

  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
        language="markdown"
        value={note.content}
        onChange={(value) => {
          if (value !== undefined) {
            onChange(value);
          }
        }}
        theme={isDarkTheme ? 'markdown-theme-dark' : 'markdown-theme'}
        options={{
          wordWrap: 'on',
          minimap: { enabled: false },
          fontSize: typeof window !== 'undefined' && window.innerWidth < 768 ? 16 : 14,
          lineNumbers: typeof window !== 'undefined' && window.innerWidth < 768 ? 'off' : 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          scrollbar: {
            verticalScrollbarSize: typeof window !== 'undefined' && window.innerWidth < 768 ? 12 : 8,
            horizontalScrollbarSize: typeof window !== 'undefined' && window.innerWidth < 768 ? 12 : 8,
          },
          quickSuggestions: true,
          parameterHints: { enabled: true },
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnEnter: typeof window !== 'undefined' && window.innerWidth < 768 ? 'smart' : 'on',
          suggest: {
            showWords: true,
            showSnippets: true,
            showKeywords: true,
            showFunctions: true,
            showVariables: true,
            showClasses: true,
            showModules: true,
            showProperties: true,
            insertMode: 'insert'
          }
        }}
        beforeMount={monaco => {
          configureMarkdownLanguage(monaco);
        }}
        onMount={handleEditorDidMount}
      />
    </div>
  );
}

export default MonacoMarkdownEditor;