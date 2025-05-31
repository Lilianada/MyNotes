"use client";

import React, { useMemo, useRef, useEffect } from "react";
import { processInternalLinks, attachInternalLinkHandlers } from "@/lib/markdown/markdown-utils";
import { useNotes } from "@/contexts/notes/note-context";

interface ContentProcessorProps {
  content: string;
  markdownRef: React.RefObject<HTMLDivElement>;
}

export const useContentProcessor = (content: string, markdownRef: React.RefObject<HTMLDivElement>) => {
  const { notes, selectNote } = useNotes();
  
  // Navigation function for internal links
  const navigateToNoteById = (id: number) => {
    selectNote(id);
  };
  
  // Handle auto-replacement of symbols before rendering
  const processedContent = useMemo(() => {
    // Monaco editor already handles arrow conversion, so we don't need to do it here
    return content;
  }, [content]);

  // Post-processing after rendering
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
      // Process internal links without any arrow replacement since Monaco already handles it
      p.innerHTML = processInternalLinks(p.innerHTML, notes, navigateToNoteById);
      attachInternalLinkHandlers(p, navigateToNoteById);
    });
    
    // Fix task list attributes
    const taskListItems = markdownRef.current.querySelectorAll(".task-list-item input[type='checkbox']");
    taskListItems.forEach((checkbox) => {
      checkbox.setAttribute('aria-checked', (checkbox as HTMLInputElement).checked ? 'true' : 'false');
    });
    
    // Handle internal links that might not be handled by React components
    const internalLinks = markdownRef.current.querySelectorAll("a.internal-link:not([data-handler])");
    attachInternalLinkHandlers(markdownRef.current, navigateToNoteById);
  }, [markdownRef, content, notes, navigateToNoteById]);

  return processedContent;
};
