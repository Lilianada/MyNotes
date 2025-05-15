"use client";

import React, { useCallback, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
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

// Register commonly used languages
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('js', javascript); // alias
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('ts', typescript); // alias
hljs.registerLanguage('python', python);
hljs.registerLanguage('py', python); // alias
hljs.registerLanguage('css', css);
hljs.registerLanguage('html', html);
hljs.registerLanguage('xml', html); // html is actually XML in highlight.js
hljs.registerLanguage('json', json);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('sh', bash); // alias
hljs.registerLanguage('markdown', markdown);
hljs.registerLanguage('md', markdown); // alias
hljs.registerLanguage('sql', sql);

// Set default options for better error handling
hljs.configure({
  ignoreUnescapedHTML: true, // Ignore unsafe HTML in code blocks
  throwUnescapedHTML: false, // Don't throw errors for HTML in code
  languages: ['plaintext'] // Always have plaintext as a fallback
});

interface MarkdownRendererProps {
  content: string;
  onChange?: (newContent: string) => void;
  className?: string;
}

const taskListStyles = `
  ul.task-list {
    list-style: none !important;
    padding-left: 0 !important;
    margin-left: 0 !important;
  }
  
  li.task-list-item {
    list-style-type: none !important;
    padding-left: 0 !important;
    margin-left: 0 !important;
    display: flex;
  }
  
  li.task-list-item::before {
    content: none !important;
  }
`;
const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  onChange,
  className,
}) => {
  const markdownRef = useRef<HTMLDivElement>(null);

  // We'll handle highlighting for each code block individually in the code component
  // This effect will handle any global markdown container setup
  useEffect(() => {
    if (!markdownRef.current) return;
    
    // Add data attribute to prevent duplicate highlighting
    const codeBlocks = markdownRef.current.querySelectorAll("pre code:not([data-initialized])");
    codeBlocks.forEach((block) => {
      block.setAttribute('data-initialized', 'true');
    });
    
  }, [content]);

  // Handle checkbox changes
  const handleCheckboxChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!onChange) return;

      const checkbox = event.target;
      const listItem = checkbox.closest("li");
      if (!listItem) return;

      const listItemText = listItem.textContent || "";
      const isChecked = checkbox.checked;

      // Replace only the first matching task list item
      const taskItemRegex = new RegExp(
        `- \\[${isChecked ? " " : "x"}\\] (.+?)(?=\\n|$)`,
        "i"
      );
      const replacement = `- [${isChecked ? "x" : " "}] $1`;

      const newContent = content.replace(taskItemRegex, replacement);
      onChange(newContent);
    },
    [content, onChange]
  );

  // Add event listeners for checkboxes
  useEffect(() => {
    if (!markdownRef.current || !onChange) return;

    const checkboxes = markdownRef.current.querySelectorAll(
      'input[type="checkbox"]'
    );

    const handleChange = (e: Event) => {
      handleCheckboxChange(e as unknown as React.ChangeEvent<HTMLInputElement>);
    };

    checkboxes.forEach((checkbox) => {
      checkbox.addEventListener("change", handleChange);
    });

    return () => {
      checkboxes.forEach((checkbox) => {
        checkbox.removeEventListener("change", handleChange);
      });
    };
  }, [content, handleCheckboxChange, onChange]);

  // Custom component renderers
  const components = {
    // Make checkboxes interactive
    li: ({ node, ...props }: { node: any; [key: string]: any }) => {
      const { children } = props;

      try {
        // Check if this is a task item (first child is paragraph with first child as text starting with [ ] or [x])
        if (
          node?.children?.[0]?.type === "paragraph" &&
          node?.children[0]?.children?.[0]?.type === "text" &&
          /^\[[ x]\]\s/.test(node?.children[0]?.children[0]?.value || "")
        ) {
          const checked = (
            node?.children[0]?.children[0]?.value || ""
          ).startsWith("[x]");
          const textContent = (
            node?.children[0]?.children[0]?.value || ""
          ).replace(/^\[[ x]\]\s/, "");

          return (
            <li
              {...props}
              className="task-list-item my-1 !list-none"
              style={{
                listStyleType: "none !important",
                paddingLeft: 0,
                marginLeft: 0,
                display: "flex",
              }}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => {
                  if (onChange) {
                    const isNowChecked = e.currentTarget.checked;
                    const oldMark = isNowChecked ? "[ ]" : "[x]";
                    const newMark = isNowChecked ? "[x]" : "[ ]";
                    const newContent = content.replace(
                      `- ${oldMark} ${textContent}`,
                      `- ${newMark} ${textContent}`
                    );
                    onChange(newContent);
                  }
                }}
                className="mt-1 mr-2 h-4 w-4 rounded-sm bg-white border border-gray-300 flex-shrink-0"
              />
              <span className={checked ? "line-through text-gray-500" : ""}>
                {textContent}
              </span>
            </li>
          );
        }
      } catch (error) {
        console.error("Error rendering task list item:", error);
      }

      // Regular list item
      return (
        <li {...props} className="my-1">
          {children}
        </li>
      );
    },

    // Style code blocks
code: ({
  node,
  inline,
  className,
  children,
  ...props
}: {
  node?: any;
  inline?: boolean;
  className?: string;
  children: React.ReactNode;
  [key: string]: any;
}) => {
  // Extract language from className if present
  const match = /language-(\w+)/.exec(className || "");
  const languageSpecified = match ? match[1].toLowerCase() : null;
  
  // Safely determine if a language is supported 
  const getSupportedLanguage = (lang?: string | null): string => {
    if (!lang) return "plaintext";
    
    try {
      // Test if the language is supported
      return hljs.getLanguage(lang) ? lang : "plaintext";
    } catch (e) {
      return "plaintext";
    }
  };

  // Get safe language
  const safeLanguage = getSupportedLanguage(languageSpecified);
  
  // Special handling for common non-standard language identifiers
  const normalizeLanguage = (lang: string | null): string | null => {
    if (!lang) return null;
    
    // Map non-standard language names to standard ones
    const langMap: Record<string, string> = {
      'jsx': 'javascript',
      'tsx': 'typescript',
      'vue': 'html',
      'yml': 'yaml',
      'shell': 'bash',
      'zsh': 'bash',
      'console': 'bash',
      'text': 'plaintext',
      'txt': 'plaintext',
      'code': 'plaintext'
    };
    
    return langMap[lang.toLowerCase()] || lang;
  };
  
  const normalizedLanguage = normalizeLanguage(languageSpecified);
  const finalSafeLanguage = normalizedLanguage ? getSupportedLanguage(normalizedLanguage) : safeLanguage;
  
  // Handle code block
  if (!inline) {
    // Create a unique key for this code block to avoid highlight.js conflicts
    const codeKey = `code-${Math.random().toString(36).substring(2, 9)}`;
    
    // Add effect for highlighting
    useEffect(() => {
      if (!markdownRef.current) return;
      
      try {
        // Reference element by the unique key
        const codeElement = markdownRef.current.querySelector(`[data-code-id="${codeKey}"]`);
        if (codeElement && !codeElement.hasAttribute('data-highlighted')) {
          // Set a flag to prevent duplicate highlighting
          codeElement.setAttribute('data-highlighted', 'true');
          
          // Apply highlighting with safety checks
          try {
            hljs.highlightElement(codeElement as HTMLElement);
          } catch (highlightError) {
            console.warn("Highlight.js error:", highlightError);
            
            // If highlighting fails, apply a simple plaintext class as fallback
            (codeElement as HTMLElement).className = 'language-plaintext';
            (codeElement as HTMLElement).style.backgroundColor = '#f5f5f5';
          }
        }
      } catch (error) {
        console.warn("Highlighting process failed:", error);
      }
    }, [codeKey, children]);

    // Get language display name and style class
    const getLanguageDisplay = (lang: string | null): { display: string, class: string } => {
      if (!lang) return { display: "text", class: "bg-gray-100 text-gray-600" };
      
      // Map common languages to nice displays and colors
      const langMap: Record<string, { display: string, class: string }> = {
        javascript: { display: "JavaScript", class: "bg-yellow-100 text-yellow-800" },
        js: { display: "JavaScript", class: "bg-yellow-100 text-yellow-800" },
        typescript: { display: "TypeScript", class: "bg-blue-100 text-blue-800" },
        ts: { display: "TypeScript", class: "bg-blue-100 text-blue-800" },
        python: { display: "Python", class: "bg-green-100 text-green-800" },
        py: { display: "Python", class: "bg-green-100 text-green-800" },
        css: { display: "CSS", class: "bg-purple-100 text-purple-800" },
        html: { display: "HTML", class: "bg-orange-100 text-orange-800" },
        xml: { display: "XML", class: "bg-orange-100 text-orange-800" },
        json: { display: "JSON", class: "bg-amber-100 text-amber-800" },
        bash: { display: "Bash", class: "bg-gray-200 text-gray-800" },
        sh: { display: "Shell", class: "bg-gray-200 text-gray-800" },
        sql: { display: "SQL", class: "bg-cyan-100 text-cyan-800" },
        markdown: { display: "Markdown", class: "bg-indigo-100 text-indigo-800" },
        md: { display: "Markdown", class: "bg-indigo-100 text-indigo-800" },
      };
      
      return langMap[lang.toLowerCase()] || { 
        display: lang.charAt(0).toUpperCase() + lang.slice(1), 
        class: "bg-gray-100 text-gray-600" 
      };
    };
    
    const langInfo = getLanguageDisplay(languageSpecified);

    return (
      <pre 
        className="bg-slate-50 border border-slate-200 p-4 rounded-md my-4 overflow-auto shadow-sm relative" 
        data-language={languageSpecified || "text"}
      >
        <div className={`absolute top-0 right-0 px-2 py-1 text-xs rounded-bl ${langInfo.class}`} style={{ fontSize: '10px' }}>
          {langInfo.display}
        </div>
        <code
          data-code-id={codeKey}
          className={`font-mono text-sm block text-slate-800 language-${finalSafeLanguage} pt-5`}
          {...props}
        >
          {children}
        </code>
      </pre>
    );
  }
  
  return inline ? (
    <code
      className="bg-rose-50 px-1.5 py-0.5 rounded font-mono text-xs text-rose-700 border-rose-100 border"
      style={{ 
        display: "inline-block", 
        lineHeight: "normal",
        whiteSpace: "pre",
        maxWidth: "100%",
        verticalAlign: "middle"
      }}
      {...props}
    >
      {children}
    </code>
  ) : (
    <pre className="bg-slate-50 border border-slate-200 p-4 rounded-md my-4 overflow-auto shadow-sm">
      <code className="font-mono text-sm block text-slate-800" {...props}>
        {children}
      </code>
    </pre>
  );
},

    // Style headings
    h1: ({ children }: { children: React.ReactNode }) => (
      <h1 className="text-2xl font-bold my-4 text-indigo-700">{children}</h1>
    ),
    h2: ({ children }: { children: React.ReactNode }) => (
      <h2 className="text-xl font-bold my-3 text-blue-700">{children}</h2>
    ),
    h3: ({ children }: { children: React.ReactNode }) => (
      <h3 className="text-lg font-bold my-2 text-cyan-700">{children}</h3>
    ),
    h4: ({ children }: { children: React.ReactNode }) => (
      <h4 className="text-base font-bold my-2 text-teal-700">{children}</h4>
    ),
    h5: ({ children }: { children: React.ReactNode }) => (
      <h5 className="text-sm font-bold my-1 text-green-700">{children}</h5>
    ),
    h6: ({ children }: { children: React.ReactNode }) => (
      <h6 className="text-xs font-bold my-1 text-emerald-700">{children}</h6>
    ),

    // Style other elements
    p: ({ children }: { children: React.ReactNode }) => (
      <p className="my-2 leading-relaxed text-gray-800 text-[14px]">
        {children}
      </p>
    ),
    a: ({
      children,
      href,
      ...props
    }: React.ClassAttributes<HTMLAnchorElement> &
      React.AnchorHTMLAttributes<HTMLAnchorElement> & {
        children?: React.ReactNode;
      }) => (
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
    img: ({
      src,
      alt,
      title,
    }: {
      src?: string;
      alt?: string;
      title?: string;
    }) => (
      <img
        src={src}
        alt={alt || ""}
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
    thead: ({ children }: { children: React.ReactNode }) => (
      <thead className="bg-gray-50">{children}</thead>
    ),
    th: ({ children }: { children: React.ReactNode }) => (
      <th className="border border-gray-200 px-4 py-2 text-left font-medium text-gray-700">
        {children}
      </th>
    ),
    td: ({ children }: { children: React.ReactNode }) => (
      <td className="border border-gray-200 px-4 py-2">{children}</td>
    ),
    tr: ({ children }: { children: React.ReactNode }) => (
      <tr className="hover:bg-gray-50 transition-colors">{children}</tr>
    ),
    
    ul: ({
      children,
      className,
      ...props
    }: {
      children: React.ReactNode;
      className?: string;
    }) => {
      // Check if this list contains task items
      const hasTaskItems = React.Children.toArray(children).some((child: any) =>
        child?.props?.node?.children?.[0]?.children?.[0]?.value?.startsWith("[")
      );

      return (
        <ul
          className={`my-2 ${
            hasTaskItems ? "task-list pl-0" : "pl-6 list-disc"
          } text-[14px] ${className || ""}`}
          style={hasTaskItems ? { listStyle: "none" } : {}}
          {...props}
        >
          {children}
        </ul>
      );
    },
    ol: ({ children }: { children: React.ReactNode }) => (
      <ol className="pl-6 my-2 list-decimal text-[14px]">{children}</ol>
    ),
    hr: () => <hr className="my-4 border-gray-200" />,
    strong: ({ children }: { children: React.ReactNode }) => (
      <strong className="text-orange-600 font-bold">{children}</strong>
    ),
    em: ({ children }: { children: React.ReactNode }) => (
      <em className="text-amber-700 italic">{children}</em>
    ),
    del: ({ children }: { children: React.ReactNode }) => (
      <del className="line-through text-gray-500">{children}</del>
    ),
  };

  if (!content) return null;

  return (
    <div
      ref={markdownRef}
      className={`h-full overflow-auto p-4 text-sm ${className || ""}`}
    >
      <style jsx global>
        {taskListStyles}
      </style>
      <div className="markdown-body">
        <ReactMarkdown
          remarkPlugins={[
            [remarkGfm, { singleTilde: false }], // Enable GFM with task lists
            remarkBreaks,
          ]}
          rehypePlugins={[rehypeRaw, rehypeSanitize]}
          components={components}
          urlTransform={(uri: string) => uri} // Don't transform valid URIs
          skipHtml={false} // Allow HTML in markdown
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default MarkdownRenderer;
