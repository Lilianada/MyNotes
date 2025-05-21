"use client";

import React, { useState } from 'react';
import { Note } from '@/types';
import { Plus, Check, Trash2, Edit, Save, Hash, X } from 'lucide-react';

/**
 * This component manages a list of tags across all notes
 * and allows users to edit or delete existing tags or create new ones
 */
interface TagManagerSystemProps {
  allNotes: Note[];
  onUpdateTagAcrossNotes: (oldTag: string, newTag: string) => Promise<void>;
  onDeleteTagFromAllNotes: (tag: string) => Promise<void>;
  selectedTags?: string[];
  onSelectTag?: (tag: string) => void;
  maxTagsAllowed?: number;
}

export function TagManagerSystem({ 
  allNotes = [], 
  onUpdateTagAcrossNotes, 
  onDeleteTagFromAllNotes,
  selectedTags = [],
  onSelectTag,
  maxTagsAllowed = 5
}: TagManagerSystemProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editTagName, setEditTagName] = useState('');
  
  // Create array of unique tags with usage counts
  const tagCounts = allNotes.reduce((acc: {tag: string, count: number}[], note: Note) => {
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
  const sortedTags = tagCounts.sort((a, b) => {
    // First by count (descending)
    if (b.count !== a.count) {
      return b.count - a.count;
    }
    // Then alphabetically
    return a.tag.localeCompare(b.tag);
  });

  const handleCreateTag = () => {
    if (newTagName.trim() === '') return;
    
    // Check if a tag with the same name already exists
    const tagNameExists = sortedTags.some(
      tagInfo => tagInfo.tag.toLowerCase() === newTagName.trim().toLowerCase()
    );
    
    if (tagNameExists) {
      setNameError('A tag with this name already exists');
      return;
    }
    
    const newTag = newTagName.trim().toLowerCase();
    
    // Since this is a new tag, we'll create a placeholder with the old name as empty
    onUpdateTagAcrossNotes('', newTag);
    setIsCreating(false);
    setNewTagName('');
    setNameError(null);
  };

  const handleStartEditing = (tag: string) => {
    setEditingTag(tag);
    setEditTagName(tag);
  };
  
  const handleSaveEdit = (oldTag: string) => {
    if (editTagName.trim() === '') return;
    
    // Check if the name already exists (except for the current tag)
    const tagNameExists = sortedTags.some(
      tagInfo => tagInfo.tag !== oldTag && 
      tagInfo.tag.toLowerCase() === editTagName.trim().toLowerCase()
    );
    
    if (tagNameExists) {
      setNameError('A tag with this name already exists');
      return;
    }
    
    const newTag = editTagName.trim().toLowerCase();
    
    onUpdateTagAcrossNotes(oldTag, newTag)
      .then(() => {
        setEditingTag(null);
        setNameError(null);
      })
      .catch(error => {
        console.error('Failed to update tag:', error);
        setNameError('Failed to update tag');
      });
  };
  
  const handleCancelEdit = () => {
    setEditingTag(null);
    setNameError(null);
  };
  
  const handleDeleteTag = (tag: string) => {
    onDeleteTagFromAllNotes(tag)
      .then(() => {
        setShowDeleteConfirm(null);
      })
      .catch(error => {
        console.error('Failed to delete tag:', error);
      });
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium">Tags</h3>
        <span className="text-xs text-gray-500">
          {selectedTags.length} of {maxTagsAllowed} tags used
        </span>
      </div>
      
      {/* Currently selected tags */}
      {selectedTags.length > 0 && (
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
                  onClick={() => onSelectTag && onSelectTag(tag)}
                  className="text-blue-600 hover:text-red-500"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* List of existing tags */}
      <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-hide">
        {sortedTags.length > 0 ? (
          sortedTags.map(({ tag, count }) => (
            <div 
              key={tag}
              className={`flex items-center w-full p-2 rounded-md hover:bg-gray-50 
                ${selectedTags.includes(tag) ? 'bg-gray-100' : ''}`}
            >
              {editingTag === tag ? (
                // Edit mode
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <input
                      type="text"
                      value={editTagName}
                      onChange={(e) => {
                        setEditTagName(e.target.value);
                        setNameError(null);
                      }}
                      className={`flex-1 px-2 py-1 text-sm border rounded-md ${
                        nameError ? 'border-red-500' : 'border-gray-300'
                      }`}
                      autoFocus
                    />
                  </div>
                  
                  {nameError && (
                    <p className="text-xs text-red-500 mt-1 mb-1">{nameError}</p>
                  )}
                  
                  <div className="flex justify-end space-x-1">
                    <button
                      onClick={handleCancelEdit}
                      className="px-2 py-0.5 text-xs border border-gray-300 rounded-md"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSaveEdit(tag)}
                      disabled={!editTagName.trim()}
                      className="px-2 py-0.5 text-xs bg-blue-600 text-white rounded-md disabled:opacity-50"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                // View mode
                <>
                  <button
                    onClick={() => {
                      if (onSelectTag) {
                        // If tag is already selected, we can remove it regardless of the limit
                        if (selectedTags.includes(tag)) {
                          onSelectTag(tag);
                        } else {
                          // If we're at the tag limit, don't add more
                          if (selectedTags.length < maxTagsAllowed) {
                            onSelectTag(tag);
                          } else {
                            // Could show a toast or alert here about the limit
                            alert(`Maximum of ${maxTagsAllowed} tags per note allowed`);
                          }
                        }
                      }
                    }}
                    className={`flex items-center flex-1 text-left group ${
                      !selectedTags.includes(tag) && selectedTags.length >= maxTagsAllowed
                        ? 'opacity-50 cursor-not-allowed'
                        : ''
                    }`}
                    disabled={!selectedTags.includes(tag) && selectedTags.length >= maxTagsAllowed}
                  >
                    <Hash size={14} className="mr-2 text-blue-500" />
                    <span className="text-sm group-hover:text-blue-600">{tag}</span>
                    <span className="ml-2 text-xs text-gray-500">{count} {count === 1 ? 'note' : 'notes'}</span>
                    {selectedTags.includes(tag) && (
                      <Check size={14} className="ml-2 text-green-500" />
                    )}
                  </button>
                  
                  {/* Action buttons */}
                  <div className="flex">
                    {/* Edit button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartEditing(tag);
                      }}
                      className="p-1 text-gray-400 hover:text-blue-500"
                      title="Edit tag"
                    >
                      <Edit size={14} />
                    </button>
                    
                    {/* Delete button */}
                    {showDeleteConfirm === tag ? (
                      <div className="flex items-center ml-1 text-xs">
                        <button 
                          onClick={() => handleDeleteTag(tag)}
                          className="px-1.5 py-0.5 text-white bg-red-500 rounded hover:bg-red-600"
                        >
                          Yes
                        </button>
                        <button 
                          onClick={() => setShowDeleteConfirm(null)}
                          className="px-1.5 py-0.5 ml-1 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDeleteConfirm(tag);
                        }}
                        className="p-1 ml-1 text-gray-400 hover:text-red-500"
                        title="Delete tag"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500">No tags yet</p>
        )}
      </div>
      
      {/* Create new tag form */}
      {isCreating ? (
        <div className="border border-gray-200 rounded-md p-3 mt-2">
          <div className="mb-2">
            <label htmlFor="new-tag-name" className="sr-only">
              Tag Name
            </label>
            <input
              type="text"
              id="new-tag-name"
              value={newTagName}
              onChange={(e) => {
                setNewTagName(e.target.value);
                setNameError(null); // Clear error when input changes
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
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-2 py-1 text-xs border border-gray-300 rounded-md"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateTag}
              disabled={!newTagName.trim() || selectedTags.length >= maxTagsAllowed}
              className="px-2 py-1 text-xs bg-blue-600 text-white rounded-md disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsCreating(true)}
          className={`flex items-center text-sm text-blue-600 hover:text-blue-800 ${
            selectedTags.length >= maxTagsAllowed ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          disabled={selectedTags.length >= maxTagsAllowed}
        >
          <Plus size={14} className="mr-1" />
          Create new tag {selectedTags.length >= maxTagsAllowed && "(max tags reached)"}
        </button>
      )}
    </div>
  );
}

export default TagManagerSystem;
