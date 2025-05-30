import { Note } from "@/types";

export interface NoteEditorProps {
  note: Note;
  onChange: (content: string) => void;
  onSave: () => void;
  onUpdateTitle: (newTitle: string) => void;
}

export interface EditorStyleProps {
  font?: string;
  fontSize?: string;
  lineSpacing?: string;
}
