"use client";

import React from 'react';
import { Note, NoteEditHistory } from '@/types';
import { Calendar, Tag, History, Edit, Hash, RefreshCw, HardDrive } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { TabType } from './note-details-hooks';
import { formatBytes } from '@/lib/storage/storage-utils';

interface DetailsTabContentProps {
  note: Note;
  editHistory: NoteEditHistory[];
  isLoading: boolean;
  onTabChange: (tab: TabType) => void;
  onRefreshHistory?: () => void;
}

export function DetailsTabContent({ 
  note, 
  editHistory, 
  isLoading, 
  onTabChange,
  onRefreshHistory
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
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Edit History</h3>
            {onRefreshHistory && (
              <button
                onClick={onRefreshHistory}
                disabled={isLoading}
                className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                title="Refresh history"
              >
                <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              </button>
            )}
          </div>
          {isLoading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : editHistory.length > 0 ? (
            <div className="mt-1 max-h-48 overflow-y-auto space-y-2">
              {editHistory.map((entry, index) => (
                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-900">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">
                        {entry.editType === 'create' && '🆕'}
                        {entry.editType === 'update' && '✏️'}
                        {entry.editType === 'title' && '📝'}
                        {entry.editType === 'tags' && '🏷️'}
                        {entry.editType === 'category' && '📁'}
                        {entry.editType === 'autosave' && '💾'}
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {entry.editType === 'create' && 'Created'}
                        {entry.editType === 'update' && 'Content updated'}
                        {entry.editType === 'title' && 'Title updated'}
                        {entry.editType === 'tags' && 'Tags updated'}
                        {entry.editType === 'category' && 'Category updated'}
                        {entry.editType === 'autosave' && 'Auto-saved'}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(entry.timestamp, { addSuffix: true })}
                    </span>
                  </div>
                  
                  <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    <div className="flex justify-between">
                      <span>Time:</span>
                      <span>{format(entry.timestamp, 'MMM d, HH:mm:ss')}</span>
                    </div>
                    
                    {entry.contentLength !== undefined && (
                      <div className="flex justify-between">
                        <span>Content Length:</span>
                        <span>{entry.contentLength} characters</span>
                      </div>
                    )}
                    
                    {entry.changePercentage !== undefined && (
                      <div className="flex justify-between">
                        <span>Change:</span>
                        <span className={`font-medium ${
                          entry.changePercentage > 20 ? 'text-red-600' : 
                          entry.changePercentage > 10 ? 'text-orange-600' : 
                          'text-green-600'
                        }`}>
                          {entry.changePercentage.toFixed(1)}%
                        </span>
                      </div>
                    )}
                    
                    {entry.contentSnapshot && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-blue-600 hover:text-blue-800 text-xs">
                          View content snapshot
                        </summary>
                        <div className="mt-2 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded text-xs font-mono max-h-24 overflow-y-auto">
                          {entry.contentSnapshot.substring(0, 200)}
                          {entry.contentSnapshot.length > 200 && '...'}
                        </div>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
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
      
      {/* File Size Section */}
      {note.fileSize !== undefined && (
        <div className="flex items-start space-x-2">
          <HardDrive size={18} className="text-gray-500 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium">File Size</h3>
            <p className="text-sm text-gray-500">
              {formatBytes(note.fileSize)}
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
