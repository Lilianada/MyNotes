"use client";

import React, { useCallback, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
// CSS is imported globally in app/layout.tsx
import hljs from 'highlight.js';

interface ModernMarkdownRendererProps {
  content: string;
  onChange?: (newContent: string) => void;
  className?: string;
}

const ModernMarkdownRenderer: React.FC<ModernMarkdownRendererProps> = ({ 
  content, 
  onChange, 
  className 
}) => {
  const markdownRef = useRef<HTMLDivElement>(null);

  // Highlight code blocks after render
  useEffect(() => {
    if (markdownRef.current) {
      const codeBlocks = markdownRef.current.querySelectorAll('pre code');
      codeBlocks.forEach((block) => {
        hljs.highlightElement(block as HTMLElement);
      });
    }
  }, [content]);

  // Handle checkbox changes
  const handleCheckboxChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (!onChange) return;
    
    const checkbox = event.target;
    const listItem = checkbox.closest('li');
    if (!listItem) return;
    
    const listItemText = listItem.textContent || '';
    const isChecked = checkbox.checked;
    
    // Replace only the first matching task list item
    const taskItemRegex = new RegExp(`- \\[${isChecked ? ' ' : 'x'}\\] (.+?)(?=\\n|$)`, 'i');
    const replacement = `- [${isChecked ? 'x' : ' '}] $1`;
    
    const newContent = content.replace(taskItemRegex, replacement);
    onChange(newContent);
  }, [content, onChange]);

  // Add event listeners for checkboxes
  useEffect(() => {
    if (!markdownRef.current || !onChange) return;
    
    const checkboxes = markdownRef.current.querySelectorAll('input[type="checkbox"]');
    
    const handleChange = (e: Event) => {
      handleCheckboxChange(e as unknown as React.ChangeEvent<HTMLInputElement>);
    };
    
    checkboxes.forEach((checkbox) => {
      checkbox.addEventListener('change', handleChange);
    });
    
    return () => {
      checkboxes.forEach((checkbox) => {
        checkbox.removeEventListener('change', handleChange);
      });
    };
  }, [content, handleCheckboxChange, onChange]);

  // Custom component renderers
  const components = {
    // Make checkboxes interactive
    li: ({ node, ...props }: { node: any; [key: string]: any }) => {
      const { children } = props;
      
      if (
        node.children?.[0]?.type === 'paragraph' &&
        node.children[0].children?.[0]?.type === 'text' &&
        /^\[[ x]\]\s/.test(node.children[0].children[0].value || '')
      ) {
        const checked = node.children[0].children[0].value?.startsWith('[x]') || false;
        const textContent = node.children[0].children[0].value?.replace(/^\[[ x]\]\s/, '') || '';
        
        return (
          <li {...props} className={`my-1 ${props.className || ''}`} style={{ listStyleType: 'none' }}>
            <div className="flex items-start">
              <input 
                type="checkbox" 
                checked={checked}
                readOnly={!onChange}
                className="mt-1 mr-2 h-4 w-4 rounded-sm bg-white border border-gray-300" 
              />
              <span className={checked ? "line-through text-gray-500" : ""}>{textContent}</span>
            </div>
          </li>
        );
      }
      
      return <li {...props} className={`my-1 ${props.className || ''}`} />;
    },
    
    // Style code blocks
    code: ({ node, inline, className, children, ...props }: { 
      node?: any; 
      inline?: boolean; 
      className?: string; 
      children: React.ReactNode;
      [key: string]: any;
    }) => {
      const match = /language-(\w+)/.exec(className || '');
      
      if (!inline && match) {
        return (
          <pre className="bg-gray-50 border border-gray-200 p-4 rounded-md my-4 overflow-auto">
            <code className={`${className} font-mono text-sm`} {...props}>
              {children}
            </code>
          </pre>
        );
      }

      return inline ? 
        <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-sm text-pink-600" {...props}>{children}</code> : 
        <pre className="bg-gray-50 border border-gray-200 p-4 rounded-md my-4 overflow-auto">
          <code className="font-mono text-sm" {...props}>{children}</code>
        </pre>;
    },
    
    // Style headings
    h1: ({ children }: { children: React.ReactNode }) => <h1 className="text-2xl font-bold my-4 text-indigo-700">{children}</h1>,
    h2: ({ children }: { children: React.ReactNode }) => <h2 className="text-xl font-bold my-3 text-blue-700">{children}</h2>,
    h3: ({ children }: { children: React.ReactNode }) => <h3 className="text-lg font-bold my-2 text-cyan-700">{children}</h3>,
    h4: ({ children }: { children: React.ReactNode }) => <h4 className="text-base font-bold my-2 text-teal-700">{children}</h4>,
    h5: ({ children }: { children: React.ReactNode }) => <h5 className="text-sm font-bold my-1 text-green-700">{children}</h5>,
    h6: ({ children }: { children: React.ReactNode }) => <h6 className="text-xs font-bold my-1 text-emerald-700">{children}</h6>,
    
    // Style other elements
    p: ({ children }: { children: React.ReactNode }) => <p className="my-2 leading-relaxed text-gray-800 text-sm">{children}</p>,
    a: ({ node, children, href, ...props }: React.ClassAttributes<HTMLAnchorElement> & React.AnchorHTMLAttributes<HTMLAnchorElement> & { children?: React.ReactNode }) => (
      <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 hover:underline"
        {...props}
      >
        {children}
      </a>
    ),
    blockquote: ({ children }: { children: React.ReactNode }) => (
      <blockquote className="border-l-4 border-gray-300 pl-4 py-1 my-2 text-gray-600 italic">
        {children}
      </blockquote>
    ), // complete the implementation
    img: ({ src, alt, title }: { src?: string; alt?: string; title?: string }) => (
      <img 
        src={src} 
        alt={alt || ''} 
        title={title} 
        className="max-w-full h-auto rounded my-2 border border-gray-200" 
      />
    ),
    table: ({ children }: { children: React.ReactNode }) => (
      <div className="overflow-x-auto my-4">
        <table className="min-w-full border border-gray-200 rounded-md">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }: { children: React.ReactNode }) => <thead className="bg-gray-50">{children}</thead>,
    th: ({ children }: { children: React.ReactNode }) => (
      <th className="border border-gray-200 px-4 py-2 text-left font-medium text-gray-700">
        {children}
      </th>
    ),
    td: ({ children }: { children: React.ReactNode }) => (
      <td className="border border-gray-200 px-4 py-2">
        {children}
      </td>
    ),
    tr: ({ children }: { children: React.ReactNode }) => (
      <tr className="hover:bg-gray-50 transition-colors">
        {children}
      </tr>
    ),
    ul: ({ children }: { children: React.ReactNode }) => <ul className="pl-6 my-2 list-disc">{children}</ul>,
    ol: ({ children }: { children: React.ReactNode }) => <ol className="pl-6 my-2 list-decimal">{children}</ol>,
    hr: () => <hr className="my-4 border-gray-200" />,
    strong: ({ children }: { children: React.ReactNode }) => <strong className="text-orange-600 font-bold">{children}</strong>,
    em: ({ children }: { children: React.ReactNode }) => <em className="text-amber-700 italic">{children}</em>,
    del: ({ children }: { children: React.ReactNode }) => <del className="line-through text-gray-500">{children}</del>,
  };

  if (!content) return null;

  return (
    <div 
      ref={markdownRef}
      className={`h-full overflow-auto p-4 text-sm ${className || ""}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default ModernMarkdownRenderer;
