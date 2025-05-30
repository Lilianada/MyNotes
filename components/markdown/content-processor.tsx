"use client";

import React, { useMemo, useRef, useEffect } from "react";
import { processInternalLinks, attachInternalLinkHandlers } from "@/lib/markdown-utils";
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
    // Only replace arrow notation, no em dash replacement
    return content.replace(/->/g, "→");
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
      let needsUpdate = false;
      
      // Check for arrow notation
      if (p.innerHTML.includes("->")) {
        p.innerHTML = p.innerHTML.replace(/->/g, "→");
        needsUpdate = true;
      }
      
      // If updates were made, re-process the node to handle any new links
      if (needsUpdate) {
        p.innerHTML = processInternalLinks(p.innerHTML, notes, navigateToNoteById);
        attachInternalLinkHandlers(p, navigateToNoteById);
      }
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
