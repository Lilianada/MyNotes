"use client";

import { useCallback } from 'react';
import { Note } from '@/types';
import { toast } from '@/components/ui/use-toast';
import { useNotes } from '@/contexts/notes/note-context';
import { TabType } from './note-details-hooks';

export function useMetadataHandlers(
  note: Note | null,
  description: string,
  publishStatus: boolean,
  setActiveTab: (tab: TabType) => void
) {
  const { updateNote } = useNotes();
  
  const handleMetadataSave = useCallback(async () => {
    if (!note) return;
    
    try {
      // Show loading toast
      const { dismiss } = toast({
        title: "Updating metadata...",
        description: "Saving your changes...",
      });

      // Update the note content with metadata in frontmatter format
      let content = note.content || '';
      
      // Check if note has frontmatter already and update or add it
      const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
      const hasFrontmatter = frontmatterRegex.test(content);
      
      // Create frontmatter object
      const frontmatter = {
        title: note.noteTitle,
        description: description,
        publish: publishStatus,
        tags: note.tags || [],
        category: note.category?.name || '',
        // Keep other existing frontmatter data if any
      };
      
      // Convert to YAML format string
      const frontmatterString = Object.entries(frontmatter)
        .map(([key, value]) => {
          if (Array.isArray(value)) {
            return `${key}: [${value.map(tag => `"${tag}"`).join(', ')}]`;
          }
          if (typeof value === 'boolean') {
            return `${key}: ${value}`;
          }
          return `${key}: "${value}"`;
        })
        .join('\n');
        
      // Update content with new frontmatter
      if (hasFrontmatter) {
        content = content.replace(frontmatterRegex, `---\n${frontmatterString}\n---\n`);
      } else {
        content = `---\n${frontmatterString}\n---\n\n${content}`;
      }
      
      // Update the note
      await updateNote(note.id, content);
      
      // Dismiss loading toast
      dismiss();
      
      // Show success toast
      toast({
        title: "Metadata updated",
        description: "Your note metadata has been updated successfully",
      });
      
      // Navigate back to details tab
      setActiveTab('details');
    } catch (error) {
      console.error('Failed to update metadata:', error);
      
      // Show error toast
      toast({
        title: "Error updating metadata",
        description: "There was a problem updating your note metadata",
        variant: "destructive",
      });
    }
  }, [note, description, publishStatus, updateNote, setActiveTab]);
  
  return { handleMetadataSave };
}
