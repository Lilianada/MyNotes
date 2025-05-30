"use client";

import React from 'react';
import hljs from './language-config';
import { LANGUAGE_ALIASES, LANGUAGE_DISPLAY } from './language-config';

interface CodeProps {
  node?: any;
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const CodeRenderer: React.FC<CodeProps> = ({ 
  node, inline, className, children, ...props 
}) => {
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1].toLowerCase() : '';
  const mappedLanguage = LANGUAGE_ALIASES[language] || language;
  
  // For inline code, just return with styling
  if (inline) {
    return (
      <code className="inline-code" {...props}>
        {children}
      </code>
    );
  }

  // For code blocks, apply syntax highlighting
  let codeBlockContent = String(children).replace(/\n$/, '');
  
  let highlightedCode;
  try {
    // Only highlight if we have a valid language mapping
    if (mappedLanguage && LANGUAGE_DISPLAY[mappedLanguage]) {
      highlightedCode = hljs.highlight(
        codeBlockContent, 
        { language: mappedLanguage, ignoreIllegals: true }
      ).value;
    } else {
      highlightedCode = codeBlockContent;
    }
  } catch (error) {
    console.warn("Highlight error:", error);
    highlightedCode = codeBlockContent;
  }

  const languageInfo = mappedLanguage && LANGUAGE_DISPLAY[mappedLanguage];

  return (
    <div className="code-block-wrapper">
      {languageInfo && (
        <span className={`language-badge ${languageInfo.class}`}>
          {languageInfo.display}
        </span>
      )}
      <pre>
        <code 
          className={`block-code ${className || ''}`}
          dangerouslySetInnerHTML={{ __html: highlightedCode }}
          data-initialized="true"
          {...props}
        />
      </pre>
    </div>
  );
};
