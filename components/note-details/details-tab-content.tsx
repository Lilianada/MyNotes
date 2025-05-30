"use client";

import React from 'react';
import { Note, NoteEditHistory } from '@/types';
import { Calendar, Tag, History, Edit, Hash } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { TabType } from './note-details-hooks';

interface DetailsTabContentProps {
  note: Note;
  editHistory: NoteEditHistory[];
  isLoading: boolean;
  onTabChange: (tab: TabType) => void;
}

export function DetailsTabContent({ 
  note, 
  editHistory, 
  isLoading, 
  onTabChange 
}: DetailsTabContentProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-start space-x-2">
        <Calendar size={18} className="text-gray-500 mt-0.5" />
        <div>
          <h3 className="text-sm font-medium">Created</h3>
          <p className="text-sm text-gray-500">
            {format(note.createdAt, 'PPP')} ({formatDistanceToNow(note.createdAt, { addSuffix: true })})
          </p>
        </div>
      </div>
      
      {note.category && (
        <div className="flex items-start space-x-2">
          <Tag size={18} className="text-gray-500 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium">Category</h3>
            <div className="flex items-center mt-1">
              <span
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: note.category.color }}
              />
              <span className="text-sm">{note.category.name}</span>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex items-start space-x-2">
        <History size={18} className="text-gray-500 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-medium">Edit History</h3>
          {isLoading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : editHistory.length > 0 ? (
            <ul className="mt-1 text-sm text-gray-500 space-y-1 max-h-40 overflow-y-auto">
              {editHistory.map((entry, index) => (
                <li key={index} className="flex items-center py-1">
                  <span className="mr-2">
                    {entry.editType === 'create' && '🆕'}
                    {entry.editType === 'update' && '✏️'}
                    {entry.editType === 'title' && '📝'}
                  </span>
                  <span>
                    {entry.editType === 'create' && 'Created'}
                    {entry.editType === 'update' && 'Content updated'}
                    {entry.editType === 'title' && 'Title updated'}
                  </span>
                  <span className="ml-auto text-xs">
                    {formatDistanceToNow(entry.timestamp, { addSuffix: true })}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No edit history available</p>
          )}
        </div>
      </div>
      
      {note.wordCount !== undefined && (
        <div className="flex items-start space-x-2">
          <Edit size={18} className="text-gray-500 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium">Word Count</h3>
            <p className="text-sm text-gray-500">
              {note.wordCount} {note.wordCount === 1 ? 'word' : 'words'}
            </p>
          </div>
        </div>
      )}
      
      {/* Tags Section */}
      <div className="flex items-start space-x-2">
        <Hash size={18} className="text-gray-500 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-medium">Tags</h3>
          {note.tags && note.tags.length > 0 ? (
            <div className="flex flex-wrap gap-2 mt-2">
              {note.tags.map(tag => (
                <div 
                  key={tag} 
                  className="flex items-center bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full px-3 py-1 text-sm"
                >
                  <span>#{tag}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 mt-1">No tags</p>
          )}
          <div className="mt-2">
            <button
              onClick={() => onTabChange('tags')}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Manage tags
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
