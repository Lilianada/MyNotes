import { editor } from 'monaco-editor';
import { EditorInstance, Monaco } from './types';

// Configure keyboard shortcuts for the Monaco Editor
export function configureEditorShortcuts(
  monaco: Monaco,
  editor: EditorInstance,
  onSave: () => void
): void {
  // Add command for saving
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
    onSave();
  });

  // Add command for undo/redo
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyZ, () => {
    editor.trigger('keyboard', 'undo', null);
  });

  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyZ, () => {
    editor.trigger('keyboard', 'redo', null);
  });

  // Add command to manually trigger suggest widget (Ctrl+Space)
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Space, () => {
    editor.trigger('keyboard', 'editor.action.triggerSuggest', null);
  });
}

// Configure auto-completion for brackets
export function configureBracketCompletion(editor: EditorInstance): void {
  // This is handled by Monaco's built-in bracket completion
  // Ensure it's enabled in the editor options
  editor.updateOptions({
    autoClosingBrackets: 'always',
    autoClosingQuotes: 'always'
  });
}

// Configure editor options and appearance
export function configureEditorOptions(
  editor: EditorInstance, 
  isDarkTheme: boolean,
  fontFamily?: string
): void {
  // Monaco editor is now only used on desktop devices
  // Simple editor is used for mobile
  
  editor.updateOptions({
    // Font settings
    fontFamily: fontFamily || 'var(--font-mono)',
    fontSize: 14,
    lineHeight: 24,
    fontLigatures: true,
    
    // Layout settings
    wordWrap: 'on',
    wrappingIndent: 'same',
    lineNumbers: 'on',
    renderLineHighlight: 'all',
    scrollBeyondLastLine: false,
    minimap: { enabled: false },
    
    // Scrollbar settings
    scrollbar: {
      vertical: 'visible',
      horizontalScrollbarSize: 8,
      verticalScrollbarSize: 8,
      alwaysConsumeMouseWheel: false // Prevent scrolling issues
    },
    
    // Padding and spacing
    padding: {
      top: 16,
      bottom: 16
    },
    tabSize: 2,
    
    // Cursor settings - fixed positioning issues
    cursorBlinking: 'solid',
    cursorSmoothCaretAnimation: 'off', // Disabled for better cursor positioning
    cursorWidth: 2,
    cursorStyle: 'line',
    renderValidationDecorations: 'on',
    // Fix cursor positioning by using exact cursor surrogate positioning
    useTabStops: true,
    
    // Code intelligence
    quickSuggestions: true,
    parameterHints: { enabled: true },
    suggestOnTriggerCharacters: true,
    acceptSuggestionOnEnter: 'on',
    suggest: {
      showWords: true,
      showSnippets: true,
      showKeywords: true,
      showFunctions: true,
      showVariables: true,
      showClasses: true,
      showModules: true,
      showProperties: true,
      insertMode: 'insert',
      snippetsPreventQuickSuggestions: false
    },
    
    // Selection and highlighting
    multiCursorModifier: 'alt',
    selectionHighlight: true,
    occurrencesHighlight: true,
    
    // Performance and UX improvements
    fixedOverflowWidgets: true,
    smoothScrolling: true,
    mouseWheelScrollSensitivity: 1.5,
    renderWhitespace: 'none',
  });
}
