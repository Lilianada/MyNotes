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
  editor.updateOptions({
    fontFamily: fontFamily || 'var(--font-mono)',
    fontSize: 14,
    lineHeight: 24,
    wordWrap: 'on',
    wrappingIndent: 'same',
    lineNumbers: 'on',
    renderLineHighlight: 'all',
    scrollBeyondLastLine: false,
    minimap: { enabled: false },
    scrollbar: {
      vertical: 'visible',
      horizontalScrollbarSize: 8,
      verticalScrollbarSize: 8
    },
    padding: {
      top: 16,
      bottom: 16
    },
    fontLigatures: true,
    tabSize: 2,
  });
}
