
// Task list and code styles for markdown
export const markdownStyles = `
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
  
  /* Style for task lists */
  .task-list-item {
    display: flex !important;
    align-items: flex-start !important;
    margin: 0.2em 0 !important;
  }
  
  .task-list-item input[type="checkbox"] {
    margin-right: 0.5em !important;
    margin-top: 0.35em !important;
  }
  
  .task-list {
    list-style-type: none !important;
    padding-left: 0 !important;
  }
  
  .task-list li {
    padding-left: 1.5em !important;
  }
  
  /* Highlight language badge */
  .language-badge {
    position: absolute !important;
    top: 0 !important;
    right: 0 !important;
    font-size: 0.75rem !important;
    padding: 0.1rem 0.5rem !important;
    border-bottom-left-radius: 0.25rem !important;
    opacity: 0.8 !important;
  }
  
  /* Code block container */
  .code-block-wrapper {
    position: relative !important;
    margin: 1em 0 !important;
  }
  
  /* Table styles */
  table {
    border-collapse: collapse !important;
    width: 100% !important;
    margin: 1em 0 !important;
  }
  
  table th {
    font-weight: 600 !important;
    border: 1px solid #e5e7eb !important;
    padding: 0.5em !important;
    background-color: #f9fafb !important;
  }
  
  table td {
    border: 1px solid #e5e7eb !important;
    padding: 0.5em !important;
  }
  
  /* Quotes */
  blockquote {
    border-left: 4px solid #e5e7eb !important;
    padding-left: 1em !important;
    font-style: italic !important;
    color: #6b7280 !important;
    margin: 1em 0 !important;
  }
  
  /* Fix line breaks */
  .markdown-body br {
    display: block !important;
    content: "" !important;
    margin-top: 0.5em !important;
  }
  
  /* Internal links */
  a.internal-link {
    color: #2563eb !important;
    text-decoration: none !important;
    padding: 0.1em 0.3em !important;
    background-color: #eff6ff !important;
    border-radius: 0.25rem !important;
    transition: background-color 0.2s !important;
  }
  
  a.internal-link:hover {
    background-color: #dbeafe !important;
    text-decoration: underline !important;
  }
`;
