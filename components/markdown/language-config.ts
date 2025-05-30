
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
export const LANGUAGE_ALIASES: Record<string, string> = {
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
export const LANGUAGE_DISPLAY: Record<string, { display: string, class: string }> = {
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
export const registerLanguages = () => {
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
};

export default hljs;
