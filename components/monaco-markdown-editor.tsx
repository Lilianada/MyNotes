"use client";

import React, { useRef, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import type { editor } from 'monaco-editor';
import type { Note } from "@/types";
import { useMonacoThemes } from '@/hooks/use-monaco-themes';
import { useTheme } from 'next-themes';
import { configureMarkdownLanguage, configureWikiLinkCompletion } from '@/lib/monaco-markdown';
import { useNotes } from "@/contexts/note-context";
import type { OnMount } from '@monaco-editor/react';

// Dynamically import Monaco Editor with no SSR
const Editor = dynamic(
  () => import('@monaco-editor/react').then(mod => mod.default),
  { ssr: false }
);

interface MonacoEditorProps {
  note: Note;
  onChange: (content: string) => void;
  onSave: () => void;
}

// Full Monaco interface including needed properties
interface Monaco {
  editor: typeof editor;
  languages: any;
  KeyMod: any;
  KeyCode: any;
  Range: any;
  Position: any;
  [key: string]: any;
}

const MonacoMarkdownEditor: React.FC<MonacoEditorProps> = ({ note, onChange, onSave }) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const { theme } = useTheme();
  const { notes } = useNotes();
  
  // Extract note titles for autocompletion
  const noteTitles = notes.map(n => n.noteTitle).filter(title => title !== note.noteTitle);
  
  // Load custom Monaco themes
  useMonacoThemes();

  // Handle editor mounting
  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    setIsEditorReady(true);
    
    // Focus the editor when mounted
    editor.focus();
    
    // Configure the enhanced Markdown language support
    configureMarkdownLanguage(monaco);
    
    // Configure wiki-style links completion
    configureWikiLinkCompletion(monaco, noteTitles);
    
    // Add custom auto-pair completions
    configureBracketPairing(monaco);
    
    // Add custom keybindings
    configureKeybindings(editor, monaco);
  };

  // Configure auto-pairing for brackets, parentheses, and backticks
  const configureBracketPairing = (monaco: Monaco) => {
    // Monaco already handles auto-pairing for [], {}, and ()
    // We need to add custom support for backticks
    monaco.languages.setLanguageConfiguration('markdown', {
      autoClosingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '`', close: '`' }, // Add backticks
        { open: '*', close: '*' },
        { open: '_', close: '_' },
      ],
      surroundingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '`', close: '`' }, // Add backticks
        { open: '*', close: '*' },
        { open: '_', close: '_' },
        { open: '\'', close: '\'' },
        { open: '"', close: '"' },
      ]
    });
  };

  // Configure keyboard shortcuts
  const configureKeybindings = (editor: editor.IStandaloneCodeEditor, monaco: Monaco) => {
    // Ctrl+S or Cmd+S to save
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
      () => {
        onSave();
      }
    );
    
    // Bold - Ctrl+B
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB,
      () => {
        const selection = editor.getSelection();
        if (!selection) return;
        
        const model = editor.getModel();
        if (!model) return;
        
        const selectedText = model.getValueInRange(selection);
        
        // If text is selected, wrap it in **
        if (selectedText) {
          editor.executeEdits('', [
            {
              range: selection,
              text: `**${selectedText}**`
            }
          ]);
          
          // Adjust selection to include the **
          editor.setSelection({
            startLineNumber: selection.startLineNumber,
            startColumn: selection.startColumn,
            endLineNumber: selection.endLineNumber,
            endColumn: selection.endColumn + 4 // Add 4 for the ** at start and end
          });
        } else {
          // If no text is selected, insert ** and place cursor between them
          const position = selection.getPosition();
          editor.executeEdits('', [
            {
              range: {
                startLineNumber: position.lineNumber,
                startColumn: position.column,
                endLineNumber: position.lineNumber,
                endColumn: position.column
              },
              text: '****'
            }
          ]);
          
          // Place cursor between the ** and **
          editor.setPosition({
            lineNumber: position.lineNumber,
            column: position.column + 2
          });
        }
      }
    );
    
    // Italic - Ctrl+I
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyI,
      () => {
        const selection = editor.getSelection();
        if (!selection) return;
        
        const model = editor.getModel();
        if (!model) return;
        
        const selectedText = model.getValueInRange(selection);
        
        // If text is selected, wrap it in *
        if (selectedText) {
          editor.executeEdits('', [
            {
              range: selection,
              text: `*${selectedText}*`
            }
          ]);
          
          // Adjust selection to include the *
          editor.setSelection({
            startLineNumber: selection.startLineNumber,
            startColumn: selection.startColumn,
            endLineNumber: selection.endLineNumber,
            endColumn: selection.endColumn + 2 // Add 2 for the * at start and end
          });
        } else {
          // If no text is selected, insert ** and place cursor between them
          const position = selection.getPosition();
          editor.executeEdits('', [
            {
              range: {
                startLineNumber: position.lineNumber,
                startColumn: position.column,
                endLineNumber: position.lineNumber,
                endColumn: position.column
              },
              text: '**'
            }
          ]);
          
          // Place cursor between the *
          editor.setPosition({
            lineNumber: position.lineNumber,
            column: position.column + 1
          });
        }
      }
    );
    
    // Code - Ctrl+K
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK,
      () => {
        const selection = editor.getSelection();
        if (!selection) return;
        
        const model = editor.getModel();
        if (!model) return;
        
        const selectedText = model.getValueInRange(selection);
        
        // If text is selected, wrap it in `
        if (selectedText) {
          editor.executeEdits('', [
            {
              range: selection,
              text: `\`${selectedText}\``
            }
          ]);
          
          // Adjust selection to include the backticks
          editor.setSelection({
            startLineNumber: selection.startLineNumber,
            startColumn: selection.startColumn,
            endLineNumber: selection.endLineNumber,
            endColumn: selection.endColumn + 2 // Add 2 for the ` at start and end
          });
        } else {
          // If no text is selected, insert `` and place cursor between them
          const position = selection.getPosition();
          editor.executeEdits('', [
            {
              range: {
                startLineNumber: position.lineNumber,
                startColumn: position.column,
                endLineNumber: position.lineNumber,
                endColumn: position.column
              },
              text: '``'
            }
          ]);
          
          // Place cursor between the backticks
          editor.setPosition({
            lineNumber: position.lineNumber,
            column: position.column + 1
          });
        }
      }
    );
    
    // Special handling for triple backticks
    editor.onKeyDown((e) => {
      if (e.keyCode === monaco.KeyCode.Backquote) {
        const selection = editor.getSelection();
        if (!selection) return;
        
        const model = editor.getModel();
        if (!model) return;
        
        const position = selection.getPosition();
        const lineContent = model.getLineContent(position.lineNumber);
        const column = position.column - 1;
        
        // Check if the previous two characters are backticks
        if (
          column >= 2 && 
          lineContent.charAt(column - 1) === '`' && 
          lineContent.charAt(column - 2) === '`'
        ) {
          e.preventDefault();
          editor.executeEdits('', [
            {
              range: {
                startLineNumber: position.lineNumber,
                startColumn: position.column - 2,
                endLineNumber: position.lineNumber,
                endColumn: position.column
              },
              text: ''
            },
            {
              range: {
                startLineNumber: position.lineNumber,
                startColumn: position.column - 2,
                endLineNumber: position.lineNumber,
                endColumn: position.column - 2
              },
              text: '```\n\n```'
            }
          ]);
          
          // Position cursor between the triple backticks
          editor.setPosition({
            lineNumber: position.lineNumber + 1,
            column: 1
          });
        }
      }
    });
  };

  // Configure special character transformations
  useEffect(() => {
    if (!isEditorReady || !editorRef.current || !monacoRef.current) return;
    
    const monaco = monacoRef.current;
    const editor = editorRef.current;
    
    // Add event listener for text changes
    const disposable = editor.onDidChangeModelContent((e) => {
      const model = editor.getModel();
      if (!model) return;
      
      const position = editor.getPosition();
      if (!position) return;
      
      const lineContent = model.getLineContent(position.lineNumber);
      const column = position.column - 1;
      
      // Convert -> to → (right arrow)
      if (column >= 2 && 
          lineContent.charAt(column - 1) === '>' && 
          lineContent.charAt(column - 2) === '-') {
        
        // Make sure we're not inside a code block
        if (!isInCodeBlock(model, position.lineNumber)) {
          // Replace -> with →
          editor.executeEdits('transform-arrow', [{
            range: {
              startLineNumber: position.lineNumber,
              startColumn: column - 1,
              endLineNumber: position.lineNumber,
              endColumn: column + 1
            },
            text: '→'
          }]);
        }
      }
      
      // Convert -- to — (em dash)
      if (column >= 2 && 
          lineContent.charAt(column - 1) === '-' && 
          lineContent.charAt(column - 2) === '-' &&
          (column === 2 || lineContent.charAt(column - 3) !== '-') && // not part of ---
          (column === lineContent.length || lineContent.charAt(column) !== '-')) { // not part of ---
        
        // Make sure we're not inside a code block
        if (!isInCodeBlock(model, position.lineNumber)) {
          // Replace -- with —
          editor.executeEdits('transform-emdash', [{
            range: {
              startLineNumber: position.lineNumber,
              startColumn: column - 1,
              endLineNumber: position.lineNumber,
              endColumn: column + 1
            },
            text: '—'
          }]);
        }
      }
      
      // Keep the original onChange handler for parent component
      const content = model.getValue();
      onChange(content);
    });
    
    // Helper function to check if the current position is inside a code block
    function isInCodeBlock(model: editor.ITextModel, lineNumber: number): boolean {
      let inCodeBlock = false;
      
      // Check previous lines for an opening code block marker
      for (let i = lineNumber; i >= 1; i--) {
        const line = model.getLineContent(i).trim();
        
        // Found a closing marker before an opening one - not in a code block
        if (line === '```' && inCodeBlock === false) {
          return false;
        }
        
        // Found an opening marker first - we're in a code block
        if (line.startsWith('```') && inCodeBlock === false) {
          return true;
        }
        
        // Toggle code block state when we find backtick markers
        if (line === '```' || line.startsWith('```')) {
          inCodeBlock = !inCodeBlock;
        }
      }
      
      return inCodeBlock;
    }
    
    // Cleanup
    return () => {
      disposable.dispose();
    };
  }, [isEditorReady, onChange]);

  return (
    <div className="w-full h-full monaco-editor-container">
      <Editor
        height="100%"
        defaultLanguage="markdown"
        value={note.content}
        theme={theme === 'dark' ? 'myNotes-dark' : 'myNotes-light'}
        options={{
          fontSize: 14,
          lineHeight: 24,
          wordWrap: 'on',
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          folding: true,
          lineNumbers: 'on',
          renderLineHighlight: 'all',
          automaticLayout: true,
          padding: { top: 16, bottom: 16 },
          suggest: {
            snippetsPreventQuickSuggestions: false,
            showWords: true,
            showIcons: true,
          },
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnEnter: 'on',
          quickSuggestions: {
            other: true,
            comments: true,
            strings: true
          },
          cursorStyle: 'line',
          cursorBlinking: 'smooth',
          scrollbar: {
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
          },
          fontLigatures: true,
          contextmenu: true,
          formatOnType: true,
          formatOnPaste: true,
          matchBrackets: 'always',
          autoIndent: 'full',
        }}
        onMount={handleEditorDidMount}
      />
    </div>
  );
};

export default MonacoMarkdownEditor;
