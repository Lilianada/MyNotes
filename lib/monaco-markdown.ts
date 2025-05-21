"use client";

// Safely handle Monaco import for server-side rendering
export function configureMarkdownLanguage(monaco: any) {
  // Skip if running on server
  if (typeof window === 'undefined') return;
  
  // Define token types
  const tokenTypes = {
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
  };

  // Configure Monaco for better Markdown editing
  monaco.languages.setMonarchTokensProvider('markdown', {
    tokenizer: {
      root: [
        // Headers (# title)
        [/^(\s{0,3})(#+)((?=\s)[\s]*[^#].*)/, ['', tokenTypes.header, tokenTypes.header]],
        
        // Code blocks with language ```js code ```
        [/^(\s*)(```)([\w-]*$)/, ['', tokenTypes.codeLang, tokenTypes.codeLang]],
        [/^(\s*)(```\s*)$/, ['', tokenTypes.codeLang]],
        
        // Lists (unordered and ordered)
        [/^(\s*)([\*\-+]|\d+\.)\s+/, ['', tokenTypes.list]],

        // Bold ** **
        [/\*\*([^*]+)\*\*/, tokenTypes.strong],
        // Bold __ __
        [/__([^_]+)__/, tokenTypes.strong],
        
        // Italic * *
        [/\*([^*]+)\*/, tokenTypes.emphasis],
        // Italic _ _
        [/_([^_]+)_/, tokenTypes.emphasis],
        
        // Inline code ` `
        [/`([^`]+)`/, tokenTypes.code],
        
        // Links [text](url)
        [/(\[)([^\]]+)(\])(\()([^\)]+)(\))/, 
          [tokenTypes.link, tokenTypes.linkText, tokenTypes.link, tokenTypes.link, tokenTypes.url, tokenTypes.link]
        ],
        
        // Images ![alt](url)
        [/(\!\[)([^\]]+)(\])(\()([^\)]+)(\))/, 
          [tokenTypes.image, tokenTypes.linkText, tokenTypes.image, tokenTypes.image, tokenTypes.url, tokenTypes.image]
        ],
        
        // Blockquotes
        [/^(\s*)(>) .*$/, ['', tokenTypes.quote]],
        
        // Horizontal rule (---, ***, ___)
        [/^(\s*)([-*_]{3,})\s*$/, ['', tokenTypes.hr]],
        
        // Special character transformations
        [/->/, 'special-character'],
        [/--/, 'special-character'],
      ],
    }
  });

  // Add Markdown-specific completions for snippets
  monaco.languages.registerCompletionItemProvider('markdown', {
    triggerCharacters: ['#', '-', '*', '>', '`', '[', '!'],
    provideCompletionItems: (model: { getWordUntilPosition: (arg0: any) => any; getLineContent: (arg0: any) => any; }, position: { lineNumber: any; column: number; }) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn
      };
      
      const lineContent = model.getLineContent(position.lineNumber);
      const linePrefix = lineContent.substring(0, position.column - 1);
      
      // Create contextual suggestions based on what's being typed
      const suggestions = [];
      
      // Headers
      if (linePrefix.match(/^#\s*$/)) {
        suggestions.push({
          label: '# Heading 1',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'Heading 1',
          range
        });
      } else if (linePrefix.match(/^##\s*$/)) {
        suggestions.push({
          label: '## Heading 2',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'Heading 2',
          range
        });
      } else if (linePrefix.match(/^###\s*$/)) {
        suggestions.push({
          label: '### Heading 3',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'Heading 3',
          range
        });
      }
      
      // Code blocks
      if (linePrefix.match(/^```\s*$/)) {
        suggestions.push({
          label: '```js',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'js\n// JavaScript code\n```',
          range,
          detail: 'JavaScript code block'
        });
        suggestions.push({
          label: '```html',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'html\n<!-- HTML code -->\n```',
          range,
          detail: 'HTML code block'
        });
        suggestions.push({
          label: '```css',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'css\n/* CSS styles */\n```',
          range,
          detail: 'CSS code block'
        });
        suggestions.push({
          label: '```python',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'python\n# Python code\n```',
          range,
          detail: 'Python code block'
        });
      }
      
      // List items
      if (linePrefix.match(/^-\s*$/)) {
        suggestions.push({
          label: '- List item',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'List item',
          range,
          detail: 'Unordered list item'
        });
      }
      
      // Checkbox
      if (linePrefix.match(/^-\s\[\s*$/)) {
        suggestions.push({
          label: '- [ ] Todo item',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: ' ] Todo item',
          range,
          detail: 'Checkbox (unchecked)'
        });
      }
      
      // Links
      if (linePrefix.match(/\[.*\]\(\s*$/)) {
        suggestions.push({
          label: '[text](url)',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'https://',
          range,
          detail: 'Website URL'
        });
      }
      
      // Images
      if (linePrefix.match(/!\[.*\]\(\s*$/)) {
        suggestions.push({
          label: '![alt](image-url)',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'https://',
          range,
          detail: 'Image URL'
        });
      }
      
      // If no contextual matches, provide full snippets
      if (suggestions.length === 0) {
        suggestions.push(
          {
            label: '# Heading 1',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '# ',
            range
          },
          {
            label: '## Heading 2',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '## ',
            range
          },
          {
            label: '### Heading 3',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '### ',
            range
          },
          {
            label: 'Bold',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '**${1:bold text}**',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range
          },
          {
            label: 'Italic',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '*${1:italic text}*',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range
          },
          {
            label: 'Checkbox (unchecked)',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '- [ ] ${1:todo item}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range
          },
          {
            label: 'Checkbox (checked)',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '- [x] ${1:completed item}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range
          },
          {
            label: 'Code block',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '```${1:language}\n${2:code}\n```',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range
          },
          {
            label: 'Blockquote',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '> ${1:quoted text}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range
          },
          {
            label: 'Horizontal Rule',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '\n---\n',
            range
          },
          {
            label: 'Link',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '[${1:link text}](${2:url})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range
          },
          {
            label: 'Image',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '![${1:alt text}](${2:image url})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range
          },
          {
            label: 'Table',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '| ${1:Header} | ${2:Header} |\n| --- | --- |\n| ${3:Data} | ${4:Data} |',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range
          }
        );
      }
      
      return { suggestions };
    }
  });
}

// Configure auto-completion for wiki-style links
export function configureWikiLinkCompletion(monaco: any, noteTitles: string[]) {
  // Skip if running on server
  if (typeof window === 'undefined' || !monaco || !noteTitles || !noteTitles.length) return;
  
  monaco.languages.registerCompletionItemProvider('markdown', {
    triggerCharacters: ['['],
    provideCompletionItems: (model: any, position: any) => {
      // Get text up to the cursor position
      const textUntilPosition = model.getValueInRange({
        startLineNumber: position.lineNumber,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column
      });
      
      // Check if we're in the middle of a wiki link
      const wikiLinkMatch = textUntilPosition.match(/\[\[([^[\]]*?)$/);
      if (!wikiLinkMatch) {
        return { suggestions: [] };
      }
      
      // Filter note titles based on user input
      const filterText = wikiLinkMatch[1].toLowerCase();
      const filteredTitles = noteTitles.filter(title => 
        title.toLowerCase().includes(filterText)
      );
      
      // Create completion items for each matching title
      const suggestions = filteredTitles.map(title => ({
        label: title,
        kind: monaco.languages.CompletionItemKind.Reference,
        insertText: title + ']]',
        range: {
          startLineNumber: position.lineNumber,
          startColumn: position.column - filterText.length,
          endLineNumber: position.lineNumber,
          endColumn: position.column
        }
      }));
      
      return {
        suggestions: suggestions
      };
    }
  });
}
