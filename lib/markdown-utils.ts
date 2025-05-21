"use client"

/**
 * Convert Markdown to HTML for rendering
 */
export function markdownToHtml(markdown: string): string {
  if (!markdown) return "";
  
  let html = markdown
    // Add <br> tags for line breaks
    .replace(/\n/g, '<br>')
    
    // Headers
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold my-4 text-gray-900">$1</h1>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold my-3 text-gray-800">$1</h2>')
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-medium my-2 text-gray-700">$1</h3>')
    
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    
    // Checkboxes
    .replace(/\[ \] (.+?)(?:<br>|$)/g, 
      '<div class="flex items-start my-1"><input type="checkbox" class="mt-1 mr-2" /> <span>$1</span></div>')
    .replace(/\[x\] (.+?)(?:<br>|$)/gi, 
      '<div class="flex items-start my-1"><input type="checkbox" checked class="mt-1 mr-2" /> <span class="line-through text-gray-500">$1</span></div>')
    
    // Lists
    .replace(/^\- (.+?)(?:<br>|$)/gm, '<ul class="list-disc pl-5 my-2"><li>$1</li></ul>')
    .replace(/^\d\. (.+?)(?:<br>|$)/gm, '<ol class="list-decimal pl-5 my-2"><li>$1</li></ol>')
    
    // Links
    .replace(/\[(.+?)\]\((.+?)\)/g, 
      '<a href="$2" class="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')
    
    // Code blocks with language specification
    .replace(/```([a-z]*)\n([\s\S]*?)```/g, (match, lang, code) => {
      const language = lang ? ` language-${lang}` : '';
      return `<pre class="bg-gray-100 dark:bg-gray-800 p-2 rounded my-2 overflow-x-auto${language}"><code class="font-mono text-sm whitespace-pre">${code}</code></pre>`;
    })
    
    // Inline code
    .replace(/`(.+?)`/g, '<code class="bg-gray-100 dark:bg-gray-800 px-1 rounded font-mono text-sm">$1</code>')
    
    // Horizontal rule
    .replace(/^---$/gm, '<hr class="my-4 border-t border-gray-300 dark:border-gray-700">');

  // Fix nested list issues (simplistic approach)
  html = html
    .replace(/<\/ul><br><ul/g, '</ul><ul')
    .replace(/<\/ol><br><ol/g, '</ol><ol');

  return html;
}

/**
 * Extract headings from markdown content for a table of contents
 */
export function extractHeadings(markdown: string): { level: number; text: string }[] {
  const headings: { level: number; text: string }[] = [];
  const headingRegex = /^(#{1,3})\s+(.+)$/gm;
  let match;

  while ((match = headingRegex.exec(markdown)) !== null) {
    headings.push({
      level: match[1].length,
      text: match[2]
    });
  }

  return headings;
}

/**
 * Count the words in a markdown string (after stripping markdown)
 */
export function countWords(markdown: string): number {
  // Strip markdown formatting
  const plainText = markdown
    .replace(/#+\s+/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/\[.*?\]\(.*?\)/g, '$1')
    .replace(/\[(x| )\]/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`.*?`/g, '')
    .trim();
  
  // Split by whitespace and count non-empty words
  return plainText
    .split(/\s+/)
    .filter(word => word.length > 0)
    .length;
}

/**
 * Create a plain text preview from markdown
 */
export function createPlainTextPreview(markdown: string, maxLength: number = 100): string {
  if (!markdown) return "";
  
  // Remove markdown formatting to get plain text
  const plainText = markdown
    .replace(/#+\s+/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/\[.*?\]\(.*?\)/g, '$1')
    .replace(/\[(x| )\]\s+/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`.*?`/g, '')
    .replace(/\n/g, ' ')
    .trim();
  
  // Truncate if needed
  if (plainText.length <= maxLength) {
    return plainText;
  }
  
  return plainText.substring(0, maxLength) + '...';
}

// For internal note references with format [[Note Title]] or [[Note Title|Displayed Text]]
export function processInternalLinks(markdown: string, notes: any[], navigateToNoteById: (id: number) => void): string {
  if (!markdown || !notes || !notes.length) return markdown;
  
  return markdown.replace(/\[\[(.+?)(?:\|(.+?))?\]\]/g, (match, noteTitle, displayText) => {
    // Find the note by title
    const note = notes.find(n => 
      n.noteTitle.toLowerCase() === noteTitle.toLowerCase().trim()
    );
    
    if (note) {
      // Create a clickable link that uses the navigateToNoteById function
      return `<a href="#" class="text-purple-600 hover:underline cursor-pointer internal-note-link" data-note-id="${note.id}">${displayText || noteTitle}</a>`;
    } else {
      // Note not found - display as pending link
      return `<span class="text-red-400 internal-note-link-missing">${displayText || noteTitle}</span>`;
    }
  });
}

// Attach click handlers to internal note links
export function attachInternalLinkHandlers(containerElement: HTMLElement, navigateToNoteById: (id: number) => void): void {
  if (!containerElement) return;
  
  const internalLinks = containerElement.querySelectorAll('.internal-note-link');
  internalLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const noteId = (link as HTMLElement).getAttribute('data-note-id');
      if (noteId) {
        navigateToNoteById(parseInt(noteId, 10));
      }
    });
  });
}
