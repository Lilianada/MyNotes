"use client";

import { useCallback } from 'react';
import { Note } from '@/types';
import { toast } from '@/components/ui/use-toast';
import { useNotes } from '@/contexts/notes/note-context';

export function useTagsHandlers(note: Note | null) {
  const { updateNoteTags } = useNotes();
  
  const handleTagsUpdated = useCallback(async (tags: string[]) => {
    if (!note) return;
    
    console.log(`[NOTE DETAILS] Updating tags for note ${note.id}:`, JSON.stringify(tags));
    
    // Validate tag limit
    const MAX_TAGS = 5;
    if (tags.length > MAX_TAGS) {
      console.warn(`[NOTE DETAILS] Tag limit exceeded. Max ${MAX_TAGS} allowed, got ${tags.length}`);
      tags = tags.slice(0, MAX_TAGS);
    }
    
    try {
      // Show loading toast
      const { dismiss } = toast({
        title: "Updating tags...",
        description: "Saving your changes...",
      });
      
      // Normalize tags (lowercase, trim, remove duplicates)
      const normalizedTags = Array.from(
        new Set(tags.map(tag => tag.trim().toLowerCase()))
      ).filter(Boolean);
      
      console.log(`[NOTE DETAILS] Normalized tags:`, JSON.stringify(normalizedTags));
      
      // Update tags in the note and get the updated tags
      console.log(`[NOTE DETAILS] Calling updateNoteTags with:`, JSON.stringify(normalizedTags));
      const updatedTags = await updateNoteTags(note.id, normalizedTags);
      
      // Dismiss loading toast
      dismiss();
      
      // Use the returned tags directly from the update operation
      console.log(`[NOTE DETAILS] Tags after update:`, JSON.stringify(updatedTags));
      
      // Update the local note reference to have the latest tags
      // This ensures that subsequent operations in this component have the latest data
      if (note && updatedTags) {
        note.tags = updatedTags;
      }
      
      // Show success toast
      toast({
        title: "Tags updated",
        description: "Your note tags have been updated successfully",
      });
    } catch (error) {
      console.error('Failed to update tags:', error);
      
      // Show error toast
      toast({
        title: "Error updating tags",
        description: "There was a problem updating your note tags",
        variant: "destructive",
      });
    }
  }, [note, updateNoteTags]);
  
  return { handleTagsUpdated };
}

// Helper function for handling tag selection
// This is kept separate but can be used by the main hook if needed
export function handleTagSelection(
  note: Note,
  tag: string,
  handleTagsUpdated: (tags: string[]) => Promise<void>
) {
  console.log(`[NOTE DETAILS] Tag selection requested: "${tag}"`);
  const currentTags = note.tags || [];
  
  // Check if this was triggered from a tag removal button (with X)
  const isFromRemoveButton = document.activeElement?.getAttribute('aria-label') === `Remove tag ${tag}`;
  
  if (currentTags.includes(tag) && isFromRemoveButton) {
    // Only remove tags when explicitly clicking the X button
    console.log(`[NOTE DETAILS] Removing tag from note: "${tag}"`);
    handleTagsUpdated(currentTags.filter(t => t !== tag));
  } else if (!currentTags.includes(tag)) {
    // If not selected and we have room, add it
    if (currentTags.length < 5) {
      console.log(`[NOTE DETAILS] Adding tag to note: "${tag}"`);
      handleTagsUpdated([...currentTags, tag]);
    } else {
      // We've hit the tag limit
      console.log(`[NOTE DETAILS] Tag limit reached (5), cannot add: "${tag}"`);
      toast({
        title: "Tag limit reached",
        description: "You can only add up to 5 tags per note. Remove a tag first.",
        variant: "destructive"
      });
    }
  }
}
