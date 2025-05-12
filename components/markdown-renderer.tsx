"use client"

import { useCallback } from 'react';

interface MarkdownRendererProps {
  content: string;
  onChange: (content: string) => void;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, onChange }) => {
  // Convert markdown to HTML for rendering
  const markdownToHTML = useCallback((text: string) => {
    if (!text) return '';
    
    // Check if we have a code block with language syntax (handling multi-line code blocks)
    if (text.includes('```')) {
      // Handle code blocks with potential language specification
      return text.replace(/```([a-z]*)\n([\s\S]*?)```/g, (match, lang, code) => {
        const language = lang ? ` language-${lang}` : '';
        return `<pre class="bg-gray-100 dark:bg-gray-800 p-2 rounded my-2 overflow-x-auto${language}"><code class="font-mono text-sm whitespace-pre">${code}</code></pre>`;
      });
    }
    
    // Process line by line for regular content
    return text.split('\n').map((line, index) => {
      // Headings with proper styling classes
      if (line.startsWith('# ')) {
        return `<h1 class="text-2xl font-bold mt-4 mb-2">${line.substring(2)}</h1>`;
      } else if (line.startsWith('## ')) {
        return `<h2 class="text-xl font-semibold mt-3 mb-2">${line.substring(3)}</h2>`;
      } else if (line.startsWith('### ')) {
        return `<h3 class="text-lg font-medium mt-2 mb-1">${line.substring(4)}</h3>`;
      }
      
      // Bold text
      line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      
      // Italic text
      line = line.replace(/\*(.*?)\*/g, '<em>$1</em>');
      
      // Links
      line = line.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
      
      // Inline code
      line = line.replace(/`(.*?)`/g, '<code class="bg-gray-100 dark:bg-gray-800 px-1 rounded font-mono text-sm">$1</code>');
      
      // Checkbox handling is done separately
      
      return line;
    }).join('\n');
  }, []);

  // Handle checkbox state changes
  const handleCheckboxChange = (lineIndex: number, checked: boolean) => {
    const lines = content.split('\n');
    let line = lines[lineIndex];
    
    if (line.includes('[ ]')) {
      lines[lineIndex] = line.replace('[ ]', checked ? '[x]' : '[ ]');
    } else if (line.includes('[x]')) {
      lines[lineIndex] = line.replace('[x]', checked ? '[x]' : '[ ]');
    }
    
    onChange(lines.join('\n'));
  };

  if (!content) return <></>;

  const lines = content.split('\n');
  
  return (
    <div className="w-full flex-1 overflow-y-auto p-1 text-[15px] scrollbar-hide h-[calc(100vh_-_10rem)] markdown-content">
      {/* Add global styles for markdown formatting */}
      <style jsx global>{`
        .markdown-content h1 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
          color: #111827;
        }
        .markdown-content h2 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 0.75rem;
          margin-bottom: 0.5rem;
          color: #1f2937;
        }
        .markdown-content h3 {
          font-size: 1.125rem;
          font-weight: 500;
          margin-top: 0.5rem;
          margin-bottom: 0.25rem;
          color: #374151;
        }
        .markdown-content pre {
          background-color: #f3f4f6;
          padding: 0.75rem;
          border-radius: 0.375rem;
          overflow-x: auto;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 0.875rem;
          line-height: 1.5;
          margin: 1rem 0;
          white-space: pre;
          border: 1px solid #e5e7eb;
        }
        .markdown-content code {
          background-color: #f3f4f6;
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 0.875rem;
        }
        .markdown-content .language-javascript,
        .markdown-content .language-js {
          color: #5a67d8;
        }
        .markdown-content .language-typescript,
        .markdown-content .language-ts {
          color: #3182ce;
        }
        .markdown-content .language-jsx,
        .markdown-content .language-tsx {
          color: #805ad5;
        }
        .markdown-content .language-html {
          color: #dd6b20;
        }
        .markdown-content .language-css {
          color: #38a169;
        }
        .markdown-content .language-python,
        .markdown-content .language-py {
          color: #2c5282;
        }
        @media (prefers-color-scheme: dark) {
          .markdown-content pre {
            background-color: #1f2937;
            color: #e5e7eb;
          }
          .markdown-content code {
            background-color: #1f2937;
            color: #e5e7eb;
          }
        }
      `}</style>
      {lines.map((line, index) => {
        // Replace checkbox patterns with actual checkboxes
        if (line.includes('[ ]')) {
          const parts = line.split('[ ]');
          const textContent = parts.join('');
          
          // Process the text content for other markdown elements
          const processedText = markdownToHTML(textContent);
          
          return (
            <div key={index} className="flex items-start mb-2">
              <input 
                type="checkbox" 
                className="mt-1 mr-2 h-4 w-4" 
                onChange={(e) => handleCheckboxChange(index, e.target.checked)}
              />
              <span dangerouslySetInnerHTML={{ __html: processedText }}></span>
            </div>
          );
        } else if (line.includes('[x]')) {
          const parts = line.split('[x]');
          const textContent = parts.join('');
          
          // Process the text content for other markdown elements
          const processedText = markdownToHTML(textContent);
          
          return (
            <div key={index} className="flex items-start mb-2">
              <input 
                type="checkbox" 
                className="mt-1 mr-2 h-4 w-4" 
                defaultChecked 
                onChange={(e) => handleCheckboxChange(index, e.target.checked)}
              />
              <span dangerouslySetInnerHTML={{ __html: processedText }}></span>
            </div>
          );
        } else {
          // For lines without checkboxes, process other markdown
          const processedLine = markdownToHTML(line);
          return (
            <div 
              key={index} 
              className="mb-2"
              dangerouslySetInnerHTML={{ __html: processedLine || '&nbsp;' }}
            ></div>
          );
        }
      })}
    </div>
  );
};

export default MarkdownRenderer;
