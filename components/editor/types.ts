import type { editor } from 'monaco-editor';
import type { Note } from "@/types";
import type { OnMount } from '@monaco-editor/react';

// Props for the Monaco Editor component
export interface MonacoEditorProps {
  note: Note;
  onChange: (content: string) => void;
  onSave: () => void;
}

// Full Monaco interface including needed properties
export interface Monaco {
  editor: typeof editor;
  languages: any;
  KeyMod: any;
  KeyCode: any;
  Range: any;
}

// Editor instance type
export type EditorInstance = editor.IStandaloneCodeEditor;
