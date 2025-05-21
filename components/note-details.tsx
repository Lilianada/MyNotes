"use client";

import React, { useEffect, useState } from 'react';
import { Note, NoteCategory, NoteEditHistory } from '@/types';
import { CategoryManager } from './category-manager';
import { MoreVertical, Tag, Calendar, Edit, History, Link, Hash } from 'lucide-react';
import { useNotes } from '@/contexts/note-context';
import { firebaseNotesService } from '@/lib/firebase-notes';
import { useAuth } from '@/contexts/auth-context';
import { localStorageNotesService } from '@/lib/local-storage-notes';
import { formatDistanceToNow, format } from 'date-fns';
import NoteRelationships from './note-relationships';
import TagManagerV2 from './tag-manager-v2';
import TagManagerSystem from './tag-manager-system';

interface NoteDetailsProps {
  note: Note;
  isOpen: boolean;
  onClose: () => void;
}

export function NoteDetails({ note, isOpen, onClose }: NoteDetailsProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'category' | 'relationships' | 'tags'>('details');
  const [editHistory, setEditHistory] = useState<NoteEditHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<NoteCategory[]>([]);
  const { user, isAdmin } = useAuth();
  const { 
    updateNoteCategory, 
    notes, 
    deleteCategory, 
    updateCategory, 
    updateNoteTags,
    updateTagAcrossNotes,
    deleteTagFromAllNotes 
  } = useNotes();
  
  // Extract all unique categories from notes
  useEffect(() => {
    if (isOpen) {
      // Get all categories from notes, removing duplicates
      const uniqueCategories = notes.reduce((acc: NoteCategory[], current: Note) => {
        if (current.category && !acc.find(c => c.id === current.category?.id)) {
          acc.push(current.category);
        }
        return acc;
      }, []);
      
      setCategories(uniqueCategories);
    }
  }, [isOpen, notes]);
  
  useEffect(() => {
    if (isOpen && note) {
      loadEditHistory();
    }
  }, [isOpen, note]);
  
  const loadEditHistory = async () => {
    if (!note) return;
    
    setIsLoading(true);
    
    try {
      let history: NoteEditHistory[] = [];
      
      if (isAdmin && user && firebaseNotesService) {
        history = await firebaseNotesService.getNoteHistory(note.id);
      } else {
        history = localStorageNotesService.getNoteHistory(note.id);
      }
      
      setEditHistory(history);
    } catch (error) {
      console.error('Failed to load edit history:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCategorySave = async (category: NoteCategory | null) => {
    try {
      await updateNoteCategory(note.id, category);
      setActiveTab('details');
    } catch (error) {
      console.error('Failed to update category:', error);
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
        
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'details'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('details')}
          >
            Details
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'category'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('category')}
          >
            Category
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium flex items-center ${
              activeTab === 'tags'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('tags')}
          >
            <Hash className="h-3 w-3 mr-1" />
            Tags
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium flex items-center ${
              activeTab === 'relationships'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('relationships')}
          >
            <Link className="h-3 w-3 mr-1" />
            Links
          </button>
        </div>
        
        <div className="p-4">
          {activeTab === 'details' ? (
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
                      onClick={() => setActiveTab('tags')}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Manage tags
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'category' ? (
            <CategoryManager
              categories={categories}
              onSaveCategory={(category) => {
                handleCategorySave(category);
              }}
              onSelectCategory={(category) => {
                handleCategorySave(category);
              }}
              onUpdateCategory={async (category) => {
                try {
                  await updateCategory(category);
                  // Update local categories state
                  setCategories(prev => 
                    prev.map(c => c.id === category.id ? category : c)
                  );
                } catch (error) {
                  console.error("Failed to update category:", error);
                }
              }}
              onDeleteCategory={async (categoryId) => {
                try {
                  await deleteCategory(categoryId);
                  // Update local categories state
                  setCategories(prev => prev.filter(c => c.id !== categoryId));
                } catch (error) {
                  console.error("Failed to delete category:", error);
                }
              }}
              selectedCategoryId={note.category?.id}
            />
          ) : activeTab === 'relationships' ? (
            <NoteRelationships note={note} />
          ) : activeTab === 'tags' ? (
            <TagManagerSystem 
              allNotes={notes}
              onUpdateTagAcrossNotes={updateTagAcrossNotes}
              onDeleteTagFromAllNotes={deleteTagFromAllNotes}
              selectedTags={note.tags || []}
              maxTagsAllowed={5}
              onSelectTag={(tag) => {
                // When a tag is selected, add it to the note if not already present
                const currentTags = note.tags || [];
                if (!currentTags.includes(tag)) {
                  // Check the tag limit before adding
                  if (currentTags.length < 5) {
                    updateNoteTags(note.id, [...currentTags, tag]);
                  }
                } else {
                  // If tag is already on the note, remove it (toggle behavior)
                  updateNoteTags(note.id, currentTags.filter(t => t !== tag));
                }
              }}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default NoteDetails;
