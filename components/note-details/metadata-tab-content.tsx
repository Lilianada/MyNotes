"use client";

import React from 'react';
import { Note } from '@/types';

interface MetadataTabContentProps {
  note: Note;
  description: string;
  setDescription: (description: string) => void;
  publishStatus: boolean;
  setPublishStatus: (status: boolean) => void;
  archived: boolean;
  setArchived: (archived: boolean) => void;
  filePath: string;
  setFilePath: (filePath: string) => void;
  onSave: () => void;
}

export function MetadataTabContent({ 
  note, 
  description, 
  setDescription, 
  publishStatus, 
  setPublishStatus,
  archived,
  setArchived,
  filePath,
  setFilePath,
  onSave 
}: MetadataTabContentProps) {
  // Validate filePath format
  const isValidFilePath = (path: string): boolean => {
    if (!path) return true; // Empty path is valid (optional)
    return path.endsWith('.md') || path.endsWith('.markdown');
  };

  const filePathValid = isValidFilePath(filePath);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Title
        </label>
        <input
          type="text"
          value={note.noteTitle}
          readOnly
          className="w-full p-2 border border-gray-300 rounded-md bg-gray-100 text-sm"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md text-sm"
          rows={3}
          placeholder="Enter a description of this note..."
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          File Path
        </label>
        <input
          type="text"
          value={filePath}
          onChange={(e) => setFilePath(e.target.value)}
          className={`w-full p-2 border rounded-md text-sm ${
            filePathValid 
              ? 'border-gray-300' 
              : 'border-red-300 bg-red-50'
          }`}
          placeholder="e.g., notes/my-note.md"
        />
        <p className={`text-xs mt-1 ${
          filePathValid 
            ? 'text-gray-500' 
            : 'text-red-500'
        }`}>
          {filePathValid 
            ? 'Specify the file path for digital garden integration. Should end with .md'
            : 'File path must end with .md or .markdown'
          }
        </p>
      </div>
      
      <div className="flex items-center">
        <input
          type="checkbox"
          id="publish"
          checked={publishStatus}
          onChange={(e) => setPublishStatus(e.target.checked)}
          className="mr-2"
        />
        <label htmlFor="publish" className="text-sm font-medium text-gray-700">
          Publish
        </label>
      </div>
      
      <div className="flex items-center">
        <input
          type="checkbox"
          id="archived"
          checked={archived}
          onChange={(e) => setArchived(e.target.checked)}
          className="mr-2"
        />
        <label htmlFor="archived" className="text-sm font-medium text-gray-700">
          Archive Note
        </label>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tags
        </label>
        <div className="flex flex-wrap gap-2 p-2 border border-gray-300 rounded-md bg-gray-50">
          {note.tags && note.tags.length > 0 ? (
            note.tags.map(tag => (
              <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                #{tag}
              </span>
            ))
          ) : (
            <span className="text-gray-400 text-sm">No tags added</span>
          )}
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Category
        </label>
        <div className="flex items-center p-2 border border-gray-300 rounded-md bg-gray-50">
          {note.category ? (
            <div className="flex items-center">
              <span
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: note.category.color }}
              />
              <span className="text-sm">{note.category.name}</span>
            </div>
          ) : (
            <span className="text-gray-400 text-sm">No category assigned</span>
          )}
        </div>
      </div>
      
      <button
        onClick={onSave}
        disabled={!filePathValid}
        className={`px-4 py-2 rounded-md text-sm w-full ${
          filePathValid
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        Save Metadata
      </button>
    </div>
  );
}
