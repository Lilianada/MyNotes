"use client";

import { configureMarkdownTokens } from './monaco-markdown-tokens';
import { configureMarkdownCompletions } from './monaco-markdown-completions';
import { configureWikiLinkCompletion } from './monaco-wiki-links';
import { configureMarkdownTheme } from './monaco-markdown-theme';

// Main configuration function that orchestrates all Monaco markdown features
export function configureMarkdownLanguage(monaco: any) {
  // Skip if running on server
  if (typeof window === 'undefined') return;
  
  // Configure syntax highlighting and tokenization
  configureMarkdownTokens(monaco);
  
  // Configure markdown themes
  configureMarkdownTheme(monaco);
  
  // Configure markdown completion providers
  configureMarkdownCompletions(monaco);
}

// Re-export wiki link configuration for external use
export { configureWikiLinkCompletion };
