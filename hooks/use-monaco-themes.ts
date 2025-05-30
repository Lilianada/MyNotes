"use client";

import { useEffect } from 'react';

// Define the Monaco theme settings
const defineMonacoThemes = (monaco: unknown) => {
  // Skip theme initialization during server-side rendering
  if (typeof window === 'undefined') return;
  
  // Use dynamic import to load Monaco editor only on client side
  // This prevents the build-time error with Next.js SSR
  import('monaco-editor/esm/vs/editor/editor.api')
    .then(monaco => {
  
  // Light theme that matches app design
  monaco.editor.defineTheme('myNotes-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6A737D' },
      { token: 'keyword', foreground: '0366D6', fontStyle: 'bold' },
      { token: 'string', foreground: '28A745' },
      { token: 'number', foreground: '005CC5' },
      
      // Markdown specific tokens
      { token: 'emphasis', fontStyle: 'italic' },
      { token: 'strong', fontStyle: 'bold' },
      { token: 'keyword.md', foreground: '0366D6' }, // Headers #, ##, etc
      { token: 'string.link.md', foreground: '0366D6' }, // Links
      { token: 'variable.md', foreground: '6A737D' }, // Link references
      { token: 'string.md', foreground: '032F62' }, // Quoted text
      { token: 'variable.source.md', foreground: '005CC5' }, // Code blocks
      { token: 'markup.strikethrough', foreground: '6A737D', fontStyle: 'strikethrough' }, // ~~strikethrough~~
    ],
    colors: {
      'editor.foreground': '#24292E',
      'editor.background': '#FFFFFF',
      'editor.lineHighlightBackground': '#F1F8FF',
      'editorCursor.foreground': '#24292E',
      'editor.selectionBackground': '#D7E9FA',
      'editorLineNumber.foreground': '#959DA5',
      'editorLineNumber.activeForeground': '#24292E',
      'editorIndentGuide.background': '#EDF0F2',
      'editorIndentGuide.activeBackground': '#C8DFED',
    }
  });

  // Dark theme that matches app design
  monaco.editor.defineTheme('myNotes-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6A737D' },
      { token: 'keyword', foreground: '79B8FF', fontStyle: 'bold' },
      { token: 'string', foreground: '9ECBFF' },
      { token: 'number', foreground: '79B8FF' },
      
      // Markdown specific tokens
      { token: 'emphasis', fontStyle: 'italic' },
      { token: 'strong', fontStyle: 'bold' },
      { token: 'keyword.md', foreground: '79B8FF' }, // Headers #, ##, etc
      { token: 'string.link.md', foreground: '9ECBFF' }, // Links
      { token: 'variable.md', foreground: '6A737D' }, // Link references
      { token: 'string.md', foreground: 'B3D4FC' }, // Quoted text
      { token: 'variable.source.md', foreground: '79B8FF' }, // Code blocks
      { token: 'markup.strikethrough', foreground: '6A737D', fontStyle: 'strikethrough' }, // ~~strikethrough~~
    ],
    colors: {
      'editor.foreground': '#E1E4E8',
      'editor.background': '#1E1E1E',
      'editor.lineHighlightBackground': '#2B3036',
      'editorCursor.foreground': '#FFFFFF',
      'editor.selectionBackground': '#3F4448',
      'editorLineNumber.foreground': '#6A737D',
      'editorLineNumber.activeForeground': '#E1E4E8',
      'editorIndentGuide.background': '#2F363D',
      'editorIndentGuide.activeBackground': '#444D56',
    }
  });
    })
    .catch(error => {
      console.warn('Error loading Monaco editor:', error);
    });
};

export function useMonacoThemes() {
  useEffect(() => {
    // Only run once when component is mounted
    defineMonacoThemes();
  }, []);

  return { defineMonacoThemes };
};
