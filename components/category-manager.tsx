"use client";

import React, { useEffect, useState } from 'react';
import { NoteCategory } from '@/types';
import { Plus, Check } from 'lucide-react';

/**
 * This component manages a list of categories and
 * allows users to select from existing categories or create new ones
 */
interface CategoryManagerProps {
  categories: NoteCategory[];
  onSaveCategory: (category: NoteCategory) => void;
  onSelectCategory: (category: NoteCategory) => void;
  selectedCategoryId?: string | null;
}

export function CategoryManager({ 
  categories = [], 
  onSaveCategory, 
  onSelectCategory,
  selectedCategoryId
}: CategoryManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#60a5fa'); // Default blue
  const [nameError, setNameError] = useState<string | null>(null);
  
  const COLOR_OPTIONS = [
    { name: 'Red', value: '#f87171' },
    { name: 'Orange', value: '#fb923c' },
    { name: 'Yellow', value: '#facc15' },
    { name: 'Green', value: '#4ade80' },
    { name: 'Blue', value: '#60a5fa' },
    { name: 'Purple', value: '#a78bfa' },
    { name: 'Pink', value: '#f472b6' },
    { name: 'Gray', value: '#9ca3af' },
    // Additional color options
    { name: 'Teal', value: '#2dd4bf' },
    { name: 'Indigo', value: '#818cf8' },
    { name: 'Rose', value: '#fb7185' },
    { name: 'Amber', value: '#fbbf24' },
    { name: 'Lime', value: '#a3e635' },
  ];

  const handleCreateCategory = () => {
    if (newCategoryName.trim() === '') return;
    
    // Check if a category with the same name already exists
    const categoryNameExists = categories.some(
      category => category.name.toLowerCase() === newCategoryName.trim().toLowerCase()
    );
    
    if (categoryNameExists) {
      setNameError('A category with this name already exists');
      return;
    }
    
    const newCategory: NoteCategory = {
      id: `cat_${Date.now()}`,
      name: newCategoryName.trim(),
      color: newCategoryColor
    };
    
    onSaveCategory(newCategory);
    setIsCreating(false);
    setNewCategoryName('');
    setNameError(null);
  };
  
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium mb-2">Categories</h3>
      
      {/* List of existing categories */}
      <div className="space-y-2 max-h-40 overflow-y-auto">
        {categories.length > 0 ? (
          categories.map(category => (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category)}
              className={`flex items-center w-full p-2 rounded-md hover:bg-gray-50 
                ${selectedCategoryId === category.id ? 'bg-gray-100' : ''}`}
            >
              <span 
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: category.color }}
              />
              <span className="text-sm">{category.name}</span>
              {selectedCategoryId === category.id && (
                <Check size={14} className="ml-auto text-green-500" />
              )}
            </button>
          ))
        ) : (
          <p className="text-sm text-gray-500">No categories yet</p>
        )}
      </div>
      
      {/* Create new category form */}
      {isCreating ? (
        <div className="border border-gray-200 rounded-md p-3 mt-2">
          <div className="mb-2">
            <label htmlFor="new-category-name" className="sr-only">
              Category Name
            </label>
            <input
              type="text"
              id="new-category-name"
              value={newCategoryName}
              onChange={(e) => {
                setNewCategoryName(e.target.value);
                setNameError(null); // Clear error when input changes
              }}
              placeholder="Enter category name"
              className={`w-full px-2 py-1 text-sm border rounded-md ${
                nameError ? 'border-red-500' : 'border-gray-300'
              }`}
              autoFocus
            />
            {nameError && (
              <p className="text-xs text-red-500 mt-1">{nameError}</p>
            )}
          </div>
          
          <div className="mb-3">
            <div className="flex flex-wrap gap-1 mt-1">
              {COLOR_OPTIONS.map(color => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setNewCategoryColor(color.value)}
                  className={`w-5 h-5 rounded-full ${
                    newCategoryColor === color.value ? 'ring-2 ring-offset-1 ring-blue-500' : ''
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
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
              onClick={handleCreateCategory}
              disabled={!newCategoryName.trim()}
              className="px-2 py-1 text-xs bg-blue-600 text-white rounded-md disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center text-sm text-blue-600 hover:text-blue-800"
        >
          <Plus size={14} className="mr-1" />
          Create new category
        </button>
      )}
    </div>
  );
}

export default CategoryManager;
