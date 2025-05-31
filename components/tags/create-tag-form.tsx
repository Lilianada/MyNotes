"use client";

import React, { useState } from 'react';
import { Plus } from 'lucide-react';

interface CreateTagFormProps {
  onCreateTag: (tagName: string) => Promise<void>;
  maxTagsAllowed: number;
  selectedTagsCount: number;
}

export function CreateTagForm({ onCreateTag, maxTagsAllowed, selectedTagsCount }: CreateTagFormProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);

  const handleCreateTag = async () => {
    const trimmedTagName = newTagName.trim();
    if (!trimmedTagName) {
      setNameError('Please enter a tag name');
      return;
    }

    try {
      await onCreateTag(trimmedTagName);
      setNewTagName('');
      setNameError(null);
    } catch (error: any) {
      setNameError(error.message || 'Failed to create tag. Please try again.');
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setNewTagName('');
    setNameError(null);
  };

  if (!isCreating) {
    return (
      <button
        onClick={() => setIsCreating(true)}
        className="flex items-center text-sm text-blue-600 hover:text-blue-800"
      >
        <Plus size={14} className="mr-1" />
        Create new tag
      </button>
    );
  }

  return (
    <div className="border border-gray-200 rounded-md p-3 mt-2">
      <div className="mb-2">
        <label htmlFor="new-tag-name" className="block text-xs font-medium text-gray-700 mb-1">
          Create a new tag
        </label>
        <input
          type="text"
          id="new-tag-name"
          value={newTagName}
          onChange={(e) => {
            setNewTagName(e.target.value);
            setNameError(null);
          }}
          placeholder="Enter tag name"
          className={`w-full px-2 py-1 text-sm border rounded-md ${
            nameError ? 'border-red-500' : 'border-gray-300'
          }`}
          autoFocus
        />
        {nameError && (
          <p className="text-xs text-red-500 mt-1">{nameError}</p>
        )}
        {selectedTagsCount >= maxTagsAllowed && (
          <p className="text-xs text-orange-500 mt-1">
            <strong>Note:</strong> Tag limit reached ({maxTagsAllowed}). You can still create the tag, but it won't be added to the current note.
          </p>
        )}
      </div>
      
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={handleCancel}
            className="px-2 py-1 text-xs border border-gray-300 rounded-md"
          >
            Done
          </button>
          <button
            type="button"
            onClick={handleCreateTag}
            disabled={!newTagName.trim()}
            className="px-2 py-1 text-xs bg-blue-600 text-white rounded-md disabled:opacity-50"
          >
            Create Tag
          </button>
        </div>
      </div>
    </div>
  );
}
