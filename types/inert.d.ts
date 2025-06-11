// Type definitions for the HTML inert attribute
// This allows us to use the inert attribute in our React components

import 'react';

declare module 'react' {
  interface HTMLAttributes<T> {
    /**
     * The inert attribute is a boolean attribute that indicates that the element and all its descendants
     * are to be made inert (non-interactive and hidden from assistive technologies).
     * 
     * This is useful for accessibility, as it properly removes elements from the accessibility tree
     * and prevents focus on them, unlike aria-hidden which only hides from screen readers but not focus.
     */
    inert?: '' | boolean;
  }
}
