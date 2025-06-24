
export function configureMarkdownLanguage(monaco: any) {
  // Only run on client
  if (typeof window === "undefined") return;

  monaco.languages.setLanguageConfiguration('markdown', {
    autoClosingPairs: [
      { open: '(', close: ')' },
      { open: '[', close: ']' },
      { open: '{', close: '}' },
      { open: '"', close: '"' },
      // Removed single quotes from auto-closing
      { open: '`', close: '`' },
      { open: '*', close: '*' }, // for markdown emphasis
      { open: '_', close: '_' }, // for markdown emphasis alternative
      // Note: Adding more pairs like ~~ for strikethrough can be done here
    ],
    surroundingPairs: [
      { open: '(', close: ')' },
      { open: '[', close: ']' },
      { open: '{', close: '}' },
      { open: '"', close: '"' },
      // Removed single quotes from surrounding pairs
      { open: '`', close: '`' },
      { open: '*', close: '*' },
      { open: '_', close: '_' },
    ]
  });
}