"use client";

import React, { useEffect, useState } from 'react';
import { formatWordCount, countWords } from '@/lib/word-count';

interface WordCountProps {
  content: string;
}

export function WordCount({ content }: WordCountProps) {
  const [displayedCount, setDisplayedCount] = useState<number | null>(null);
  const [debouncedContent, setDebouncedContent] = useState(content);
  
  // Update the debounced content with a delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedContent(content);
    }, 500); // 500ms debounce delay
    
    return () => clearTimeout(timer);
  }, [content]);
  
  // Calculate word count when debounced content changes
  useEffect(() => {
    // Use the same word count function used in the library
    const count = countWords(debouncedContent);
    setDisplayedCount(count);
  }, [debouncedContent]);
  
  if (displayedCount === null) return null;
  
  return (
    <div className="text-xs text-gray-500 px-2 py-1 inline-flex items-center rounded bg-gray-100">
      {formatWordCount(displayedCount)}
    </div>
  );
}

export default WordCount;
