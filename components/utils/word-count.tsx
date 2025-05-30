"use client";

import React, { useEffect, useState } from 'react';
import { formatWordCount, countWords } from '@/lib/word-count';
import { Copy, Check } from 'lucide-react';

interface WordCountProps {
  content: string;
}

export function WordCount({ content }: WordCountProps) {
  const [displayedCount, setDisplayedCount] = useState<number | null>(null);
  const [debouncedContent, setDebouncedContent] = useState(content);
  const [copied, setCopied] = useState(false);
  
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
  
  // Reset copied state after 2 seconds
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => {
        setCopied(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };
  
  if (displayedCount === null) return null;
  
  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={handleCopy}
        className="text-gray-500 hover:text-blue-500 focus:outline-none p-1 rounded-md hover:bg-gray-100 transition-colors"
        title="Copy markdown content"
      >
        {copied ? (
          <Check size={16} className="text-green-500" />
        ) : (
          <Copy size={16} />
        )}
      </button>
      <div className="text-xs text-gray-500 px-2 py-1 inline-flex items-center rounded bg-gray-100">
        {formatWordCount(displayedCount)}
      </div>
    </div>
  );
}

export default WordCount;
