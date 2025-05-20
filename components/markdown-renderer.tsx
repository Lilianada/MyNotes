"use client";

import React, { useCallback, useEffect, useRef, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import { merge } from "lodash";
import "highlight.js/styles/github.css";

// Import highlight.js with all common languages
import hljs from "highlight.js";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import python from "highlight.js/lib/languages/python";
import css from "highlight.js/lib/languages/css";
import html from "highlight.js/lib/languages/xml";
import json from "highlight.js/lib/languages/json";
import bash from "highlight.js/lib/languages/bash";
import markdown from "highlight.js/lib/languages/markdown";
import sql from "highlight.js/lib/languages/sql";

// Language handling - moved to a single place
const LANGUAGE_ALIASES: Record<string, string> = {
  'js': 'javascript',
  'jsx': 'javascript',
  'ts': 'typescript',
  'tsx': 'typescript',
  'py': 'python',
  'sh': 'bash',
  'shell': 'bash',
  'zsh': 'bash', 
  'console': 'bash',
  'md': 'markdown',
  'yml': 'yaml',
  'text': 'plaintext',
  'txt': 'plaintext',
  'plain': 'plaintext',
  'code': 'plaintext',
  'xml': 'html'
};

// Language display information
const LANGUAGE_DISPLAY: Record<string, { display: string, class: string }> = {
  'javascript': { display: "JavaScript", class: "bg-yellow-100 text-yellow-800" },
  'typescript': { display: "TypeScript", class: "bg-blue-100 text-blue-800" },
  'python': { display: "Python", class: "bg-green-100 text-green-800" },
  'css': { display: "CSS", class: "bg-purple-100 text-purple-800" },
  'html': { display: "HTML", class: "bg-orange-100 text-orange-800" },
  'json': { display: "JSON", class: "bg-amber-100 text-amber-800" },
  'bash': { display: "Bash", class: "bg-gray-200 text-gray-800" },
  'sql': { display: "SQL", class: "bg-cyan-100 text-cyan-800" },
  'markdown': { display: "Markdown", class: "bg-indigo-100 text-indigo-800" },
  'plaintext': { display: "Plain Text", class: "bg-gray-100 text-gray-600" }
};

// Register languages
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('css', css);
hljs.registerLanguage('html', html);
hljs.registerLanguage('json', json);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('markdown', markdown);
hljs.registerLanguage('sql', sql);

// Set default options for better error handling
hljs.configure({
  ignoreUnescapedHTML: true,
  throwUnescapedHTML: false,
  languages: ['plaintext']
});

// Create a custom schema for sanitization based on the default schema
// but with specific allowances for our needs
const customSanitizeSchema = merge({}, defaultSchema, {
  attributes: {
    // Allow class, id, and data attributes on all allowed elements
    '*': [...(defaultSchema.attributes?.['*'] || []), 'className', 'class', 'id', 'data*'],
    
    // Special handling for code elements
    'code': [
      ...(defaultSchema.attributes?.['code'] || []),
      'className', 'class', 'data*',
      ['style', { 
        // Only allow safe styles
        onValue: (value: string) => 
          value.replace(/(\b)(on\w+|javascript|expression|behavior|binding)(\b)/gi, '$1blocked$3')
      }]
    ],
    
    // Allow safe attributes on links but validate URLs
    'a': [
      ...(defaultSchema.attributes?.['a'] || []),
      ['href', { 
        onValue: (value: string) => {
          // Validate URLs and block javascript: protocols
          const url = value.trim().toLowerCase();
          if (url.startsWith('javascript:') || url.includes('data:text/html')) {
            return '#blocked-for-security';
          }
          return value;
        }
      }],
      'target', 'rel', 'title', 'className', 'class'
    ],
    
    // Special handling for task list checkboxes
    'input': [
      ...(defaultSchema.attributes?.['input'] || []),
      'type', 'checked', 'disabled', 'aria-label', 'aria-checked',
      'data*', 'className', 'class'
    ]
  },
  
  // Add additional allowed tags
  tagNames: [
    ...(defaultSchema.tagNames || []),
    'input' // Allow input elements for checkboxes
  ]
});

// Task list styles
const taskListStyles = `
  /* Fix for inline code */
  .inline-code {
    display: inline !important;
    vertical-align: baseline !important;
    padding: 0.2em 0.4em !important;
    font-size: 85% !important;
    white-space: pre-wrap !important;
    overflow-wrap: break-word !important;
    background-color: #fef2f2 !important;
    color: #b91c1c !important;
    border: 1px solid #fecaca !important;
    border-radius: 0.25rem !important;
    font-family: monospace !important;
  }
  
  /* Style for code blocks */
  pre code.block-code {
    display: block !important;
    padding: 1em !important;
    overflow-x: auto !important;
    white-space: pre !important;
    background-color: #f5f7f9 !important;
  }
`;

interface MarkdownRendererProps {
  content: string;
  onChange?: (newContent: string) => void;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  onChange,
  className,
}) => {
  const markdownRef = useRef<HTMLDivElement>(null);

  // Normalize language - unified function
  const normalizeLanguage = useCallback((language: string | null): string => {
    if (!language) return 'plaintext';
    
    const normalizedLang = language.toLowerCase();
    const alias = LANGUAGE_ALIASES[normalizedLang];
    
    // Check if language or its alias is supported
    if (alias && hljs.getLanguage(alias)) {
      return alias;
    } else if (hljs.getLanguage(normalizedLang)) {
      return normalizedLang;
    }
    
    return 'plaintext';
  }, []);

  // Pre-render highlighted code (memoized)
  const highlightCode = useCallback((code: string, language: string): string => {
    try {
      const normalizedLang = normalizeLanguage(language);
      if (normalizedLang && normalizedLang !== 'plaintext') {
        return hljs.highlight(code, { language: normalizedLang }).value;
      }
      return hljs.highlightAuto(code).value;
    } catch (error) {
      console.warn("Highlight.js error:", error);
      return code; // Fallback to plain code
    }
  }, [normalizeLanguage]);

  // Handle checkbox changes with better regex
  const handleCheckboxChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>, textContent: string) => {
      if (!onChange) return;

      const checkbox = event.target;
      const isChecked = checkbox.checked;

      // Improved task item regex that's more specific to this item
      const taskItemRegex = new RegExp(
        `- \\[${isChecked ? " " : "x"}\\] ${textContent.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=\\n|$)`,
        "m"
      );
      
      const replacement = `- [${isChecked ? "x" : " "}] ${textContent}`;
      const newContent = content.replace(taskItemRegex, replacement);
      
      if (newContent !== content) {
        onChange(newContent);
      }
    },
    [content, onChange]
  );

  // Replace arrow notation in paragraphs and fix inline code display issues
  useEffect(() => {
    if (!markdownRef.current) return;
    
    // Add data attribute to prevent duplicate highlighting
    const codeBlocks = markdownRef.current.querySelectorAll("pre code:not([data-initialized])");
    codeBlocks.forEach((block) => {
      block.setAttribute('data-initialized', 'true');
    });
    
    // Replace notation symbols in paragraphs
    const paragraphs = markdownRef.current.querySelectorAll("p");
    paragraphs.forEach((p) => {
      let needsUpdate = false;
      
      // Check for arrow notation
      if (p.innerHTML.includes("->")) {
        p.innerHTML = p.innerHTML.replace(/->/g, "→");
        needsUpdate = true;
      }
      
      // Check for double dash (em dash)
      if (p.innerHTML.includes("--")) {
        p.innerHTML = p.innerHTML.replace(/--/g, "—");
        needsUpdate = true;
      }
    });
    
    // Apply inline-code class to all inline code elements
    // First pass: find all code elements that aren't inside pre tags
    const allCodeElements = markdownRef.current.querySelectorAll("code");
    allCodeElements.forEach((code) => {
      // If this code element isn't inside a pre tag, it's inline code
      if (!code.parentElement || code.parentElement.tagName.toLowerCase() !== 'pre') {
        code.classList.add('inline-code');
      } else {
        // If it's inside a pre tag, make sure it has the block-code class
        code.classList.add('block-code');
      }
    });
  }, [content]);

  // Improved task list regex to better identify task items
  const isTaskListItem = useCallback((node: any): boolean => {
    try {
      if (!node?.children?.[0]?.children) return false;
      
      // Check if first child is paragraph 
      const firstChild = node.children[0];
      if (firstChild.type !== 'paragraph') return false;
      
      // Check text content for checkbox pattern
      const textNode = firstChild.children?.[0];
      return (
        textNode?.type === 'text' && 
        /^\s*\[[ xX]\]\s/.test(textNode.value || '')
      );
    } catch (error) {
      return false;
    }
  }, []);

  // Get language display info
  const getLanguageDisplayInfo = useCallback((language: string | null): { display: string, class: string } => {
    if (!language) return LANGUAGE_DISPLAY['plaintext'];
    
    const normalizedLang = normalizeLanguage(language);
    return LANGUAGE_DISPLAY[normalizedLang] || { 
      display: language.charAt(0).toUpperCase() + language.slice(1),
      class: "bg-gray-100 text-gray-600" 
    };
  }, [normalizeLanguage]);

  // Handle auto-replacement of symbols before rendering
  const processedContent = useMemo(() => {
    return content
      .replace(/->/g, "→")       // Replace -> with arrow symbol
      .replace(/--/g, "—");      // Replace -- with em dash
  }, [content]);

  // Custom component renderers
  const components = {
    // Make checkboxes interactive
    li: function Li(props: any) {
      const { node, children } = props;
      
      // Check if this is a task item
      if (isTaskListItem(node)) {
        const textContent = node.children[0].children[0].value || '';
        const checked = textContent.startsWith('[x]') || textContent.startsWith('[X]');
        const taskText = textContent.replace(/^\s*\[[ xX]\]\s*/, '');

        return (
          <li
            {...props}
            className="task-list-item my-1"
            role="listitem"
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => handleCheckboxChange(e, taskText)}
              aria-label={`Task: ${taskText}`}
              aria-checked={checked}
              className="mt-1 mr-2 h-4 w-4 rounded-sm bg-white border border-gray-300 flex-shrink-0"
            />
            <span className={checked ? "line-through text-gray-500" : ""}>
              {taskText}
            </span>
          </li>
        );
      }

      // Regular list item
      return (
        <li {...props} className="my-1">
          {children}
        </li>
      );
    },

    // Style code blocks with pre-rendering
    code: function Code(props: any) {
      const { node, inline, className, children } = props;
      
      // For inline code (using single or double backticks)
      if (inline) {
        return (
          <code
            className="inline-code"
            data-code-type="inline"
            {...props}
          >
            {children}
          </code>
        );
      }
      
      // For code blocks (using triple backticks)
      // Extract language from className if present
      const match = /language-(\w+)/.exec(className || "");
      const languageSpecified = match ? match[1].toLowerCase() : null;
      const normalizedLanguage = normalizeLanguage(languageSpecified);
      
      // Pre-highlighting code
      const codeString = String(children).replace(/\n$/, '');
      const highlightedCode = highlightCode(codeString, normalizedLanguage);
      const langInfo = getLanguageDisplayInfo(languageSpecified);
      
      return (
        <pre className="bg-slate-50 border border-slate-200 p-4 rounded-md my-4 overflow-auto shadow-sm relative">
          <div className={`absolute top-0 right-0 px-2 py-1 text-xs rounded-bl ${langInfo.class}`}>
            {langInfo.display}
          </div>
          <code
            className={`block-code font-mono text-sm block text-slate-800 language-${normalizedLanguage} pt-5`}
            data-code-type="block"
            dangerouslySetInnerHTML={{ __html: highlightedCode }}
          />
        </pre>
      );
    },

    // Handle pre tags to properly wrap code blocks
    pre: function Pre(props: any) {
      // Simply pass children through to avoid duplicate pre tags
      // This is necessary because we construct our own pre tag in the code component
      const { children } = props;
      return <>{children}</>;
    },

    // Style headings
    h1: (props: any) => <h1 className="text-2xl font-bold my-4 text-indigo-700" {...props} />,
    h2: (props: any) => <h2 className="text-xl font-bold my-3 text-blue-700" {...props} />,
    h3: (props: any) => <h3 className="text-lg font-bold my-2 text-cyan-700" {...props} />,
    h4: (props: any) => <h4 className="text-base font-bold my-2 text-teal-700" {...props} />,
    h5: (props: any) => <h5 className="text-sm font-bold my-1 text-green-700" {...props} />,
    h6: (props: any) => <h6 className="text-xs font-bold my-1 text-emerald-700" {...props} />,

    // Style other elements
    p: (props: any) => <p className="my-2 leading-relaxed text-gray-800 text-[14px]" {...props} />,
    a: (props: any) => (
      <a
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 hover:underline"
        {...props}
      />
    ),
    blockquote: (props: any) => (
      <blockquote className="border-l-4 border-gray-300 pl-4 py-1 my-2 text-gray-600 italic" {...props} />
    ),
    img: (props: any) => (
      <img
        className="max-w-full h-auto rounded my-2 border border-gray-200"
        {...props}
      />
    ),
    table: (props: any) => (
      <div className="overflow-x-auto my-4">
        <table className="min-w-full border border-gray-200 rounded-md" {...props} />
      </div>
    ),
    thead: (props: any) => <thead className="bg-gray-50" {...props} />,
    th: (props: any) => <th className="border border-gray-200 px-4 py-2 text-left font-medium text-gray-700" {...props} />,
    td: (props: any) => <td className="border border-gray-200 px-4 py-2" {...props} />,
    tr: (props: any) => <tr className="hover:bg-gray-50 transition-colors" {...props} />,
    ul: function Ul(props: any) {
      const { node, children, className } = props;
      
      // Check if this list contains task items
      const hasTaskItems = React.Children.toArray(children).some((child: any) =>
        child?.props?.className?.includes('task-list-item')
      );

      return (
        <ul
          className={`my-2 ${hasTaskItems ? "task-list" : "pl-6 list-disc"} text-[14px] ${className || ""}`}
          role="list"
          {...props}
        >
          {children}
        </ul>
      );
    },
    ol: (props: any) => <ol className="pl-6 my-2 list-decimal text-[14px]" role="list" {...props} />,
    hr: () => <hr className="my-4 border-gray-200" />,
    strong: (props: any) => <strong className="text-orange-600 font-bold" {...props} />,
    em: (props: any) => <em className="text-amber-700 italic" {...props} />,
    del: (props: any) => <del className="line-through text-gray-500" {...props} />,
  };

  return (
    <div ref={markdownRef} className={`h-full overflow-auto p-4 text-sm ${className || ""}`}>
      <style jsx global>
        {taskListStyles}
      </style>
      <div className="markdown-body">
        <ReactMarkdown
          remarkPlugins={[
            [remarkGfm, { singleTilde: false }],
            remarkBreaks,
          ]}
          rehypePlugins={[
            rehypeRaw, 
            [rehypeSanitize, customSanitizeSchema]
          ]}
          components={components}
          urlTransform={(uri: string) => uri}
          skipHtml={false}
        >
          {processedContent}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default MarkdownRenderer;