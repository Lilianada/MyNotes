"use client";

import { useCallback } from 'react';
import { EditorInstance, Monaco } from './types';
import { configureEditorOptions, configureEditorShortcuts, configureBracketCompletion } from './editor-config';
import { configureMarkdownLanguage } from '@/lib/markdown/monaco-markdown-completions';
import { configureWikiLinkCompletion } from '@/lib/markdown/monaco-wiki-links';

/**
 * Hook to configure Monaco editor with all necessary settings and extensions
 */
export function useMonacoConfig() {
  // Create a callback that will be used when the editor mounts
  const handleEditorDidMount = useCallback((editor: EditorInstance, monaco: Monaco) => {
    // Configure editor with markdown language support
    configureMarkdownLanguage(monaco);
    // Note: We'll configure wiki links with actual note titles in the component
    
    // Configure bracket completion
    configureBracketCompletion(editor);
    
    // Return the editor instance for further configuration
    return editor;
  }, []);

  return { handleEditorDidMount };
}
