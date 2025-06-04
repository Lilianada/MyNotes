"use client";

import React from 'react';
import { Hash, Link, Edit, Calendar, Tag, History, RefreshCw, HardDrive } from 'lucide-react';
import { Note, NoteCategory } from '@/types';
import { formatDistanceToNow, format, isValid } from 'date-fns';
import { TabType } from './unified-note-details-hooks';
import { formatBytes } from '@/lib/storage/storage-utils';
import { convertTimestamp } from '@/lib/firebase/helpers';
import NoteRelationships from '@/components/relationships/note-relationships';

// Helper function to safely convert and validate dates
const safeDate = (dateValue: any): Date => {
  // Use the centralized converter function
  const date = convertTimestamp(dateValue);
  
  // If the date is invalid, return current date as fallback
  return isValid(date) ? date : new Date();
};

interface UnifiedNoteDetailsTabsProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export function UnifiedNoteDetailsTabs({ activeTab, setActiveTab }: UnifiedNoteDetailsTabsProps) {
  const tabs = [
    { id: 'details' as const, label: 'Details', icon: null },
    { id: 'category' as const, label: 'Category', icon: null },
    { id: 'tags' as const, label: 'Tags', icon: Hash },
    { id: 'relationships' as const, label: 'Links', icon: Link },
    { id: 'metadata' as const, label: 'Meta', icon: Edit },
  ];

  return (
    <div className="flex border-b border-gray-200 dark:border-gray-700">
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === id
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          } ${Icon ? 'flex items-center' : ''}`}
          onClick={() => setActiveTab(id)}
        >
          {Icon && <Icon className="h-3 w-3 mr-1" />}
          {label}
        </button>
      ))}
    </div>
  );
}

interface UnifiedTabContentProps {
  tab: TabType;
  note: Note;
  hooks: ReturnType<typeof import('./unified-note-details-hooks').useUnifiedNoteDetails>;
}

export function UnifiedTabContent({ tab, note, hooks }: UnifiedTabContentProps) {
  // Extract all needed properties from hooks
  const {
    editHistory,
    isLoading,
    loadEditHistory,
    setActiveTab,
    categories,
    handleCategorySave,
    handleUpdateCategory,
    handleDeleteCategory,
    pendingTags,
    handleTagSelection,
    handleApplyTagChanges,
    handleCancelTagChanges,
    description,
    setDescription,
    publishStatus,
    setPublishStatus,
    archived,
    setArchived,
    filePath,
    setFilePath,
    handleMetadataSave,
  } = hooks;
  
  // Define a Map of tabs to their content
  const tabComponents: Record<TabType, JSX.Element> = {
    // Details Tab
    'details': (
      <div className="space-y-4">
        <div className="flex items-start space-x-2">
          <Calendar size={18} className="text-gray-500 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium">Created</h3>
            <p className="text-sm text-gray-500">
              {format(safeDate(note.createdAt), 'PPP')} ({formatDistanceToNow(safeDate(note.createdAt), { addSuffix: true })})
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
              <button
                onClick={loadEditHistory}
                disabled={isLoading}
                className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                title="Refresh history"
              >
                <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              </button>
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
                        {format(safeDate(entry.timestamp), 'PPp')}
                      </span>
                    </div>
                    {(entry.editType === 'update' || entry.editType === 'autosave') && (
                      <p className="text-xs text-gray-500">
                        {entry.contentLength && `${formatBytes(entry.contentLength)} • `}
                        {entry.wordCount && `${entry.wordCount} words`}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 mt-1">No edit history available</p>
            )}
          </div>
        </div>
      </div>
    ),
    
    // Category Tab
    'category': (
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Choose a category</h3>
        
        <div className="grid grid-cols-2 gap-2">
          <button
            className={`p-3 border text-left rounded-md 
              ${!note.category ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-50' : 'border-gray-200 dark:border-gray-700'}
              hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
            onClick={() => handleCategorySave(null)}
          >
            <div className="font-medium">None</div>
            <p className="text-xs text-gray-500 mt-1">Remove category</p>
          </button>
          
          {categories.map((category) => (
            <button
              key={category.id}
              className={`p-3 border text-left rounded-md 
                ${note.category?.id === category.id ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-50' : 'border-gray-200 dark:border-gray-700'}
                hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
              onClick={() => handleCategorySave(category)}
            >
              <div className="flex items-center">
                <span 
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: category.color }}
                />
                <span className="font-medium">{category.name}</span>
              </div>
              {category.name && (
                <p className="text-xs text-gray-500 mt-1">{category.name}</p>
              )}
            </button>
          ))}
        </div>
      </div>
    ),
    
    // Tags Tab
    'tags': (
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Manage tags</h3>
        
        <div className="flex flex-wrap gap-2">
          {/* Render available tags here */}
          {/* This is a simplified representation */}
          {note.tags?.map(tag => (
            <button
              key={tag}
              onClick={() => handleTagSelection(tag)}
              className={`px-3 py-1.5 rounded-full text-sm 
                ${pendingTags.includes(tag) 
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}
              `}
            >
              {tag}
            </button>
          ))}
        </div>
        
        {/* Tag actions */}
        <div className="flex justify-end space-x-2">
          <button
            onClick={handleCancelTagChanges}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleApplyTagChanges}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Apply Changes
          </button>
        </div>
      </div>
    ),
    
    // Relationships Tab
    'relationships': (
      <NoteRelationships note={note} />
    ),
    
    // Metadata Tab
    'metadata': (
      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="description" className="text-sm font-medium">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Add a description for this note"
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
          <label htmlFor="publish" className="text-sm font-medium">
            Publish this note
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
          <label htmlFor="archived" className="text-sm font-medium">
            Archive this note
          </label>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="filePath" className="text-sm font-medium">
            File Path
          </label>
          <input
            type="text"
            id="filePath"
            value={filePath}
            onChange={(e) => setFilePath(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Path to file (optional)"
          />
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={handleMetadataSave}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Save Changes
          </button>
        </div>
      </div>
    ),
  };

  return tabComponents[tab] || <div>Tab content not available</div>;
}
