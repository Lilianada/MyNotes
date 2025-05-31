"use client";

import { useMemo } from 'react';
import { Note } from '@/types';

interface TagInfo {
  tag: string;
  count: number;
}

export function useTagProcessing(allNotes: Note[]) {
  const sortedTags = useMemo(() => {
    // Create array of unique tags with usage counts
    const tagCounts = allNotes.reduce((acc: TagInfo[], note: Note) => {
      if (note.tags) {
        note.tags.forEach(tag => {
          const existingTag = acc.find(t => t.tag === tag);
          if (existingTag) {
            existingTag.count += 1;
          } else {
            acc.push({ tag, count: 1 });
          }
        });
      }
      return acc;
    }, []);
    
    // Sort by count (descending), then alphabetically
    return tagCounts.sort((a, b) => {
      // First by count (descending)
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      // Then alphabetically
      return a.tag.localeCompare(b.tag);
    });
  }, [allNotes]);

  return { sortedTags };
}
