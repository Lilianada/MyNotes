"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { localStorageNotesService } from '@/lib/local-storage-notes';
import { firebaseNotesService } from '@/lib/firebase-notes';
import { Note } from '@/types';
import { useAuth } from '@/contexts/auth-context';
import { useNotes } from '@/contexts/note-context';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, AlertTriangle } from 'lucide-react';

interface SyncDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SyncDialog({ open, onOpenChange }: SyncDialogProps) {
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();
  const { notes, setNotes } = useNotes();
  const [isSyncing, setIsSyncing] = useState(false);

  // Cannot sync if not an admin or not logged in
  if (!isAdmin || !user) {
    return null;
  }

  const handleSync = async () => {
    if (!user || !isAdmin || isSyncing) return;

    try {
      setIsSyncing(true);

      // Get local notes
      const localNotes = localStorageNotesService.getNotes();
      
      // Filter out notes that might already exist in Firebase
      const existingFirebaseNotes = await firebaseNotesService.getNotes(user.uid);
      const existingIds = new Set(existingFirebaseNotes.map(note => note.noteTitle));
      
      // These are the notes that need to be added to Firebase
      const notesToAdd = localNotes.filter(note => !existingIds.has(note.noteTitle));
      
      if (notesToAdd.length === 0) {
        toast({
          title: "No new notes to sync",
          description: "All your local notes are already in Firebase.",
        });
        onOpenChange(false);
        return;
      }

      // Add each note to Firebase
      const syncedNotes: Note[] = [];
      for (const note of notesToAdd) {
        const newNote = await firebaseNotesService.addNote(user.uid, note.noteTitle);
        await firebaseNotesService.updateNoteContent(newNote.id, note.content);
        newNote.content = note.content;
        syncedNotes.push(newNote);
      }

      // Update UI with all notes (existing + new)
      const updatedNotes = [...existingFirebaseNotes, ...syncedNotes];
      setNotes(updatedNotes);

      toast({
        title: "Sync Complete",
        description: `Successfully synchronized ${notesToAdd.length} note(s) to Firebase.`,
      });
    } catch (error) {
      console.error("Error syncing notes:", error);
      toast({
        title: "Sync Failed",
        description: "There was an error syncing your notes to Firebase.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Sync Notes to Firebase</DialogTitle>
          <DialogDescription>
            This will copy your local notes to your Firebase account. This is useful if you've been using the app without logging in and want to save your notes to the cloud.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="flex items-center mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
            <p className="text-sm text-amber-800">
              Existing notes with the same title will not be overwritten.
            </p>
          </div>
          <p className="text-sm text-gray-500">
            Ready to sync {localStorageNotesService.getNotes().length} notes from local storage.
          </p>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSyncing}>
            Cancel
          </Button>
          <Button onClick={handleSync} disabled={isSyncing}>
            {isSyncing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              'Sync Notes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
