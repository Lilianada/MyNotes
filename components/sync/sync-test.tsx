"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { useNoteStore } from '@/lib/state/note-store';
import { useToast } from '@/hooks/use-toast';

// Key for tracking sync status in local storage - must match the one in sync-manager.tsx
const SYNC_STATUS_KEY = 'noteit_sync_status';

/**
 * Test component for manually triggering the sync process
 * This is useful for development and testing
 */
export const SyncTest: React.FC = () => {
  const { user } = useAuth();
  const { findSyncConflicts, resolveNoteConflicts } = useNoteStore();
  const { toast } = useToast();
  
  const handleTestSync = async () => {
    if (!user) {
      toast({
        title: "Not Logged In",
        description: "You need to be logged in to test sync functionality.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Clear the sync status to force a new sync check
      if (user) {
        const syncStatus = localStorage.getItem(SYNC_STATUS_KEY) || '{}';
        const parsedStatus = JSON.parse(syncStatus);
        delete parsedStatus[user.uid];
        localStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(parsedStatus));
        
        // Also clear the session ID to force a new session
        sessionStorage.removeItem('session_id');
      }
      
      // Find conflicts
      const conflicts = await findSyncConflicts(user);
      console.log('Sync conflicts:', conflicts);
      
      // Log the results
      console.log(`Found ${conflicts.localNoteCount} local notes`);
      console.log(`Found ${conflicts.cloudNoteCount} cloud notes`);
      console.log(`Found ${conflicts.conflictedNotes.length} conflicted notes`);
      
      toast({
        title: "Sync Test",
        description: `Found ${conflicts.localNoteCount} local notes, ${conflicts.cloudNoteCount} cloud notes, and ${conflicts.conflictedNotes.length} conflicts.`,
      });
      
      // The SyncManager component will handle showing the modal
      // This is just for testing the conflict detection
    } catch (error) {
      console.error('Error testing sync:', error);
      toast({
        title: "Sync Test Failed",
        description: "There was an error testing the sync functionality.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleTestSync}
        className="bg-white dark:bg-gray-800 shadow-md flex items-center gap-1"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38"/>
        </svg>
        Test Sync
      </Button>
    </div>
  );
};

export default SyncTest;
