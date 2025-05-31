"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { useFont } from '@/contexts/font-context';
import { useMonacoThemes } from '@/hooks/use-monaco-themes';
import { useNotes } from "@/contexts/notes/note-context";
import { configureMarkdownLanguage, configureWikiLinkCompletion } from '@/lib/markdown/monaco-markdown';
import { MonacoEditorProps, Monaco, EditorInstance } from './types';
import { 
  configureEditorShortcuts,
  configureBracketCompletion, 
  configureEditorOptions 
} from './editor-config';
import { useEditorCursorState, useEditorFocus } from './editor-hooks';

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
  const [previousContent, setPreviousContent] = React.useState<string | null>(null);

  // Get the appropriate font family based on font context
  const fontFamily = React.useMemo(() => {
    return fontType === 'mono' ? GeistMono.style.fontFamily : GeistSans.style.fontFamily;
  }, [fontType]);

  // Manage cursor position
  useEditorCursorState(editorInstance, note.content, previousContent);
  
  // Focus editor when note changes
  useEditorFocus(editorInstance, note.id);

  // Update previous content when note changes
  React.useEffect(() => {
    setPreviousContent(note.content);
  }, [note.content]);

  // Update editor font when font type changes
  React.useEffect(() => {
    if (editorInstance) {
      configureEditorOptions(editorInstance, isDarkTheme, fontFamily);
    }
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
            setPreviousContent(value);
          }
        }}
        theme={isDarkTheme ? 'markdown-theme-dark' : 'markdown-theme'}
        options={{
          wordWrap: 'on',
          minimap: { enabled: false },
          fontSize: 14,
        }}
        beforeMount={(monaco) => {
          defineMonacoThemes(monaco);
        }}
        onMount={handleEditorDidMount}
      />
    </div>
  );
}

export default MonacoMarkdownEditor;
