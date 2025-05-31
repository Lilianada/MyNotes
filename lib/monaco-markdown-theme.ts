"use client";

/**
 * Monaco editor theme configuration for markdown
 */

export function configureMarkdownTheme(monaco: any) {
  // Skip if running on server
  if (typeof window === 'undefined') return;

  // Define custom markdown theme
  monaco.editor.defineTheme('markdown-theme', {
    base: 'vs',
    inherit: true,
    rules: [
      // Headers
      { token: 'keyword.md', foreground: '4338ca', fontStyle: 'bold' },
      
      // Bold text
      { token: 'strong', foreground: 'd97706', fontStyle: 'bold' },
      
      // Italic text
      { token: 'emphasis', foreground: 'b45309', fontStyle: 'italic' },
      
      // Inline code
      { token: 'variable.source.md', foreground: 'b91c1c', background: 'fef2f2' },
      
      // Links
      { token: 'string.link.md', foreground: '2563eb' },
      { token: 'string.link.text.md', foreground: '1d4ed8' },
      { token: 'variable.link.md', foreground: '1e40af' },
      
      // Backlinks - special styling
      { token: 'string.backlink.md', foreground: '0369a1', background: 'e0f2fe' },
      
      // Images
      { token: 'string.link.image.md', foreground: '059669' },
      
      // Blockquotes
      { token: 'string.md', foreground: '6b7280', fontStyle: 'italic' },
      
      // Lists
      { token: 'keyword.md', foreground: '374151' },
      
      // Code language
      { token: 'keyword.md', foreground: '4b5563' },
      
      // Special characters
      { token: 'special-character', foreground: '3b82f6' },
    ],
    colors: {
      'editor.background': '#ffffff',
      'editor.foreground': '#374151',
      'editorLineNumber.foreground': '#9ca3af',
      'editorCursor.foreground': '#374151',
      'editor.selectionBackground': '#dbeafe',
    }
  });

  // Define dark markdown theme
  monaco.editor.defineTheme('markdown-theme-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      // Headers
      { token: 'keyword.md', foreground: '8b5cf6', fontStyle: 'bold' },
      
      // Bold text
      { token: 'strong', foreground: 'f59e0b', fontStyle: 'bold' },
      
      // Italic text
      { token: 'emphasis', foreground: 'f97316', fontStyle: 'italic' },
      
      // Inline code
      { token: 'variable.source.md', foreground: 'ef4444', background: '1f2937' },
      
      // Links
      { token: 'string.link.md', foreground: '60a5fa' },
      { token: 'string.link.text.md', foreground: '3b82f6' },
      { token: 'variable.link.md', foreground: '2563eb' },
      
      // Backlinks - special styling for dark mode
      { token: 'string.backlink.md', foreground: '0ea5e9', background: '0c4a6e' },
      
      // Images
      { token: 'string.link.image.md', foreground: '10b981' },
      
      // Blockquotes
      { token: 'string.md', foreground: '9ca3af', fontStyle: 'italic' },
      
      // Lists
      { token: 'keyword.md', foreground: 'd1d5db' },
      
      // Special characters
      { token: 'special-character', foreground: '60a5fa' },
    ],
    colors: {
      'editor.background': '#1f2937',
      'editor.foreground': '#e5e7eb',
      'editorLineNumber.foreground': '#6b7280',
      'editorCursor.foreground': '#e5e7eb',
      'editor.selectionBackground': '#374151',
    }
  });
}
