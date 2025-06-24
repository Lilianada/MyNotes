"use client";

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkFrontmatter from 'remark-frontmatter';
import remarkBreaks from 'remark-breaks';
import { Components } from 'react-markdown';
import { remarkParagraphSpacing } from '@/lib/markdown/remark-paragraph-spacing';
import { getMarkdownBodyClass } from './styles';

interface MarkdownRendererProps {
  content: string;
  onChange?: (content: string) => void;
  className?: string;
}

interface CodeProps {
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ 
  content, 
  onChange, 
  className = "" 
}) => {
  return (
    <div className={`markdown-renderer overflow-y-auto h-full p-4 ${getMarkdownBodyClass()} ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkFrontmatter, remarkBreaks, remarkParagraphSpacing]}
        components={{
          // Headers - use CSS from styles/markdown.css
          h1: ({ children }) => <h1>{children}</h1>,
          h2: ({ children }) => <h2>{children}</h2>,
          h3: ({ children }) => <h3>{children}</h3>,
          h4: ({ children }) => <h4>{children}</h4>,
          h5: ({ children }) => <h5>{children}</h5>,
          h6: ({ children }) => <h6>{children}</h6>,
          
          // Paragraphs - use CSS from styles/markdown.css
          p: ({ children }) => <p>{children}</p>,
          
          // Custom text component to handle backlinks  
          text: ({ children }) => {
            if (typeof children === 'string') {
              // Process backlinks in text content
              const parts = children.split(/(\[\[[^\]]+\]\])/g);
              return (
                <>
                  {parts.map((part, index) => {
                    const backlinkMatch = part.match(/^\[\[([^\]]+)\]\]$/);
                    if (backlinkMatch) {
                      return (
                        <span key={index} className="backlink">
                          {backlinkMatch[1]}
                        </span>
                      );
                    }
                    return part;
                  })}
                </>
              );
            }
            return children;
          },
          
          // Text formatting - use CSS from styles/markdown.css
          strong: ({ children }) => <strong>{children}</strong>,
          em: ({ children }) => <em>{children}</em>,
          del: ({ children }) => <del>{children}</del>,
          
          // Lists - use CSS from styles/markdown.css
          ul: ({ children }) => <ul>{children}</ul>,
          ol: ({ children }) => <ol>{children}</ol>,
          li: ({ children }) => <li>{children}</li>,
          
          // Blockquotes - use CSS from styles/markdown.css
          blockquote: ({ children }) => <blockquote>{children}</blockquote>,
          // Code blocks and inline code - use CSS from styles/markdown.css
          code: ({ inline, children, className, ...props }: CodeProps) => {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            
            if (inline) {
              return (
                <code className="inline-code" {...props}>
                  {children}
                </code>
              );
            }
            
            return (
              <pre>
                <code {...props}>
                  {children}
                </code>
              </pre>
            );
          },
          
          // Links - use CSS from styles/markdown.css
          a: ({ children, href }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          
          // Horizontal rule
          hr: () => <hr />,
          
          // Tables - use CSS from styles/markdown.css
          table: ({ children }) => <table>{children}</table>,
          thead: ({ children }) => <thead>{children}</thead>,
          tbody: ({ children }) => <tbody>{children}</tbody>,
          tr: ({ children }) => <tr>{children}</tr>,
          th: ({ children }) => <th>{children}</th>,
          td: ({ children }) => <td>{children}</td>,
          // Input elements (checkboxes for task lists)
          input: ({ type, checked, ...props }) => {
            if (type === 'checkbox') {
              return (
                <input
                  type="checkbox"
                  checked={checked}
                  readOnly
                  {...props}
                />
              );
            }
            return <input type={type} {...props} />;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;