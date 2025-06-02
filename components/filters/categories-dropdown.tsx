"use client";

import React, { useState, useEffect } from 'react';
import { useNotes } from '@/contexts/notes/note-context';
import { useUserPreferences } from '@/contexts/user-preferences-context';
import { Folder, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface CategoriesDropdownProps {
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

export const CategoriesDropdown: React.FC<CategoriesDropdownProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  const { notes } = useNotes();
  const { addRecentCategory } = useUserPreferences();
  const [categoryCounts, setCategoryCounts] = useState<{
    id: string;
    name: string;
    color: string;
    count: number;
  }[]>([]);

  // Calculate category counts
  useEffect(() => {
    const categoriesMap = new Map<string, {
      id: string;
      name: string;
      color: string;
      count: number;
    }>();
    
    notes.forEach(note => {
      if (note.category) {
        const existing = categoriesMap.get(note.category.id);
        if (existing) {
          existing.count += 1;
        } else {
          categoriesMap.set(note.category.id, {
            id: note.category.id,
            name: note.category.name,
            color: note.category.color,
            count: 1,
          });
        }
      }
    });
    
    // Convert map to array and sort by count (descending), then alphabetically
    const categoriesArray = Array.from(categoriesMap.values())
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    
    setCategoryCounts(categoriesArray);
  }, [notes]);

  const selectedCategoryInfo = categoryCounts.find(cat => cat.id === selectedCategory);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className={`flex items-center gap-2 ${selectedCategory ? 'bg-blue-50 border-blue-200' : ''}`}
        >
          <Folder size={14} />
          <span>Categories</span>
          {selectedCategory && (
            <Badge variant="secondary" className="ml-1 px-1 py-0 text-xs">
              1
            </Badge>
          )}
          <ChevronDown size={12} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {selectedCategory && (
          <>
            <DropdownMenuItem onClick={() => onSelectCategory(null)} className="text-blue-600">
              Clear filter
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        {categoryCounts.length > 0 ? (
          categoryCounts.map(({ id, name, color, count }) => (
            <DropdownMenuItem
              key={id}
              onClick={() => {
                onSelectCategory(id);
                addRecentCategory(name); // Track recent category usage
              }}
              className={`flex items-center justify-between ${
                selectedCategory === id ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="truncate">{name}</span>
              </div>
              <Badge variant="outline" className="ml-2 text-xs">
                {count}
              </Badge>
            </DropdownMenuItem>
          ))
        ) : (
          <DropdownMenuItem disabled>
            No categories found
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CategoriesDropdown;
