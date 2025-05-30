
import { merge } from "lodash";
import { defaultSchema } from "rehype-sanitize";

// Create a custom schema for sanitization based on the default schema
// but with specific allowances for our needs
export const customSanitizeSchema = merge({}, defaultSchema, {
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
