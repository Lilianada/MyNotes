"use client";

import React, { useState, useEffect } from 'react';
import { useNotes } from '@/contexts/notes/note-context';
import { Tag, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface TagsDropdownProps {
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
}

export const TagsDropdown: React.FC<TagsDropdownProps> = ({
  selectedTag,
  onSelectTag,
}) => {
  const { notes } = useNotes();
  const [tagCounts, setTagCounts] = useState<{tag: string, count: number}[]>([]);

  // Calculate tag counts
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
    
    setTagCounts(tagsArray);
  }, [notes]);

  const totalTaggedNotes = tagCounts.reduce((sum, item) => sum + item.count, 0);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className={`flex items-center gap-2 ${selectedTag ? 'bg-blue-50 border-blue-200' : ''}`}
        >
          <Tag size={14} />
          <span>Tags</span>
          {selectedTag && (
            <Badge variant="secondary" className="ml-1 px-1 py-0 text-xs">
              1
            </Badge>
          )}
          <ChevronDown size={12} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {selectedTag && (
          <>
            <DropdownMenuItem onClick={() => onSelectTag(null)} className="text-blue-600">
              Clear filter
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        {tagCounts.length > 0 ? (
          tagCounts.map(({ tag, count }) => (
            <DropdownMenuItem
              key={tag}
              onClick={() => onSelectTag(tag)}
              className={`flex items-center justify-between ${
                selectedTag === tag ? 'bg-blue-50' : ''
              }`}
            >
              <span className="truncate">{tag}</span>
              <Badge variant="outline" className="ml-2 text-xs">
                {count}
              </Badge>
            </DropdownMenuItem>
          ))
        ) : (
          <DropdownMenuItem disabled>
            No tags found
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default TagsDropdown;
