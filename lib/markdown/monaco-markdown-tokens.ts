"use client";

/**
 * Monaco markdown token types and syntax highlighting configuration
 */

// Define token types for markdown syntax highlighting
export const markdownTokenTypes = {
  header: 'keyword.md',
  emphasis: 'emphasis',
  strong: 'strong',
  code: 'variable.source.md',
  link: 'string.link.md',
  linkText: 'string.link.text.md',
  image: 'string.link.image.md',
  url: 'variable.link.md',
  quote: 'string.md',
  list: 'keyword.md',
  hr: 'keyword.md',
  comment: 'comment',
  codeBlock: 'variable.source.md',
  codeLang: 'keyword.md',
  backlink: 'string.backlink.md',
};

/**
 * Configure Monaco markdown syntax highlighting tokens
 */
export function configureMarkdownTokens(monaco: any) {
  // Skip if running on server
  if (typeof window === 'undefined') return;
  
  // Configure Monaco for better Markdown editing
  monaco.languages.setMonarchTokensProvider('markdown', {
    tokenizer: {
      root: [
        // Headers (# title) - simplified to avoid grouping issues
        [/^#{1,6}\s+.*$/, markdownTokenTypes.header],
        
        // Code blocks with language ```js code ```
        [/^```[\w-]*$/, markdownTokenTypes.codeLang],
        [/^```\s*$/, markdownTokenTypes.codeLang],
        
        // Lists (unordered and ordered)
        [/^\s*[\*\-+]\s+/, markdownTokenTypes.list],
        [/^\s*\d+\.\s+/, markdownTokenTypes.list],

        // Bold ** ** - match entire pattern
        [/\*\*[^*]+\*\*/, markdownTokenTypes.strong],
        // Bold __ __
        [/__[^_]+__/, markdownTokenTypes.strong],
        
        // Italic * *
        [/\*[^*]+\*/, markdownTokenTypes.emphasis],
        // Italic _ _
        [/_[^_]+_/, markdownTokenTypes.emphasis],
        
        // Inline code ` `
        [/`[^`]+`/, markdownTokenTypes.code],
        
        // Backlinks [[text]] - simplified without groups
        [/\[\[[^\]]+\]\]/, markdownTokenTypes.backlink],
        
        // Links [text](url) - simplified without groups
        [/\[[^\]]+\]\([^\)]+\)/, markdownTokenTypes.link],
        
        // Images ![alt](url) - simplified without groups
        [/!\[[^\]]*\]\([^\)]+\)/, markdownTokenTypes.image],
        
        // Blockquotes - simplified
        [/^\s*>.*$/, markdownTokenTypes.quote],
        
        // Horizontal rule (---, ***, ___)
        [/^\s*[-*_]{3,}\s*$/, markdownTokenTypes.hr],
        
        // Special character transformations
        [/->/, 'special-character'],
        [/--/, 'special-character'],
      ],
    }
  });
}
