"use client";

import React from 'react';
import { Note } from '@/types';

interface MetadataTabContentProps {
  note: Note;
  description: string;
  setDescription: (description: string) => void;
  publishStatus: boolean;
  setPublishStatus: (status: boolean) => void;
  onSave: () => void;
}

export function MetadataTabContent({ 
  note, 
  description, 
  setDescription, 
  publishStatus, 
  setPublishStatus,
  onSave 
}: MetadataTabContentProps) {
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
        className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 w-full"
      >
        Save Metadata
      </button>
    </div>
  );
}
