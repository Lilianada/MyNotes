"use client";

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Components } from 'react-markdown';

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
    <div className={`markdown-renderer overflow-y-auto h-full p-4 ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold my-4 text-gray-900">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold my-3 text-gray-800">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-medium my-2 text-gray-700">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-base font-medium my-2 text-gray-600">{children}</h4>
          ),
          h5: ({ children }) => (
            <h5 className="text-sm font-medium my-1 text-gray-600">{children}</h5>
          ),
          h6: ({ children }) => (
            <h6 className="text-xs font-medium my-1 text-gray-600">{children}</h6>
          ),
          p: ({ children }) => (
            <p className="my-2 leading-relaxed">{children}</p>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-orange-600">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-amber-700">{children}</em>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-5 my-2 space-y-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 my-2 space-y-1">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="text-gray-700">{children}</li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-gray-300 pl-4 my-4 italic text-gray-600">
              {children}
            </blockquote>
          ),
          code: ({ inline, children, className, ...props }: CodeProps) => {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            
            if (inline) {
              return (
                <code 
                  className="inline-code bg-red-50 text-red-800 px-1 py-0.5 rounded text-sm font-mono border border-red-200"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            
            return (
              <div className="code-block bg-gray-50 border border-gray-200 rounded-md p-4 my-4 relative">
                {language && (
                  <div className="text-xs text-gray-500 mb-2 font-semibold uppercase">
                    {language}
                  </div>
                )}
                <pre className="overflow-x-auto">
                  <code className="block text-sm font-mono text-gray-800" {...props}>
                    {children}
                  </code>
                </pre>
              </div>
            );
          },
          a: ({ children, href }) => (
            <a 
              href={href} 
              className="text-blue-600 hover:text-blue-800 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          hr: () => (
            <hr className="my-8 border-gray-300" />
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full border border-gray-300">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-gray-50">{children}</thead>
          ),
          tbody: ({ children }) => (
            <tbody>{children}</tbody>
          ),
          tr: ({ children }) => (
            <tr className="border-b border-gray-200">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="px-4 py-2 text-left font-semibold text-gray-900 border-r border-gray-300">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-2 text-gray-700 border-r border-gray-300">
              {children}
            </td>
          ),
          input: ({ type, checked, ...props }) => {
            if (type === 'checkbox') {
              return (
                <input
                  type="checkbox"
                  checked={checked}
                  readOnly
                  className="mr-2 mt-1"
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