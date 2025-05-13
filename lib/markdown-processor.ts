"use client";

/**
 * @deprecated - This file is kept for backward compatibility.
 * Please use the ModernMarkdownRenderer component instead.
 */

// Utility functions for processing markdown text
export class MarkdownProcessor {
  // HTML escaping for security
  static escapeHTML(str: string) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Helper function to create slug IDs for headings
  static slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "") // Remove non-word chars
      .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ""); // Trim hyphens from start and end
  }

  // Placeholder function to ensure backward compatibility
  static markdownToHTML(text: string): string {
    console.warn("MarkdownProcessor is deprecated. Please use ModernMarkdownRenderer component instead.");
    return `<p>${this.escapeHTML(text)}</p>`;
  }

  // Basic syntax highlighter (deprecated - using highlight.js instead)
  static highlightSyntax(code: string, language: string): string {
    console.warn("MarkdownProcessor.highlightSyntax is deprecated. Please use highlight.js instead.");
    return this.escapeHTML(code);
  }
  
  // Process inline markdown (deprecated)
  static processInlineMarkdown(line: string): string {
    console.warn("MarkdownProcessor.processInlineMarkdown is deprecated.");
    return this.escapeHTML(line);
  }

  // All other markdown processing methods are deprecated
  // The following methods are kept as stubs for compatibility
  static processCodeBlocks(text: string): string {
    console.warn("MarkdownProcessor.processCodeBlocks is deprecated.");
    return text;
  }

  static processTables(text: string): string {
    console.warn("MarkdownProcessor.processTables is deprecated.");
    return text;
  }

  static processBlockquotes(text: string): string {
    console.warn("MarkdownProcessor.processBlockquotes is deprecated.");
    return text;
  }

  static processLists(text: string): string {
    console.warn("MarkdownProcessor.processLists is deprecated.");
    return text;
  }

  static processHeadings(text: string): string {
    console.warn("MarkdownProcessor.processHeadings is deprecated.");
    return text;
  }
}
