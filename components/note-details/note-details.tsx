"use client";

import React, { useState, useEffect } from 'react';
import { Note } from '@/types';
import NoteRelationships from '@/components/relationships/note-relationships';
import { NoteDetailsTabs } from './note-details-tabs';
import { DetailsTabContent } from './details-tab-content';
import { MetadataTabContent } from './metadata-tab-content';
import { TagsTabContent } from './tags-tab-content';
import { CategoryTabContent } from './category-tab-content';
import { useNoteDetailsHooks } from './note-details-hooks';
import { useCategoryHandlers } from './category-handlers';
import { useNotes } from '@/contexts/notes/note-context';

interface NoteDetailsProps {
  note: Note;
  isOpen: boolean;
  onClose: () => void;
}

export function NoteDetails({ note, isOpen, onClose }: NoteDetailsProps) {
  const { updateNoteData } = useNotes();
  const { notes, updateNoteTags, updateTagAcrossNotes, deleteTagFromAllNotes } = useNotes();
  
  const {
    activeTab,
    setActiveTab,
    editHistory,
    isLoading,
    categories,
    setCategories,
    description,
    setDescription,
    publishStatus,
    setPublishStatus,
    archived,
    setArchived,
    updateNote,
    archiveNote,
    loadEditHistory
  } = useNoteDetailsHooks(note, isOpen);

  const {
    categories: categoryList,
    setCategories: setCategoryList,
    handleCategorySave,
    handleUpdateCategory,
    handleDeleteCategory
  } = useCategoryHandlers(note, setActiveTab);

  // Local state for tag selection management
  const [pendingTags, setPendingTags] = useState<string[]>([]);
  const [tagSelectionMode, setTagSelectionMode] = useState<'immediate' | 'multi-select'>('immediate');

  // Initialize pending tags when note changes or when entering tag selection mode
  useEffect(() => {
    if (note && activeTab === 'tags') {
      setPendingTags(note.tags || []);
      setTagSelectionMode('immediate');
    }
  }, [note, activeTab]);

  // Handle tag selection for multiple selection mode
  const handleTagSelection = (tag: string) => {
    console.log(`Tag selected: ${tag}`);
    
    if (!note) return;
    
    if (tagSelectionMode) {
      // In selection mode, update pending tags only
      setPendingTags(prev => {
        if (prev.includes(tag)) {
          // Remove tag if it already exists
          return prev.filter(t => t !== tag);
        } else {
          // Add tag if we're under the limit
          if (prev.length < 5) {
            return [...prev, tag];
          } else {
            console.log('Tag limit reached (5), cannot add more tags');
            return prev;
          }
        }
      });
    } else {
      // In immediate mode (legacy behavior), update directly
      handleImmediateTagUpdate(tag);
    }
  };

  // Handle immediate tag updates (for single-click mode)
  const handleImmediateTagUpdate = async (tag: string) => {
    if (!note) return;
    
    try {
      const currentTags = note.tags || [];
      let updatedTags: string[];
      
      if (currentTags.includes(tag)) {
        // Remove tag if it already exists
        updatedTags = currentTags.filter(t => t !== tag);
      } else {
        // Add tag if it doesn't exist and we're under the limit
        if (currentTags.length < 5) {
          updatedTags = [...currentTags, tag];
        } else {
          console.log('Tag limit reached (5), cannot add more tags');
          return;
        }
      }
      
      // Update the note with new tags
      await updateNoteTags(note.id, updatedTags);
    } catch (error) {
      console.error('Failed to update tags:', error);
    }
  };

  // Apply pending tag changes
  const handleApplyTagChanges = async () => {
    if (!note) return;
    
    try {
      await updateNoteTags(note.id, pendingTags);
      setTagSelectionMode('immediate');
      console.log('Tags updated successfully');
    } catch (error) {
      console.error('Failed to update tags:', error);
    }
  };

  // Cancel tag selection mode
  const handleCancelTagSelection = () => {
    setPendingTags(note?.tags || []);
    setTagSelectionMode('immediate');
  };

  // Toggle between selection modes
  const toggleTagSelectionMode = () => {
    if (tagSelectionMode === 'immediate') {
      setPendingTags(note?.tags || []);
      setTagSelectionMode('multi-select');
    } else {
      setTagSelectionMode('immediate');
    }
  };

  // Handle metadata save
  const handleMetadataSave = async () => {
    if (!note) return;

    try {
      // Create the updated note object with all metadata changes
      const updatedNoteData = {
        description,
        publish: publishStatus,
        archived,
        updatedAt: new Date()
      };

      // Update the note data using the general updateNoteData method
      await updateNoteData(note.id, updatedNoteData);
      
      setActiveTab('details');
    } catch (error) {
      console.error('Failed to update metadata:', error);
    }
  };

  if (!isOpen) return null;
  
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]"
      onClick={onClose}
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold">Note Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            &times;
          </button>
        </div>
        
        <NoteDetailsTabs activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <div className="p-4">
          {activeTab === 'details' && (
            <DetailsTabContent 
              note={note} 
              editHistory={editHistory} 
              isLoading={isLoading}
              onTabChange={setActiveTab}
              onRefreshHistory={loadEditHistory}
            />
          )}
          
          {activeTab === 'category' && (
            <CategoryTabContent
              note={note}
              categories={categoryList || categories}
              handleCategorySave={handleCategorySave}
              handleUpdateCategory={handleUpdateCategory}
              handleDeleteCategory={handleDeleteCategory}
            />
          )}
          
          {activeTab === 'relationships' && (
            <NoteRelationships note={note} />
          )}
          
          {activeTab === 'metadata' && (
            <MetadataTabContent
              note={note}
              description={description}
              setDescription={setDescription}
              publishStatus={publishStatus}
              setPublishStatus={setPublishStatus}
              archived={archived}
              setArchived={setArchived}
              onSave={handleMetadataSave}
            />
          )}
          
          {activeTab === 'tags' && (
            <TagsTabContent
              note={note}
              notes={notes}
              updateTagAcrossNotes={updateTagAcrossNotes}
              deleteTagFromAllNotes={deleteTagFromAllNotes}
              onSelectTag={handleTagSelection}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default NoteDetails;
