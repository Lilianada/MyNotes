"use client"

import React, { useCallback, useMemo } from 'react';

interface MarkdownRendererProps {
  content: string;
  onChange?: (content: string) => void;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, onChange }) => {
  // Escape HTML to prevent XSS
  const escapeHTML = useCallback((str: string) => {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }, []);

  // Process inline markdown elements
  const processInlineMarkdown = useCallback((line: string) => {
    if (!line) return '';
    
    let processedLine = line;
    
    // Inline code - must be processed first to avoid conflicts
    processedLine = processedLine.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 rounded font-mono text-sm text-pink-500">$1</code>');
    
    // Bold text - both ** and __ syntax
    processedLine = processedLine
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.*?)__/g, '<strong>$1</strong>');
    
    // Italic text - both * and _ syntax (non-greedy to avoid conflicts)
    processedLine = processedLine
      .replace(/\*([^\*]+)\*/g, '<em>$1</em>')
      .replace(/_([^_]+)_/g, '<em>$1</em>');
    
    // Strikethrough text
    processedLine = processedLine.replace(/~~(.*?)~~/g, '<del>$1</del>');
    
    // Links with title attribute support
    processedLine = processedLine.replace(/\[(.*?)\]\((.*?)("(.*?)")?\)/g, (match, text, url, _, title) => {
      const titleAttr = title ? ` title="${title}"` : '';
      return `<a href="${url}" target="_blank" rel="noopener noreferrer"${titleAttr} class="text-blue-600 hover:underline">$1</a>`;
    });
    
    // Images
    processedLine = processedLine.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" class="max-w-full h-auto rounded my-2" />');
    
    return processedLine;
  }, []);
  
  // Process tables
  const processTables = useCallback((text: string) => {
    const lines = text.split('\n');
    let inTable = false;
    let tableContent = '';
    let result = '';
    let tableRows = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check if line is part of a table
      if (line.startsWith('|') && line.endsWith('|')) {
        if (!inTable) {
          inTable = true;
          tableRows = [];
        }
        
        // Skip separator rows (---|---) but track them
        if (line.replace(/\|/g, '').trim().replace(/[-:]/g, '').length === 0) {
          continue;
        }
        
        // Process table row
        const cells = line.split('|')
          .filter((cell, idx, arr) => idx !== 0 && idx !== arr.length - 1)
          .map(cell => cell.trim());
          
        tableRows.push(cells);
      } else if (inTable) {
        // End of table
        inTable = false;
        
        // Generate table HTML
        if (tableRows.length > 0) {
          tableContent = '<table class="min-w-full border border-gray-200 my-4"><thead><tr>';
          
          // Table headers (first row)
          const headers = tableRows[0];
          for (const header of headers) {
            tableContent += `<th class="border border-gray-200 px-4 py-2 bg-gray-50">${processInlineMarkdown(header)}</th>`;
          }
          
          tableContent += '</tr></thead><tbody>';
          
          // Table body (remaining rows)
          for (let j = 1; j < tableRows.length; j++) {
            tableContent += '<tr>';
            for (const cell of tableRows[j]) {
              tableContent += `<td class="border border-gray-200 px-4 py-2">${processInlineMarkdown(cell)}</td>`;
            }
            tableContent += '</tr>';
          }
          
          tableContent += '</tbody></table>';
          result += tableContent + '\n';
        }
        
        // Add the current non-table line
        result += line + '\n';
      } else {
        result += line + '\n';
      }
    }
    
    // Handle table at the end of text
    if (inTable && tableRows.length > 0) {
      tableContent = '<table class="min-w-full border border-gray-200 my-4"><thead><tr>';
      
      const headers = tableRows[0];
      for (const header of headers) {
        tableContent += `<th class="border border-gray-200 px-4 py-2 bg-gray-50">${processInlineMarkdown(header)}</th>`;
      }
      
      tableContent += '</tr></thead><tbody>';
      
      for (let j = 1; j < tableRows.length; j++) {
        tableContent += '<tr>';
        for (const cell of tableRows[j]) {
          tableContent += `<td class="border border-gray-200 px-4 py-2">${processInlineMarkdown(cell)}</td>`;
        }
        tableContent += '</tr>';
      }
      
      tableContent += '</tbody></table>';
      result += tableContent;
    }
    
    return result;
  }, [processInlineMarkdown]);
  
  // Process code blocks
  const processCodeBlocks = useCallback((text: string) => {
    return text.replace(/```(\w*)\n([\s\S]*?)```/g, (match, language, code) => {
      const languageClass = language ? ` language-${language}` : '';
      const escapedCode = escapeHTML(code.trim());
      return `<pre class="bg-gray-100 p-4 rounded-md my-4 overflow-auto"><code class="font-mono text-sm${languageClass}">${escapedCode}</code></pre>`;
    });
  }, [escapeHTML]);
  
  // Process blockquotes
  const processBlockquotes = useCallback((text: string) => {
    const lines = text.split('\n');
    let inQuote = false;
    let result = '';
    let quoteContent = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.trim().startsWith('> ')) {
        if (!inQuote) {
          inQuote = true;
          quoteContent = '';
        }
        // Add line without '> ' marker to quote content
        quoteContent += line.substring(line.indexOf('> ') + 2) + '\n';
      } else {
        if (inQuote) {
          // Process quote content for other markdown elements
          result += `<blockquote class="pl-4 border-l-4 border-gray-300 my-4 italic text-gray-700">${processInlineMarkdown(quoteContent)}</blockquote>\n`;
          inQuote = false;
        }
        result += line + '\n';
      }
    }
    
    // Handle blockquote at end of text
    if (inQuote) {
      result += `<blockquote class="pl-4 border-l-4 border-gray-300 my-4 italic text-gray-700">${processInlineMarkdown(quoteContent)}</blockquote>\n`;
    }
    
    return result;
  }, [processInlineMarkdown]);
  
  // Process lists
  const processLists = useCallback((text: string) => {
    const lines = text.split('\n');
    let inList = false;
    let listType = ''; // 'ul' or 'ol'
    let listContent = '';
    let result = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const unorderedMatch = line.match(/^[-*+]\s(.+)/);
      const orderedMatch = line.match(/^\d+\.\s(.+)/);
      
      if (unorderedMatch || orderedMatch) {
        const newListType = unorderedMatch ? 'ul' : 'ol';
        const itemContent = unorderedMatch ? unorderedMatch[1] : orderedMatch![1];
        
        // Start new list or continue existing
        if (!inList || listType !== newListType) {
          if (inList) {
            // Close previous list
            result += `<${listType} class="pl-5 my-4 ${listType === 'ul' ? 'list-disc' : 'list-decimal'}">${listContent}</${listType}>\n`;
            listContent = '';
          }
          inList = true;
          listType = newListType;
        }
        
        // Add item to list
        listContent += `<li>${processInlineMarkdown(itemContent)}</li>`;
      } else {
        if (inList) {
          // Close list when non-list line is encountered
          result += `<${listType} class="pl-5 my-4 ${listType === 'ul' ? 'list-disc' : 'list-decimal'}">${listContent}</${listType}>\n`;
          inList = false;
        }
        result += line + '\n';
      }
    }
    
    // Close list at end of text
    if (inList) {
      result += `<${listType} class="pl-5 my-4 ${listType === 'ul' ? 'list-disc' : 'list-decimal'}">${listContent}</${listType}>\n`;
    }
    
    return result;
  }, [processInlineMarkdown]);
  
  // Process headings
  const processHeadings = useCallback((text: string) => {
    return text.split('\n').map(line => {
      if (line.startsWith('# ')) {
        return `<h1 class="text-2xl font-bold my-4 text-gray-800">${processInlineMarkdown(line.substring(2))}</h1>`;
      } else if (line.startsWith('## ')) {
        return `<h2 class="text-xl font-semibold my-3 text-gray-800">${processInlineMarkdown(line.substring(3))}</h2>`;
      } else if (line.startsWith('### ')) {
        return `<h3 class="text-lg font-medium my-2 text-gray-800">${processInlineMarkdown(line.substring(4))}</h3>`;
      } else if (line.startsWith('#### ')) {
        return `<h4 class="text-base font-medium my-2 text-gray-800">${processInlineMarkdown(line.substring(5))}</h4>`;
      } else if (line.startsWith('##### ')) {
        return `<h5 class="text-sm font-medium my-1 text-gray-800">${processInlineMarkdown(line.substring(6))}</h5>`;
      } else if (line.startsWith('###### ')) {
        return `<h6 class="text-xs font-medium my-1 text-gray-800">${processInlineMarkdown(line.substring(7))}</h6>`;
      }
      return line;
    }).join('\n');
  }, [processInlineMarkdown]);
  
  // Convert markdown to HTML
  const markdownToHTML = useCallback((text: string) => {
    if (!text) return '';
    
    // Process in specific order to avoid conflicts
    let processedText = text;
    
    // 1. Code blocks (must be first to avoid processing markdown inside them)
    processedText = processCodeBlocks(processedText);
    
    // 2. Tables
    processedText = processTables(processedText);
    
    // 3. Blockquotes
    processedText = processBlockquotes(processedText);
    
    // 4. Lists
    processedText = processLists(processedText);
    
    // 5. Headings
    processedText = processHeadings(processedText);
    
    // 6. Handle task lists (checkboxes)
    processedText = processedText.replace(/^- \[ \] (.+)$/gm, 
      '<div class="flex items-start mb-2"><input type="checkbox" class="mt-1 mr-2 h-4 w-4 task-checkbox" /><span>$1</span></div>');
    
    processedText = processedText.replace(/^- \[x\] (.+)$/gim, 
      '<div class="flex items-start mb-2"><input type="checkbox" class="mt-1 mr-2 h-4 w-4 task-checkbox" checked /><span>$1</span></div>');
    
    // 7. Process paragraphs (lines that aren't already HTML tags)
    processedText = processedText.split('\n').map(line => {
      if (line.trim() === '') return line;
      if (line.trim().startsWith('<') && line.trim().endsWith('>')) return line;
      
      return `<p class="my-2">${processInlineMarkdown(line)}</p>`;
    }).join('\n');
    
    return processedText;
  }, [processCodeBlocks, processTables, processBlockquotes, processLists, processHeadings, processInlineMarkdown]);
  
  // Handle checkbox state changes
  const handleCheckboxChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (!onChange) return;
    
    const checkbox = event.target;
    const parentDiv = checkbox.closest('div');
    const content = parentDiv?.querySelector('span')?.textContent;
    
    if (content) {
      const checked = checkbox.checked;
      const newContent = content.split('\n').map(line => {
        if (line.includes(content)) {
          return `- [${checked ? 'x' : ' '}] ${content}`;
        }
        return line;
      }).join('\n');
      
      onChange(newContent);
    }
  }, [onChange]);
  
  // Attach event handlers to checkboxes after render
  React.useEffect(() => {
    const checkboxes = document.querySelectorAll('.task-checkbox');
    
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', handleCheckboxChange as any);
    });
    
    return () => {
      checkboxes.forEach(checkbox => {
        checkbox.removeEventListener('change', handleCheckboxChange as any);
      });
    };
  }, [content, handleCheckboxChange]);
  
  if (!content) return null;
  
  return (
    <div className="w-full flex-1 overflow-y-auto p-4 text-base text-gray-700 scrollbar-hide h-[calc(100vh_-_10rem)] markdown-content">
      <div dangerouslySetInnerHTML={{ __html: markdownToHTML(content) }} />
      
      {/* Simplified CSS - only what's needed for the renderer */}
      <style jsx global>{`
        .markdown-content h1, 
        .markdown-content h2, 
        .markdown-content h3, 
        .markdown-content h4, 
        .markdown-content h5, 
        .markdown-content h6 {
          color: #1f2937; /* text-gray-800 */
          margin-top: 1rem;
          margin-bottom: 0.5rem;
          font-weight: 600;
        }
        
        .markdown-content h1 { font-size: 1.5rem; font-weight: 700; }
        .markdown-content h2 { font-size: 1.25rem; }
        .markdown-content h3 { font-size: 1.125rem; }
        
        .markdown-content pre {
          background-color: #f3f4f6; /* bg-gray-100 */
          padding: 1rem;
          border-radius: 0.375rem;
          margin: 1rem 0;
          overflow-x: auto;
        }
        
        .markdown-content code {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 0.875rem;
        }
        
        .markdown-content p {
          margin: 0.5rem 0;
        }
        
        .markdown-content blockquote {
          border-left: 4px solid #d1d5db; /* border-gray-300 */
          padding-left: 1rem;
          font-style: italic;
          color: #4b5563; /* text-gray-700 */
          margin: 1rem 0;
        }
        
        .markdown-content ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin: 1rem 0;
        }
        
        .markdown-content ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin: 1rem 0;
        }
        
        .markdown-content table {
          border-collapse: collapse;
          width: 100%;
          margin: 1rem 0;
        }
        
        .markdown-content th {
          background-color: #f9fafb; /* bg-gray-50 */
          font-weight: 600;
        }
        
        .markdown-content th,
        .markdown-content td {
          border: 1px solid #e5e7eb; /* border-gray-200 */
          padding: 0.5rem 0.75rem;
          text-align: left;
        }
        
        .markdown-content img {
          max-width: 100%;
          height: auto;
          margin: 1rem 0;
          border-radius: 0.375rem;
        }
        
        .markdown-content a {
          color: #2563eb; /* text-blue-600 */
          text-decoration: none;
        }
        
        .markdown-content a:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};

export default MarkdownRenderer;