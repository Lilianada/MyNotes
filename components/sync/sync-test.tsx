"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { useNoteStore } from '@/lib/state/note-store';

/**
 * Test component for manually triggering the sync process
 * This is useful for development and testing
 */
export const SyncTest: React.FC = () => {
  const { user } = useAuth();
  const { findSyncConflicts, resolveNoteConflicts } = useNoteStore();
  
  const handleTestSync = async () => {
    if (!user) {
      console.log('No user logged in');
      return;
    }
    
    try {
      // Find conflicts
      const conflicts = await findSyncConflicts(user);
      console.log('Sync conflicts:', conflicts);
      
      // Log the results
      console.log(`Found ${conflicts.localNoteCount} local notes`);
      console.log(`Found ${conflicts.cloudNoteCount} cloud notes`);
      console.log(`Found ${conflicts.conflictedNotes.length} conflicted notes`);
      
      // The SyncManager component will handle showing the modal
      // This is just for testing the conflict detection
    } catch (error) {
      console.error('Error testing sync:', error);
    }
  };
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleTestSync}
        className="bg-white dark:bg-gray-800 shadow-md"
      >
        Test Sync
      </Button>
    </div>
  );
};

export default SyncTest;
