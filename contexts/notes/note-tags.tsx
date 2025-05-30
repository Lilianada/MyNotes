"use client";

import { Note } from "@/types";
import { NoteOperations } from "./note-operations";

export function useNoteTags(
  notes: Note[],
  setNotes: (notes: Note[] | ((prev: Note[]) => Note[])) => void,
  isAdmin: boolean,
  user: { uid: string } | null | undefined
) {
  /**
   * Updates the tags for a specific note
   * @param noteId - The ID of the note to update
   * @param tags - Array of tags to set for the note
   * @returns The updated array of tags
   */
  const updateNoteTags = async (noteId: number, tags: string[]): Promise<string[]> => {
    try {
      // Validate input
      if (!noteId) {
        console.error('[TAG CONTEXT] Note ID is required for updateNoteTags');
        throw new Error('Note ID is required');
      }
      
      console.log(`[TAG CONTEXT] Starting tag update for note ${noteId}`);
      
      // Find the note to update
      const noteToUpdate = notes.find(note => note.id === noteId);
      if (!noteToUpdate) {
        console.error(`[TAG CONTEXT] Note with ID ${noteId} not found`);
        throw new Error(`Note with ID ${noteId} not found`);
      }
      
      // Log current tags
      console.log(`[TAG CONTEXT] Current tags for note ${noteId}:`, 
        JSON.stringify(noteToUpdate.tags || []));
      console.log(`[TAG CONTEXT] New tags to set:`, JSON.stringify(tags));
      
      // Enforce the 5-tag limit
      const MAX_TAGS = 5;
      if (Array.isArray(tags) && tags.length > MAX_TAGS) {
        console.warn(`[TAG CONTEXT] Tag limit exceeded. Max ${MAX_TAGS} allowed, got ${tags.length}`);
        tags = tags.slice(0, MAX_TAGS);
      }
      
      // Use the dedicated updateNoteTags method which returns the cleaned tags
      const cleanTags = await NoteOperations.updateNoteTags(noteId, tags, isAdmin, user);
      
      console.log(`[TAG CONTEXT] Tags updated in storage for note ${noteId}:`, JSON.stringify(cleanTags));
      
      // Update local state with the clean tags returned from storage
      console.log(`[TAG CONTEXT] Updating tags in local state for note ${noteId}`);
      setNotes(prevNotes => 
        prevNotes.map(note => 
          note.id === noteId ? {...note, tags: cleanTags, updatedAt: new Date()} : note
        )
      );
      
      console.log(`[TAG CONTEXT] Tag update complete for note ${noteId}`);
      
      // Return the updated tags so the caller can update its local state
      return cleanTags;
    } catch (error) {
      console.error("[TAG CONTEXT] Failed to update tags:", error);
      throw error;
    }
  };

  /**
   * Updates a tag name across all notes
   * @param oldTag - The original tag name to replace (empty for new tags)
   * @param newTag - The new tag name to use
   */
  const updateTagAcrossNotes = async (oldTag: string, newTag: string): Promise<void> => {
    try {
      // Validate input
      if (!newTag || newTag.trim() === '') {
        throw new Error('New tag name cannot be empty');
      }
      
      // Normalize tag names
      const normalizedOldTag = oldTag ? oldTag.trim().toLowerCase() : '';
      const normalizedNewTag = newTag.trim().toLowerCase();
      
      console.log(`[TAG OPERATION] Attempting to ${normalizedOldTag ? 'update' : 'create'} tag: ${normalizedOldTag || ''} → ${normalizedNewTag}`);
      
      // Check for duplicate tag names
      if (normalizedOldTag !== normalizedNewTag && 
          notes.some(note => note.tags?.includes(normalizedNewTag))) {
        console.error(`Tag "${normalizedNewTag}" already exists`);
        throw new Error(`Tag "${normalizedNewTag}" already exists`);
      }
      
      // Handle creating a new tag (oldTag is empty)
      if (normalizedOldTag === '') {
        console.log(`[TAG OPERATION] Successfully registered new tag: ${normalizedNewTag}`);
        // Now we just return as the tag will be added to the specific note through the separate function
        return;
      }
      
      // Find all notes that contain this tag
      const notesToUpdate = notes.filter(note => 
        note.tags && note.tags.includes(normalizedOldTag)
      );
      
      if (notesToUpdate.length === 0) {
        console.log(`No notes found with tag "${normalizedOldTag}"`);
        return;
      }
      
      console.log(`Updating tag "${normalizedOldTag}" to "${normalizedNewTag}" in ${notesToUpdate.length} notes`);
      
      // Update each note's tags
      const updatePromises = notesToUpdate.map(async note => {
        const updatedTags = note.tags?.map(tag => 
          tag === normalizedOldTag ? normalizedNewTag : tag
        ) || [];
        
        // Create updated note
        const updatedNote = { 
          ...note, 
          tags: updatedTags, 
          updatedAt: new Date() 
        };
        
        // Save to storage with proper error handling
        await NoteOperations.updateNoteData(note.id, updatedNote, Boolean(isAdmin), user);
        
        return updatedNote;
      });
      
      // Wait for all updates to complete
      const updatedNotes = await Promise.all(updatePromises);
      
      // Update local state
      setNotes(prevNotes => 
        prevNotes.map(note => {
          const updatedNote = updatedNotes.find(n => n.id === note.id);
          return updatedNote || note;
        })
      );
    } catch (error) {
      console.error("Failed to update tag across notes:", error);
      throw error;
    }
  };

  /**
   * Removes a tag from all notes
   * @param tag - The tag to remove from all notes
   */
  const deleteTagFromAllNotes = async (tag: string): Promise<void> => {
    try {
      // Validate input
      if (!tag || tag.trim() === '') {
        throw new Error('Tag name is required');
      }
      
      // Normalize tag name
      const normalizedTag = tag.trim().toLowerCase();
      
      // Find all notes with this tag
      const notesToUpdate = notes.filter(note => 
        note.tags && note.tags.includes(normalizedTag)
      );
      
      if (notesToUpdate.length === 0) {
        console.log(`No notes found with tag "${normalizedTag}"`);
        return;
      }
      
      console.log(`Removing tag "${normalizedTag}" from ${notesToUpdate.length} notes`);

      // Update each note's tags
      const updatePromises = notesToUpdate.map(async note => {
        const updatedTags = (note.tags || []).filter(t => t !== normalizedTag);
        
        // Create updated note
        const updatedNote = { 
          ...note, 
          tags: updatedTags, 
          updatedAt: new Date() 
        };
        
        // Save to storage with proper error handling
        await NoteOperations.updateNoteData(note.id, updatedNote, Boolean(isAdmin), user);
        
        return updatedNote;
      });
      
      // Wait for all updates to complete
      const updatedNotes = await Promise.all(updatePromises);
      
      // Update local state
      setNotes(prevNotes => 
        prevNotes.map(note => {
          const updatedNote = updatedNotes.find(n => n.id === note.id);
          return updatedNote || note;
        })
      );
    } catch (error) {
      console.error("Failed to delete tag from all notes:", error);
      throw error;
    }
  };

  return {
    updateNoteTags,
    updateTagAcrossNotes,
    deleteTagFromAllNotes
  };
}
