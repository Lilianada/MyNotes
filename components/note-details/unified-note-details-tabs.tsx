"use client";

import React from 'react';
import { Hash, Link, Edit, Calendar, Tag, History, RefreshCw, HardDrive, Clock, FileText, X } from 'lucide-react';
import { Note, NoteCategory } from '@/types';
import { formatDistanceToNow, format, isValid } from 'date-fns';
import { formatBytes } from '@/lib/storage/storage-utils';
import { convertTimestamp } from '@/lib/firebase/helpers';
import { CategoryTabContent } from './category-tab-content';
import { MetadataTabContent } from './metadata-tab-content';
import { TabType } from './unified-note-details-hooks';

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
                        {/* Display word count if available in the entry object */}
                        {entry.hasOwnProperty('wordCount') && typeof (entry as any).wordCount === 'number' && 
                          `${(entry as any).wordCount} words`
                        }
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
      <CategoryTabContent
        note={note}
        categories={categories}
        handleCategorySave={handleCategorySave}
        handleUpdateCategory={handleUpdateCategory}
        handleDeleteCategory={handleDeleteCategory}
      />
    ),
    
    // Tags Tab
    'tags': (
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Manage tags</h3>
        
        {/* Display current tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {pendingTags.length > 0 ? (
            pendingTags.map(tag => (
              <div 
                key={tag}
                className="flex items-center bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-3 py-1 rounded-full text-sm"
              >
                <span className="mr-1">#{tag}</span>
                <button 
                  onClick={() => {
                    const updatedTags = pendingTags.filter(t => t !== tag);
                    handleTagSelection(tag); // Use existing handler instead of direct state update
                  }}
                  className="ml-1 text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-100"
                  aria-label={`Remove tag ${tag}`}
                >
                  <X size={14} />
                </button>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">No tags added yet</p>
          )}
        </div>
        
        {/* Add tag input */}
        <div className="w-full">
          <div className="flex">
            <input
              type="text"
              placeholder="Add a tag..."
              className="flex-1 p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value) {
                  const newTag = e.currentTarget.value.trim();
                  if (newTag && !pendingTags.includes(newTag)) {
                    // Add the tag to pendingTags using the existing handler
                    if (!note.tags?.includes(newTag)) {
                      handleTagSelection(newTag);
                    }
                    e.currentTarget.value = '';
                  }
                }
              }}
            />
            <button 
              className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600"
              onClick={handleApplyTagChanges}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    ),
    
    // Metadata Tab
    'metadata': (
      <MetadataTabContent
        note={note}
        description={description}
        setDescription={setDescription}
        publishStatus={publishStatus}
        setPublishStatus={setPublishStatus}
        archived={archived}
        setArchived={setArchived}
        filePath={filePath}
        setFilePath={setFilePath}
        onSave={handleMetadataSave}
      />
    ),
  };

  return tabComponents[tab] || <div>Tab content not available</div>;
}
