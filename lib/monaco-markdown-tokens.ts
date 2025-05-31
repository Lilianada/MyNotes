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
        // Headers (# title) - fixed regex to properly capture all header levels
        [/^(\s{0,3})(#{1,6})(\s+.*?$)/, ['', markdownTokenTypes.header, markdownTokenTypes.header]],
        
        // Code blocks with language ```js code ```
        [/^(\s*)(```)([\w-]*$)/, ['', markdownTokenTypes.codeLang, markdownTokenTypes.codeLang]],
        [/^(\s*)(```\s*)$/, ['', markdownTokenTypes.codeLang]],
        
        // Lists (unordered and ordered)
        [/^(\s*)([\*\-+]|\d+\.)\s+/, ['', markdownTokenTypes.list]],

        // Bold ** **
        [/\*\*([^*]+)\*\*/, markdownTokenTypes.strong],
        // Bold __ __
        [/__([^_]+)__/, markdownTokenTypes.strong],
        
        // Italic * *
        [/\*([^*]+)\*/, markdownTokenTypes.emphasis],
        // Italic _ _
        [/_([^_]+)_/, markdownTokenTypes.emphasis],
        
        // Inline code ` `
        [/`([^`]+)`/, markdownTokenTypes.code],
        
        // Backlinks [[text]]
        [/(\[\[)([^\]]+)(\]\])/, 
          [markdownTokenTypes.backlink, markdownTokenTypes.linkText, markdownTokenTypes.backlink]
        ],
        
        // Links [text](url)
        [/(\[)([^\]]+)(\])(\()([^\)]+)(\))/, 
          [markdownTokenTypes.link, markdownTokenTypes.linkText, markdownTokenTypes.link, markdownTokenTypes.link, markdownTokenTypes.url, markdownTokenTypes.link]
        ],
        
        // Images ![alt](url)
        [/(\!\[)([^\]]+)(\])(\()([^\)]+)(\))/, 
          [markdownTokenTypes.image, markdownTokenTypes.linkText, markdownTokenTypes.image, markdownTokenTypes.image, markdownTokenTypes.url, markdownTokenTypes.image]
        ],
        
        // Blockquotes
        [/^(\s*)(>) .*$/, ['', markdownTokenTypes.quote]],
        
        // Horizontal rule (---, ***, ___)
        [/^(\s*)([-*_]{3,})\s*$/, ['', markdownTokenTypes.hr]],
        
        // Special character transformations
        [/->/, 'special-character'],
        [/--/, 'special-character'],
      ],
    }
  });
}
