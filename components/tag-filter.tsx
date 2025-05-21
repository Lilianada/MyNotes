"use client";

import React, { useState, useEffect } from 'react';
import { useNotes } from '@/contexts/note-context';
import { Hash, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TagFilterProps {
  onSelectTag: (tag: string | null) => void;
  selectedTag: string | null;
}

export const TagFilter: React.FC<TagFilterProps> = ({ onSelectTag, selectedTag }) => {
  const { notes } = useNotes();
  const [allTags, setAllTags] = useState<{tag: string, count: number}[]>([]);
  
  // Extract all unique tags from notes with counts
  useEffect(() => {
    const tagsMap = new Map<string, number>();
    
    notes.forEach(note => {
      if (note.tags && note.tags.length > 0) {
        note.tags.forEach(tag => {
          tagsMap.set(tag, (tagsMap.get(tag) || 0) + 1);
        });
      }
    });
    
    // Convert map to array and sort by count (descending), then alphabetically
    const tagsArray = Array.from(tagsMap.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
    
    setAllTags(tagsArray);
  }, [notes]);

  if (allTags.length === 0) {
    return null;
  }

  return (
    <div className="px-4 pb-2">
      <div className="flex items-center mb-2">
        <Hash className="h-4 w-4 mr-2 text-gray-500" />
        <h2 className="text-sm font-medium">Filter by Tags</h2>
        {selectedTag && (
          <button 
            onClick={() => onSelectTag(null)}
            className="ml-auto text-xs text-blue-600 hover:text-blue-800"
          >
            Clear
          </button>
        )}
      </div>
      
      <ScrollArea className="max-h-32">
        <div className="flex flex-wrap gap-2">
          {allTags.map(({ tag, count }) => (
            <Badge
              key={tag}
              variant={selectedTag === tag ? "default" : "outline"}
              className={`cursor-pointer text-xs ${
                selectedTag === tag 
                  ? 'bg-blue-500 hover:bg-blue-600' 
                  : 'hover:bg-blue-100'
              }`}
              onClick={() => onSelectTag(selectedTag === tag ? null : tag)}
            >
              {tag} ({count})
            </Badge>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default TagFilter;
