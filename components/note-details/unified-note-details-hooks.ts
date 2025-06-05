"use client";

import { useState, useEffect, useCallback } from 'react';
import { Note, NoteCategory, NoteEditHistory } from '@/types';
import { editHistoryService } from '@/lib/edit-history/edit-history-service';
import { useAuth } from '@/contexts/auth-context';
import { useAppState } from '@/lib/state/app-state';
import { useToast } from '@/components/ui/use-toast';

export type TabType = 'details' | 'category' | 'relationships' | 'tags' | 'metadata';

/**
 * Unified hook for note details state and actions
 * 
 * This hook combines functionality from:
 * - useNoteDetailsState
 * - useNoteDetailsActions
 * - useTagsHandlers
 * - useCategoryHandlers
 * - useMetadataHandlers
 */
export function useUnifiedNoteDetails(note: Note | null, isOpen: boolean, onClose?: () => void) {
  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('details');
  
  // Edit history state
  const [editHistory, setEditHistory] = useState<NoteEditHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Category state
  const [categories, setCategories] = useState<NoteCategory[]>([]);
  
  // Metadata state
  const [description, setDescription] = useState<string>('');
  const [publishStatus, setPublishStatus] = useState<boolean>(false);
  const [archived, setArchived] = useState<boolean>(false);
  const [filePath, setFilePath] = useState<string>('');

  // Tags state
  const [pendingTags, setPendingTags] = useState<string[]>([]);
  
  // Get context values
  const { user, isAdmin } = useAuth();
  const { 
    notes, 
    updateNoteCategory, 
    updateNoteTags, 
    updateTagAcrossNotes,
    deleteTagFromAllNotes,
    updateNote,
    updateCategory,
    deleteCategory,
    archiveNote,
    updateNoteData
  } = useAppState();
  
  // Initialize categories when note details are opened
  useEffect(() => {
    if (isOpen) {
      const uniqueCategories = notes.reduce((acc: NoteCategory[], current: Note) => {
        if (current.category && !acc.find(c => c.id === current.category?.id)) {
          acc.push(current.category);
        }
        return acc;
      }, []);
      setCategories(uniqueCategories);
    }
  }, [isOpen, notes]);
  
  // Initialize metadata when note changes
  useEffect(() => {
    if (isOpen && note) {
      loadEditHistory();
      setDescription(note.description || '');
      setPublishStatus(note.publish || false);
      setArchived(note.archived || false);
      setFilePath(note.filePath || '');
    }
  }, [isOpen, note]);
  
  // Initialize pending tags when note changes or when entering tag tab
  useEffect(() => {
    if (note && activeTab === 'tags') {
      setPendingTags(note.tags || []);
    }
  }, [note, activeTab]);
  
  // Load edit history
  const loadEditHistory = useCallback(async () => {
    if (!note) return;
    
    setIsLoading(true);
    
    try {
      const history = await editHistoryService.getHistory(note.id, isAdmin || false, user);
      setEditHistory(history);
    } catch (error) {
      console.error('Failed to load edit history:', error);
      setEditHistory([]);
    } finally {
      setIsLoading(false);
    }
  }, [note, isAdmin, user]);
  
  // Category Handlers
  const handleCategorySave = useCallback(async (category: NoteCategory | null) => {
    if (!note) return;
    
    try {
      await updateNoteCategory(note.id, category, user, isAdmin || false);
      setActiveTab('details');
    } catch (error) {
      console.error('Failed to update category:', error);
    }
  }, [note, updateNoteCategory, setActiveTab, user, isAdmin]);

  const handleUpdateCategory = useCallback(async (category: NoteCategory) => {
    try {
      await updateCategory(category, user, isAdmin || false);
      setCategories(prev => 
        prev.map(c => c.id === category.id ? category : c)
      );
    } catch (error) {
      console.error("Failed to update category:", error);
    }
  }, [updateCategory, user, isAdmin]);

  const handleDeleteCategory = useCallback(async (categoryId: string) => {
    try {
      await deleteCategory(categoryId, user, isAdmin || false);
      setCategories(prev => prev.filter(c => c.id !== categoryId));
    } catch (error) {
      console.error("Failed to delete category:", error);
    }
  }, [deleteCategory, user, isAdmin]);

  const handleArchiveNote = useCallback(async () => {
    if (!note) return;
    
    try {
      await archiveNote(note.id, true, user, isAdmin || false);
      if (onClose) onClose();
    } catch (error) {
      console.error('Failed to archive note:', error);
    }
  }, [note, archiveNote, onClose, user, isAdmin]);

  // Tags Handlers
  const handleTagSelection = useCallback((tag: string) => {
    if (!note) return;
    
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
  }, [note]);

  const handleApplyTagChanges = useCallback(async () => {
    if (!note) return;
    
    try {
      const updatedTags = await updateNoteTags(note.id, pendingTags, user, isAdmin || false);
      console.log('Tags updated successfully');
      
      // Reset pending tags to match the note's actual tags
      setPendingTags(updatedTags || pendingTags);
    } catch (error) {
      console.error('Failed to update tags:', error);
    }
  }, [note, pendingTags, updateNoteTags, user, isAdmin]);

  const handleCancelTagChanges = useCallback(() => {
    if (note) {
      setPendingTags(note.tags || []);
    }
  }, [note]);

  // Metadata Handlers
  const { toast } = useToast();
  const handleMetadataSave = useCallback(async () => {
    if (!note) return;
    
    try {
      const { dismiss } = toast({
        title: "Updating metadata...",
        description: "Saving your changes...",
      });

      // Update note with metadata fields
      await updateNoteData(note.id, {
        description,
        publish: publishStatus,
        archived,
        filePath
      }, user, isAdmin || false);

      dismiss();
      toast({
        title: "Metadata updated",
        description: "Your changes have been saved successfully.",
      });

      setActiveTab('details');
    } catch (error) {
      console.error('Failed to update metadata:', error);
      toast({
        title: "Error updating metadata",
        description: "An error occurred while saving your changes.",
        variant: "destructive"
      });
    }
  }, [note, description, publishStatus, archived, filePath, updateNoteData, setActiveTab, toast]);

  return {
    // State
    activeTab,
    setActiveTab,
    editHistory,
    isLoading,
    categories,
    description,
    setDescription,
    publishStatus,
    setPublishStatus,
    archived,
    setArchived,
    filePath,
    setFilePath,
    pendingTags,
    
    // Actions
    loadEditHistory,
    handleCategorySave,
    handleUpdateCategory,
    handleDeleteCategory,
    handleTagSelection,
    handleApplyTagChanges,
    handleCancelTagChanges,
    handleMetadataSave,
    archiveNote,
    updateTagAcrossNotes,
    deleteTagFromAllNotes,
  };
}
