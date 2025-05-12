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
    
    // Process line by line
    return text.split('\n').map((line, index) => {
      // Headings
      if (line.startsWith('# ')) {
        return `<h1>${line.substring(2)}</h1>`;
      } else if (line.startsWith('## ')) {
        return `<h2>${line.substring(3)}</h2>`;
      } else if (line.startsWith('### ')) {
        return `<h3>${line.substring(4)}</h3>`;
      }
      
      // Bold text
      line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      
      // Italic text
      line = line.replace(/\*(.*?)\*/g, '<em>$1</em>');
      
      // Links
      line = line.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
      
      // Inline code
      line = line.replace(/`(.*?)`/g, '<code>$1</code>');
      
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
    <div className="w-full flex-1 overflow-y-auto p-1 text-[15px] scrollbar-hide h-[calc(100vh_-10rem)]">
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
