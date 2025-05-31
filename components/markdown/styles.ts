/**
 * Centralized markdown styles configuration
 * 
 * This module provides utilities and configurations for markdown styling.
 * The actual CSS styles are defined in /app/markdown.css and imported globally.
 */

// CSS class names used by markdown components
export const MARKDOWN_CSS_CLASSES = {
  // Main container
  markdownBody: 'markdown-body',
  
  // Code styles
  inlineCode: 'inline-code',
  blockCode: 'block-code',
  
  // Task lists
  taskList: 'task-list',
  taskListItem: 'task-list-item',
  
  // Links
  backlink: 'backlink',
  internalLink: 'internal-link',
  
  // Special characters
  arrowCharacter: 'arrow-character',
  
  // Code blocks
  codeBlockWrapper: 'code-block-wrapper',
  languageBadge: 'language-badge',
} as const;

/**
 * CSS selector constants for targeting markdown elements
 */
export const MARKDOWN_SELECTORS = {
  // Headers
  headers: '.markdown-body h1, .markdown-body h2, .markdown-body h3, .markdown-body h4, .markdown-body h5, .markdown-body h6',
  
  // Text formatting
  bold: '.markdown-body strong',
  italic: '.markdown-body em',
  strikethrough: '.markdown-body del',
  
  // Code
  inlineCode: 'code.inline-code',
  codeBlocks: 'pre code',
  
  // Lists
  lists: '.markdown-body ul, .markdown-body ol',
  listItems: '.markdown-body li',
  taskLists: 'ul.task-list',
  taskListItems: 'li.task-list-item',
  
  // Links and references
  backlinks: '.backlink',
  internalLinks: 'a.internal-link',
  
  // Tables
  tables: '.markdown-body table',
  tableHeaders: '.markdown-body table th',
  tableCells: '.markdown-body table td',
  
  // Blockquotes
  blockquotes: '.markdown-body blockquote',
} as const;

/**
 * Typography configuration used in markdown styles
 */
export const MARKDOWN_TYPOGRAPHY = {
  // Font sizes
  baseFontSize: '14px',
  h1Size: '1.5rem',
  h2Size: '1.25rem',
  h3Size: '1.125rem',
  h4Size: '1rem',
  h5Size: '0.875rem',
  h6Size: '0.75rem',
  
  // Line heights
  baseLineHeight: 1.6,
  headerLineHeight: 1.4,
  listLineHeight: 1.5,
  
  // Font weights
  headerWeight: 700,
  boldWeight: 'bold',
  
  // Colors (matching the CSS)
  h1Color: '#4338ca',
  h2Color: '#1d4ed8',
  h3Color: '#0891b2',
  h4Color: '#0d9488',
  h5Color: '#16a34a',
  h6Color: '#059669',
  boldColor: '#d97706',
  italicColor: '#b45309',
  strikethroughColor: '#6b7280',
  arrowColor: '#3b82f6',
  
  // Code colors
  inlineCodeBg: '#fef2f2',
  inlineCodeColor: '#b91c1c',
  inlineCodeBorder: '#fecaca',
  blockCodeBg: '#f5f7f9',
  blockCodeBorder: '#e5e7eb',
  
  // Backlink colors
  backlinkBg: '#e0f2fe',
  backlinkColor: '#0369a1',
  backlinkBorder: '#bae6fd',
  backlinkHoverBg: '#bae6fd',
  backlinkHoverBorder: '#0ea5e9',
  
  // Internal link colors
  internalLinkColor: '#2563eb',
  internalLinkBg: '#eff6ff',
  internalLinkHoverBg: '#dbeafe',
} as const;

/**
 * Utility function to get the main markdown body class name
 */
export function getMarkdownBodyClass(): string {
  return MARKDOWN_CSS_CLASSES.markdownBody;
}

/**
 * Utility function to combine markdown class names
 */
export function combineMarkdownClasses(...classes: string[]): string {
  return [MARKDOWN_CSS_CLASSES.markdownBody, ...classes].filter(Boolean).join(' ');
}
