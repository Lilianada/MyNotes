# Unified Editor Documentation

## Overview

The Unified Editor component replaces the previous fragmented editor implementation with a more cohesive, maintainable approach. This document explains the changes and best practices for working with the new editor.

## Key Components

### 1. UnifiedEditor Component (`unified-editor.tsx`)

This is the main component that integrates:
- Monaco editor for rich markdown editing
- Plain text editor as a fallback option
- Markdown preview rendering
- Title editing
- Word count display

```tsx
<UnifiedEditor
  note={note}
  onChange={handleContentChange}
  onSave={handleSave}
  onUpdateTitle={handleUpdateTitle}
  ref={editorRef}
/>
```

### 2. Unified Editor Hooks (`unified-editor-hooks.ts`)

This file consolidates all editor-related hooks into two main hooks:

#### `useUnifiedEditorState(note, onChange, onSave)`

Manages all editor state including:
- Editor mode (Monaco vs plain text)
- Preview mode
- Cursor position tracking
- Edit history integration

#### `useMonacoConfig(editorInstance, onSave, isDarkTheme, fontFamily)`

Handles Monaco-specific configuration:
- Editor options
- Keyboard shortcuts
- Theme integration

## Best Practices

1. **Direct Imports**:
   ```tsx
   // Recommended:
   import { UnifiedEditor } from '@/components/editor'
   
   // Avoid:
   import { UnifiedEditor } from '@/components/editor/unified-editor'
   ```

2. **Editor State Management**:
   - Use `useUnifiedEditorState` for all editor state management
   - Avoid creating separate state for editor properties

3. **File Structure**:
   - Keep all editor-specific code in the `components/editor` directory
   - Use the index exports for all public components and hooks

4. **File Size Limits**:
   - All files should remain under 250 lines
   - Split functionality if a file grows beyond this limit

## Implementation Details

### Editor State Flow

```
UnifiedEditor Component
  │
  ├─ useUnifiedEditorState (manages all state)
  │    │
  │    ├─ useEditorWithHistory (for edit history)
  │    │
  │    └─ Cursor position tracking
  │
  └─ useMonacoConfig (Monaco-specific configuration)
```

### Code Organization

1. **Core Components**:
   - `unified-editor.tsx`: Main editor component
   - `unified-editor-hooks.ts`: All editor hooks
   - `types.ts`: TypeScript interfaces and types

2. **Integration**:
   - `context-note-editor.tsx`: Integrates editor with note context
   - `index.ts`: Public exports

## Migration Guide

To migrate from the old editor components:

1. Replace imports:
   ```tsx
   // Old
   import NoteEditor from '@/components/editor/note-editor'
   
   // New
   import { UnifiedEditor } from '@/components/editor'
   ```

2. Replace component usage:
   ```tsx
   // Old
   <NoteEditor note={note} onChange={handleChange} />
   
   // New
   <UnifiedEditor note={note} onChange={handleChange} />
   ```

3. If using editor-specific hooks, replace with unified hooks:
   ```tsx
   // Old
   const { handleContentChange } = useEditorWithHistory(...)
   
   // New
   const { handleContentChange } = useUnifiedEditorState(...)
   ```
