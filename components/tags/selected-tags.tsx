"use client";

import React from 'react';
import { X } from 'lucide-react';

interface SelectedTagsProps {
  selectedTags: string[];
  onSelectTag: (tag: string) => void;
  maxTagsAllowed: number;
}

export function SelectedTags({ selectedTags, onSelectTag, maxTagsAllowed }: SelectedTagsProps) {
  if (selectedTags.length === 0) return null;

  return (
    <div className="mb-4">
      <h4 className="text-xs font-medium text-gray-500 mb-2">Current tags:</h4>
      <div className="flex flex-wrap gap-2">
        {selectedTags.map(tag => (
          <div 
            key={tag} 
            className="flex items-center bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-sm"
          >
            <span className="mr-1">#{tag}</span>
            <button
              onClick={() => onSelectTag(tag)}
              className="text-blue-600 hover:text-red-500 hover:bg-red-100 rounded-full p-0.5 transition-colors"
              aria-label={`Remove tag ${tag}`}
              title="Remove tag"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      
      {/* Show warning message when tag limit is reached */}
      {selectedTags.length >= maxTagsAllowed && (
        <p className="text-xs text-orange-500 mt-2 font-medium">
          Maximum of {maxTagsAllowed} tags reached. Remove a tag to add another.
        </p>
      )}
    </div>
  );
}
