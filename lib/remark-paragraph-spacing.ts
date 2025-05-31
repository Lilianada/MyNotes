"use client";

/**
 * Simple remark plugin to improve paragraph spacing
 */
export function remarkParagraphSpacing() {
  return function transformer(tree: any) {
    // Skip the complex AST manipulation for now
    // The CSS styles will handle the spacing improvements
    return tree;
  };
}
