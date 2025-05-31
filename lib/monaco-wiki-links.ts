"use client";

/**
 * Monaco wiki-link completion provider for note linking
 */

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
