"use client"
import React from 'react';
import { MarkdownProcessor } from '@/lib/markdown-processor';

interface CodeBlockProps {
  code: string;
  language?: string;
}

/**
 * Component for rendering markdown code blocks
 */
const CodeBlock: React.FC<CodeBlockProps> = ({ code, language = '' }) => {
  const languageClass = language ? ` language-${language}` : '';
  const highlightedCode = MarkdownProcessor.highlightSyntax(code.trim(), language);
  
  return (
    <pre className="bg-gray-50 border border-gray-200 p-4 rounded-md my-4 overflow-auto">
      <code 
        className={`font-mono text-sm${languageClass}`}
        dangerouslySetInnerHTML={{ __html: highlightedCode }}
      />
    </pre>
  );
};

export default CodeBlock;
