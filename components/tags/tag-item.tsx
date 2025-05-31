"use client";

import React, { useState } from 'react';
import { Check, Trash2, Edit, Hash, X } from 'lucide-react';

interface TagItemProps {
  tag: string;
  count: number;
  isSelected: boolean;
  onSelectTag: (tag: string) => void;
  onUpdateTag: (oldTag: string, newTag: string) => Promise<void>;
  onDeleteTag: (tag: string) => Promise<void>;
  canSelectMoreTags: boolean;
  existingTags: string[];
}

export function TagItem({ 
  tag, 
  count, 
  isSelected, 
  onSelectTag, 
  onUpdateTag, 
  onDeleteTag, 
  canSelectMoreTags,
  existingTags
}: TagItemProps) {
  const [editingTag, setEditingTag] = useState(false);
  const [editTagName, setEditTagName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleStartEditing = () => {
    setEditingTag(true);
    setEditTagName(tag);
    setNameError(null);
  };

  const handleSaveEdit = async () => {
    if (editTagName.trim() === '') return;
    
    const newTag = editTagName.trim().toLowerCase();
    console.log(`[TAG UI] Attempting to edit tag: "${tag}" → "${newTag}"`);
    
    // No change case
    if (tag.toLowerCase() === newTag) {
      console.log(`[TAG UI] No change in tag name, canceling edit`);
      setEditingTag(false);
      setNameError(null);
      return;
    }
    
    // Check if the name already exists (except for the current tag)
    const tagNameExists = existingTags.some(
      existingTag => existingTag !== tag && 
      existingTag.toLowerCase() === newTag
    );
    
    if (tagNameExists) {
      console.log(`[TAG UI] Tag name "${newTag}" already exists`);
      setNameError('A tag with this name already exists');
      return;
    }
    
    try {
      console.log(`[TAG UI] Saving tag edit: "${tag}" → "${newTag}"`);
      await onUpdateTag(tag, newTag);
      console.log(`[TAG UI] Tag successfully updated: "${tag}" → "${newTag}"`);
      setEditingTag(false);
      setNameError(null);
    } catch (error) {
      console.error('[TAG UI] Failed to update tag:', error);
      setNameError('Failed to update tag');
    }
  };

  const handleCancelEdit = () => {
    setEditingTag(false);
    setNameError(null);
  };

  const handleDeleteTag = async () => {
    console.log(`[TAG UI] Attempting to delete tag: "${tag}"`);
    
    try {
      await onDeleteTag(tag);
      console.log(`[TAG UI] Tag successfully deleted: "${tag}"`);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('[TAG UI] Failed to delete tag:', error);
    }
  };

  const handleTagSelect = () => {
    if (!isSelected && !canSelectMoreTags) return;
    onSelectTag(tag);
  };

  return (
    <div 
      className={`flex items-center w-full p-2 rounded-md hover:bg-gray-50 
        ${isSelected ? 'bg-gray-100' : ''}`}
    >
      {editingTag ? (
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
              onClick={handleSaveEdit}
              disabled={!editTagName.trim()}
              className="px-2 py-0.5 text-xs bg-blue-600 text-white rounded-md disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <>
          <button
            onClick={handleTagSelect}
            className={`flex items-center flex-1 text-left group ${
              !isSelected && !canSelectMoreTags
                ? 'opacity-50 cursor-not-allowed'
                : isSelected ? 'font-medium' : ''
            }`}
            disabled={!isSelected && !canSelectMoreTags}
          >
            {isSelected ? (
              <div className="flex items-center justify-center w-5 h-5 rounded-full bg-green-100 text-green-700 mr-2">
                <Check size={12} />
              </div>
            ) : (
              <Hash size={14} className="mr-2 text-blue-500" />
            )}
            <span className={`text-sm group-hover:text-blue-600 ${isSelected ? 'text-blue-700' : ''}`}>
              {tag}
            </span>
            <span className="ml-2 text-xs text-gray-500">
              {count} {count === 1 ? 'note' : 'notes'}
            </span>
          </button>
          
          {/* Action buttons */}
          <div className="flex">
            {/* Edit button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleStartEditing();
              }}
              className="p-1 text-gray-400 hover:text-blue-500"
              title="Edit tag"
            >
              <Edit size={14} />
            </button>
            
            {/* Delete button */}
            {showDeleteConfirm ? (
              <div className="flex items-center ml-1 text-xs">
                <button 
                  onClick={handleDeleteTag}
                  className="px-1.5 py-0.5 text-white bg-red-500 rounded hover:bg-red-600"
                >
                  Yes
                </button>
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-1.5 py-0.5 ml-1 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(true);
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
  );
}