# Editor Component Simplification Plan

The current editor implementation is split across multiple files with overlapping functionality:
- `note-editor.tsx` (322 lines)
- `monaco-markdown-editor.tsx` (158 lines)
- `editor-config.ts` (92 lines)
- `editor-shortcuts.tsx`
- `editor-hooks.ts`
- `types.ts`

This creates unnecessary complexity and makes maintenance difficult.

## Proposed Changes

### 1. Consolidate Editor Components

Merge the following components into a single `unified-editor.tsx`:
- MonacoMarkdownEditor
- NoteEditor 

Benefits:
- Eliminates prop passing between components
- Reduces re-renders and state synchronization issues
- Simplifies the component hierarchy

### 2. Create Focused Utility Files

Transform utility files to be more focused:
- `editor-hooks.ts` → Contains all custom hooks for editor functionality
- `editor-config.ts` → Contains only configuration options
- Remove unnecessary files like `editor-shortcuts.tsx` (merge into main component)

### 3. Simplify Monaco Editor Integration

- Simplify the Monaco editor initialization
- Use more default Monaco settings without custom overrides
- Reduce the complexity of theme handling

### Implementation Steps

1. Create a new `unified-editor.tsx`
2. Extract core functionality from existing components
3. Simplify Monaco configuration and initialization
4. Gradually phase out separated components

### Expected Benefits

- ~40% reduction in editor-related code
- Simpler component structure
- Easier maintenance
- Better performance through fewer re-renders
