"use client";

import React, { useState, useEffect, useMemo } from "react";

interface EditorPreviewRendererProps {
  content: string;
  onChangeContent?: (newContent: string) => void;
  className?: string;
}

/**
 * EditorPreviewRenderer component that provides a live preview of the Markdown
 * editor content with special handling for backticks and dashes.
 */
const EditorPreviewRenderer: React.FC<EditorPreviewRendererProps> = ({
  content,
  onChangeContent,
  className = "",
}) => {
  // State to store processed content
  const [processedContent, setProcessedContent] = useState<string>(content);

  // Process content for special characters and backticks
  useEffect(() => {
    // Handle special character conversion without affecting code blocks
    let newContent = content;
    
    // Function to extract code blocks to avoid processing them
    const extractCodeBlocks = (text: string) => {
      const codeBlockRegex = /```[\s\S]*?```|`[^`]*`|``[^`]*``/g;
      const blocks: string[] = [];
      const markers: string[] = [];
      
      // Replace code blocks with placeholders
      let result = text.replace(codeBlockRegex, (match) => {
        const marker = `##CODE_BLOCK_${blocks.length}##`;
        blocks.push(match);
        markers.push(marker);
        return marker;
      });
      
      return { 
        blocks,
        markers,
        text: result
      };
    };
    
    // Extract code blocks to protect them from processing
    const { blocks, markers, text } = extractCodeBlocks(newContent);
    
    // Process text outside code blocks
    let processedText = text;
    
    // Apply character replacements outside of code blocks
    processedText = processedText
      // Convert -> to right arrow (→)
      .replace(/->/g, "→")
      // Convert -- to em dash (—), but not --- (which is an HR in Markdown)
      .replace(/([^-])--([^-])/g, "$1—$2");
    
    // Re-insert code blocks
    markers.forEach((marker, index) => {
      processedText = processedText.replace(marker, blocks[index]);
    });
    
    // Update the processed content
    setProcessedContent(processedText);
    
    // Update original content if needed and if changed
    if (onChangeContent && processedText !== content) {
      onChangeContent(processedText);
    }
  }, [content, onChangeContent]);

  // Render the content with syntax highlighting for code blocks
  const renderContent = useMemo(() => {
    // Replace backticks with styled spans for preview
    let result = processedContent;
    
    // 1. Handle triple backtick code blocks with language
    result = result.replace(
      /```(\w+)?\n([\s\S]*?)```/g, 
      '<pre class="code-block-preview"><span class="code-lang">$1</span><code>$2</code></pre>'
    );
    
    // 2. Handle triple backtick code blocks without language
    result = result.replace(
      /```\n([\s\S]*?)```/g, 
      '<pre class="code-block-preview"><span class="code-lang">text</span><code>$1</code></pre>'
    );
    
    // 3. Handle double backtick inline code (with potential backticks inside)
    result = result.replace(
      /``(.*?)``/g, 
      '<span class="inline-code-preview">$1</span>'
    );
    
    // 4. Handle single backtick inline code (standard case)
    result = result.replace(
      /`([^`]+)`/g, 
      '<span class="inline-code-preview">$1</span>'
    );
    
    return result;
  }, [processedContent]);
  
  return (
    <div 
      className={`editor-preview ${className}`}
      dangerouslySetInnerHTML={{ __html: renderContent }}
    />
  );
};

export default EditorPreviewRenderer;
