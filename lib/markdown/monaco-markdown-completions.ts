"use client";

/**
 * Monaco markdown completion providers for snippets and autocomplete
 */

export function configureMarkdownCompletions(monaco: any) {
  // Skip if running on server
  if (typeof window === 'undefined') return;

  // Add completion provider for asterisk auto-completion to double asterisk
  monaco.languages.registerCompletionItemProvider('markdown', {
    triggerCharacters: ['*'],
    provideCompletionItems: (model: { getValueInRange: (arg0: any) => any; getLineContent: (arg0: any) => any; }, position: { lineNumber: any; column: number; }) => {
      const lineContent = model.getLineContent(position.lineNumber);
      const beforeCursor = lineContent.substring(0, position.column - 1);
      
      // Check for single asterisk for italic (when user just typed one asterisk)
      if (beforeCursor.endsWith('*') && !beforeCursor.endsWith('**')) {
        return {
          suggestions: [{
            label: 'Italic text',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '${1:text}*',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: 'Complete to italic text (*text*)',
            range: {
              startLineNumber: position.lineNumber,
              endLineNumber: position.lineNumber,
              startColumn: position.column,
              endColumn: position.column
            }
          }]
        };
      }
      
      return { suggestions: [] };
    }
  });

  // Add completion provider for double asterisk for bold text
  monaco.languages.registerCompletionItemProvider('markdown', {
    triggerCharacters: ['*'],
    provideCompletionItems: (model: { getLineContent: (arg0: any) => any; }, position: { lineNumber: any; column: number; }) => {
      const lineContent = model.getLineContent(position.lineNumber);
      const beforeCursor = lineContent.substring(0, position.column - 1);
      
      // Check if we just typed a second asterisk (for bold)
      if (beforeCursor.endsWith('**')) {
        // Check if it's not already a triple asterisk to avoid ****
        if (!beforeCursor.endsWith('***')) {
          return {
            suggestions: [{
              label: 'Bold text',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: '${1:text}**',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              detail: 'Complete to bold text (**text**)',
              range: {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: position.column,
                endColumn: position.column
              }
            }]
          };
        }
      }
      
      return { suggestions: [] };
    }
  });

  // Add completion provider for backlinks
  monaco.languages.registerCompletionItemProvider('markdown', {
    triggerCharacters: ['['],
    provideCompletionItems: (model: { getLineContent: (arg0: any) => any; }, position: { lineNumber: any; column: number; }) => {
      const lineContent = model.getLineContent(position.lineNumber);
      const beforeCursor = lineContent.substring(0, position.column - 1);
      
      // Check if we just typed the second bracket for backlink
      if (beforeCursor.endsWith('[[')) {
        // Ensure we're not in a regular link [text](url) context
        const fullBefore = lineContent.substring(0, position.column - 2);
        if (!fullBefore.match(/\[.*\]\(.*$/)) {
          return {
            suggestions: [{
              label: 'Backlink',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: '${1:link text}]]',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              detail: 'Complete to backlink ([[link]])',
              range: {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: position.column,
                endColumn: position.column
              }
            }]
          };
        }
      }
      
      return { suggestions: [] };
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
      } else if (linePrefix.match(/^####\s*$/)) {
        suggestions.push({
          label: '#### Heading 4',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'Heading 4',
          range
        });
      } else if (linePrefix.match(/^#####\s*$/)) {
        suggestions.push({
          label: '##### Heading 5',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'Heading 5',
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

  // Add a general completion provider that always provides suggestions
  monaco.languages.registerCompletionItemProvider('markdown', {
    provideCompletionItems: (model: { getWordUntilPosition: (arg0: any) => any; getLineContent: (arg0: any) => any; }, position: { lineNumber: any; column: number; }) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn
      };
      
      const suggestions = [
        {
          label: 'Bold',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: '**${1:bold text}**',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range,
          detail: 'Bold text (**text**)'
        },
        {
          label: 'Italic',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: '*${1:italic text}*',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range,
          detail: 'Italic text (*text*)'
        },
        {
          label: 'Heading 1',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: '# ${1:Heading}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range,
          detail: 'Heading level 1'
        },
        {
          label: 'Heading 2',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: '## ${1:Heading}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range,
          detail: 'Heading level 2'
        },
        {
          label: 'Link',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: '[${1:link text}](${2:url})',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range,
          detail: 'Markdown link'
        },
        {
          label: 'Backlink',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: '[[${1:note title}]]',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range,
          detail: 'Wiki-style backlink'
        }
      ];
      
      return { suggestions };
    }
  });
}
