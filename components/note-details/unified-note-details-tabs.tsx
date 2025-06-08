"use client";

import React from 'react';
import { Hash, Edit, Calendar, Tag, History, RefreshCw, X} from 'lucide-react';
import { Note } from '@/types';
import { formatDistanceToNow, format, isValid } from 'date-fns';
import { formatBytes } from '@/lib/storage/storage-utils';
import { convertTimestamp } from '@/lib/firebase/helpers';
import { CategoryManager } from '../categories/category-manager';
import { TabType } from './unified-note-details-hooks';
import { useAppState } from '@/lib/state/app-state';

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

// Custom hook to get all unique tags from notes
function useAllTags() {
  const appState = useAppState();
  
  return React.useMemo(() => {
    const notes = appState?.notes || [];
    const tagSet = new Set<string>();
    
    if (notes && notes.length > 0) {
      notes.forEach((note: Note) => {
        if (note.tags && Array.isArray(note.tags)) {
          note.tags.forEach((tag: string) => tagSet.add(tag));
        }
      });
    }
    
    return Array.from(tagSet).sort();
  }, [appState?.notes]);
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
    activeTab,
  } = hooks;
  
  // Get all unique tags from all notes for reuse
  const allTags = useAllTags();
  
  // State for new tag input
  const [newTag, setNewTag] = React.useState('');
  
  // Handle adding a new tag
  const handleAddTag = () => {
    if (!newTag.trim()) return;
    
    // Check if we've reached the limit of 5 tags
    if (pendingTags.length >= 5) {
      alert('Maximum of 5 tags allowed per note');
      return;
    }
    
    // Check if tag already exists
    if (pendingTags.includes(newTag.trim())) {
      setNewTag('');
      return;
    }
    
    // Add the new tag
    handleTagSelection(newTag.trim());
    setNewTag('');
  };
  
  // Render the details tab content
  const renderDetailsTab = () => {
    return (
      <div className="space-y-4 p-4">
        <div className="flex items-start space-x-2">
          <Calendar size={18} className="text-gray-500 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-medium">Created</h3>
            <p className="text-sm text-gray-500">
              {note.createdAt ? (
                <>
                  {format(safeDate(note.createdAt), 'PPP')}
                  <span className="text-xs ml-2">
                    ({formatDistanceToNow(safeDate(note.createdAt), { addSuffix: true })})
                  </span>
                </>
              ) : (
                'Unknown'
              )}
            </p>
          </div>
        </div>
        
        <div className="flex items-start space-x-2">
          <Calendar size={18} className="text-gray-500 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-medium">Last Modified</h3>
            <p className="text-sm text-gray-500">
              {note.updatedAt ? (
                <>
                  {format(safeDate(note.updatedAt), 'PPP')}
                  <span className="text-xs ml-2">
                    ({formatDistanceToNow(safeDate(note.updatedAt), { addSuffix: true })})
                  </span>
                </>
              ) : (
                'Unknown'
              )}
            </p>
          </div>
        </div>
        
        {note.tags && note.tags.length > 0 && (
          <div className="flex items-start space-x-2">
            <Tag size={18} className="text-gray-500 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium">Tags</h3>
              <div className="flex flex-wrap gap-1 mt-1">
                {note.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {note.category && (
          <div className="flex items-start space-x-2">
            <Hash size={18} className="text-gray-500 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium">Category</h3>
              <div className="flex items-center mt-1">
                <span
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: note.category?.color || '#cccccc' }}
                />
                <span className="text-sm">{note.category?.name || 'Unnamed'}</span>
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
    );
  };

  // Render the category tab content
  const renderCategoryTab = () => {
    return (
      <CategoryManager
        categories={categories}
        onSaveCategory={handleCategorySave}
        onSelectCategory={handleCategorySave}
        onUpdateCategory={handleUpdateCategory}
        onDeleteCategory={handleDeleteCategory}
        selectedCategoryId={note?.category?.id}
      />
    );
  };

  // Render the tags tab content
  const renderTagsTab = () => {
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Manage tags</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Add Tags <span className="text-gray-500 text-xs">(max 5)</span>
          </label>
          <div className="flex items-center">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
              className="flex-1 p-2 border border-gray-300 rounded-l-md text-sm"
              placeholder="Enter a tag name"
              disabled={pendingTags.length >= 5}
            />
            <button
              onClick={handleAddTag}
              disabled={!newTag.trim() || pendingTags.length >= 5}
              className="p-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 text-sm"
            >
              Add
            </button>
          </div>
          {pendingTags.length >= 5 && (
            <p className="text-amber-600 text-xs mt-1">Maximum of 5 tags reached</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Current Tags
          </label>
          <div className="flex flex-wrap gap-2 p-2 border border-gray-300 rounded-md min-h-[40px]">
            {pendingTags.length > 0 ? (
              pendingTags.map((tag: string) => (
                <div key={tag} className="flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-sm">
                  #{tag}
                  <button
                    onClick={() => handleTagSelection(tag)}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))
            ) : (
              <span className="text-gray-400 text-sm">No tags added</span>
            )}
          </div>
        </div>

        {allTags.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reuse Existing Tags
            </label>
            <div className="flex flex-wrap gap-2 p-2 border border-gray-300 rounded-md">
              {allTags.map((tag: string) => (
                <button
                  key={tag}
                  onClick={() => handleTagSelection(tag)}
                  disabled={pendingTags.length >= 5 && !pendingTags.includes(tag)}
                  className={`px-2 py-1 text-xs rounded-sm ${pendingTags.includes(tag) 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200 disabled:opacity-50'}`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-2">
          <button
            onClick={handleCancelTagChanges}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleApplyTagChanges}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
          >
            Save Tags
          </button>
        </div>
      </div>
    );
  };

  // Render the metadata tab content
  const renderMetadataTab = () => {
    return (
      <div className="space-y-4 p-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            type="text"
            value={hooks.noteTitle}
            onChange={(e) => hooks.setNoteTitle(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md text-sm"
            placeholder="Note title"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={description ?? ''}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md text-sm min-h-[100px] dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
            placeholder="Add a description for this note..."
          />
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="publishStatus"
            checked={publishStatus}
            onChange={(e) => setPublishStatus(e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="publishStatus" className="text-sm font-medium text-gray-700">
            Publish this note
          </label>
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="archivedStatus"
            checked={archived}
            onChange={(e) => setArchived(e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="archivedStatus" className="text-sm font-medium text-gray-700">
            Archive this note
          </label>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            File Path
          </label>
          <input
            type="text"
            value={filePath}
            onChange={(e) => setFilePath(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md text-sm"
            placeholder="Optional file path for this note"
          />
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={handleMetadataSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
          >
            Save Metadata
          </button>
        </div>
      </div>
    );
  };
  
  // Use the render functions based on the active tab
  switch (activeTab) {
    case 'details':
      return renderDetailsTab();
    case 'category':
      return renderCategoryTab();
    case 'tags':
      return renderTagsTab();
    case 'metadata':
      return renderMetadataTab();
    default:
      return <div>Tab content not available</div>;
  }
}
