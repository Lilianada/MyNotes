"use client";

import React, { useEffect, useState } from 'react';
import { NoteCategory } from '@/types';
import { Plus, Check, Trash2, Edit, Save } from 'lucide-react';

/**
 * This component manages a list of categories and
 * allows users to select from existing categories or create new ones
 */
interface CategoryManagerProps {
  categories: NoteCategory[];
  onSaveCategory: (category: NoteCategory) => void;
  onSelectCategory: (category: NoteCategory) => void;
  onDeleteCategory?: (categoryId: string) => void;
  onUpdateCategory?: (category: NoteCategory) => void;
  selectedCategoryId?: string | null;
}

export function CategoryManager({ 
  categories = [], 
  onSaveCategory, 
  onSelectCategory,
  onDeleteCategory,
  onUpdateCategory,
  selectedCategoryId
}: CategoryManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#60a5fa'); // Default blue
  const [nameError, setNameError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [editCategoryColor, setEditCategoryColor] = useState('');
  
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

  const handleStartEditing = (category: NoteCategory) => {
    setEditingCategory(category.id);
    setEditCategoryName(category.name);
    setEditCategoryColor(category.color);
  };
  
  const handleSaveEdit = (category: NoteCategory) => {
    if (editCategoryName.trim() === '') return;
    
    // Check if the name already exists (except for the current category)
    const categoryNameExists = categories.some(
      c => c.id !== category.id && c.name.toLowerCase() === editCategoryName.trim().toLowerCase()
    );
    
    if (categoryNameExists) {
      setNameError('A category with this name already exists');
      return;
    }
    
    const updatedCategory: NoteCategory = {
      ...category,
      name: editCategoryName.trim(),
      color: editCategoryColor
    };
    
    if (onUpdateCategory) {
      onUpdateCategory(updatedCategory);
    }
    
    setEditingCategory(null);
    setNameError(null);
  };
  
  const handleCancelEdit = () => {
    setEditingCategory(null);
    setNameError(null);
  };
  
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium mb-2">Categories</h3>
      
      {/* List of existing categories */}
      <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-hide">
        {categories.length > 0 ? (
          categories.map(category => (
            <div 
              key={category.id}
              className={`flex items-center w-full p-2 rounded-md hover:bg-gray-50 
                ${selectedCategoryId === category.id ? 'bg-gray-100' : ''}`}
            >
              {editingCategory === category.id ? (
                // Edit mode
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <input
                      type="text"
                      value={editCategoryName}
                      onChange={(e) => {
                        setEditCategoryName(e.target.value);
                        setNameError(null);
                      }}
                      className={`flex-1 px-2 py-1 text-sm border rounded-md ${
                        nameError ? 'border-red-500' : 'border-gray-300'
                      }`}
                      autoFocus
                    />
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mb-2">
                    {COLOR_OPTIONS.map(color => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setEditCategoryColor(color.value)}
                        className={`w-4 h-4 rounded-full ${
                          editCategoryColor === color.value ? 'ring-2 ring-offset-1 ring-blue-500' : ''
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
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
                      onClick={() => handleSaveEdit(category)}
                      disabled={!editCategoryName.trim()}
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
                    onClick={() => onSelectCategory(category)}
                    className="flex items-center flex-1 text-left group"
                  >
                    <span 
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-sm group-hover:text-blue-600">{category.name}</span>
                    {selectedCategoryId === category.id && (
                      <Check size={14} className="ml-2 text-green-500" />
                    )}
                  </button>
                  
                  {/* Action buttons */}
                  <div className="flex">
                    {/* Edit button */}
                    {onUpdateCategory && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartEditing(category);
                        }}
                        className="p-1 text-gray-400 hover:text-blue-500"
                        title="Edit category"
                      >
                        <Edit size={14} />
                      </button>
                    )}
                    
                    {/* Delete button */}
                    {onDeleteCategory && (
                      showDeleteConfirm === category.id ? (
                        <div className="flex items-center ml-1 text-xs">
                          <button 
                            onClick={() => {
                              onDeleteCategory(category.id);
                              setShowDeleteConfirm(null);
                            }}
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
                            setShowDeleteConfirm(category.id);
                          }}
                          className="p-1 ml-1 text-gray-400 hover:text-red-500"
                          title="Delete category"
                        >
                          <Trash2 size={14} />
                        </button>
                      )
                    )}
                  </div>
                </>
              )}
            </div>
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
