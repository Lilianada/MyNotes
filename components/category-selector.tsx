"use client";

import React, { useState } from 'react';
import { NoteCategory } from '@/types';

const COLOR_OPTIONS = [
  { name: 'Red', value: '#f87171' },
  { name: 'Orange', value: '#fb923c' },
  { name: 'Yellow', value: '#facc15' },
  { name: 'Green', value: '#4ade80' },
  { name: 'Blue', value: '#60a5fa' },
  { name: 'Purple', value: '#a78bfa' },
  { name: 'Pink', value: '#f472b6' },
  { name: 'Gray', value: '#9ca3af' },
];

interface CategorySelectorProps {
  initialCategory?: NoteCategory | null;
  onSave: (category: NoteCategory | null) => void;
  onCancel: () => void;
}

export function CategorySelector({ initialCategory, onSave, onCancel }: CategorySelectorProps) {
  const [categoryName, setCategoryName] = useState(initialCategory?.name || '');
  const [selectedColor, setSelectedColor] = useState(initialCategory?.color || COLOR_OPTIONS[0].value);
  
  const handleSave = () => {
    if (categoryName.trim() === '') {
      onSave(null); // Remove category if name is empty
      return;
    }
    
    const newCategory: NoteCategory = {
      id: initialCategory?.id || `cat_${Date.now()}`,
      name: categoryName.trim(),
      color: selectedColor
    };
    
    onSave(newCategory);
  };
  
  return (
    <div className="p-4">
      <div className="mb-4">
        <label htmlFor="category-name" className="block text-sm font-medium text-gray-700 mb-1">
          Category Name
        </label>
        <input
          type="text"
          id="category-name"
          value={categoryName}
          onChange={(e) => setCategoryName(e.target.value)}
          placeholder="Enter category name"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Category Color
        </label>
        <div className="grid grid-cols-4 gap-2">
          {COLOR_OPTIONS.map((color) => (
            <button
              key={color.value}
              type="button"
              onClick={() => setSelectedColor(color.value)}
              className={`w-full h-8 rounded-md flex items-center justify-center ${
                selectedColor === color.value ? 'ring-2 ring-offset-2 ring-blue-500' : ''
              }`}
              style={{ backgroundColor: color.value }}
              title={color.name}
              aria-label={`Select ${color.name} color`}
            />
          ))}
        </div>
      </div>
      
      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {initialCategory ? 'Update' : 'Save'}
        </button>
      </div>
    </div>
  );
}

export default CategorySelector;
