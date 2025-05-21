"use client";

import React, { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, Plus } from 'lucide-react';

interface TagManagerProps {
  tags: string[];
  onUpdateTags: (tags: string[]) => void;
}

/**
 * Tag Manager component that handles tag creation and deletion
 * without directly modifying the data store
 */
const TagManagerV2: React.FC<TagManagerProps> = ({ 
  tags = [], 
  onUpdateTags 
}) => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  const handleAddTag = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (inputValue.trim()) {
      const newTag = inputValue.trim().toLowerCase();
      
      // Prevent duplicate tags
      if (!tags.includes(newTag)) {
        const updatedTags = [...tags, newTag];
        onUpdateTags(updatedTags);
      }
      
      setInputValue('');
      inputRef.current?.focus();
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = tags.filter(tag => tag !== tagToRemove);
    onUpdateTags(updatedTags);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      // Remove the last tag when backspace is pressed in an empty input
      const updatedTags = [...tags];
      const removedTag = updatedTags.pop();
      onUpdateTags(updatedTags);
      
      if (removedTag) {
        setInputValue(removedTag);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 mt-2">
        {tags.map(tag => (
          <div 
            key={tag} 
            className="flex items-center bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full px-3 py-1 text-sm"
          >
            <span className="mr-1">#{tag}</span>
            <button
              type="button"
              onClick={() => handleRemoveTag(tag)}
              className="hover:text-red-500 focus:outline-none"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      
      <form onSubmit={handleAddTag} className="flex space-x-2">
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a tag..."
          className="flex-1"
        />
        <Button
          type="submit"
          variant="outline"
          size="sm"
          disabled={!inputValue.trim()}
        >
          <Plus size={16} className="mr-1" />
          Add
        </Button>
      </form>
    </div>
  );
};

export default TagManagerV2;
