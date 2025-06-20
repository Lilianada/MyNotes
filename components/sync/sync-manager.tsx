"use client"

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useNoteStore } from '@/lib/state/note-store';
import { SyncModal, ConflictResolutionStrategy } from '../modals/sync-modal';
import { useToast } from '@/hooks/use-toast';

// Key for tracking sync status in local storage
const SYNC_STATUS_KEY = 'noteit_sync_status';

export const SyncManager: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { findSyncConflicts, resolveNoteConflicts } = useNoteStore();
  const { toast } = useToast();
  
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncData, setSyncData] = useState<{
    localNoteCount: number;
    cloudNoteCount: number;
    conflictedNotes: any[];
  }>({
    localNoteCount: 0,
    cloudNoteCount: 0,
    conflictedNotes: [],
  });
  const [isSyncing, setIsSyncing] = useState(false);

  // Check for conflicts when user logs in
  useEffect(() => {
    const checkForConflicts = async () => {
      // Only check if user is logged in and auth state is stable
      if (user && !authLoading) {
        try {
          // Reset sync status for this user on each login
          // This ensures the sync modal appears every time they log in if needed
          const syncStatus = localStorage.getItem(SYNC_STATUS_KEY) || '{}';
          const parsedStatus = JSON.parse(syncStatus);
          delete parsedStatus[user.uid]; // Remove any previous sync status
          localStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(parsedStatus));
          
          // Find conflicts between local and cloud notes
          const conflicts = await findSyncConflicts(user);
          
          // If there are local notes, show the sync modal
          if (conflicts.localNoteCount > 0) {
            setSyncData(conflicts);
            setShowSyncModal(true);
          }
        } catch (error) {
          console.error('Failed to check for note conflicts:', error);
        }
      }
    };

    // Create a unique session ID if it doesn't exist
    if (!sessionStorage.getItem('session_id')) {
      sessionStorage.setItem('session_id', Date.now().toString());
    }

    // Check immediately when user logs in
    if (user && !authLoading) {
      checkForConflicts();
    }
  }, [user, authLoading, findSyncConflicts]);

  // Handle sync action from modal
  const handleSync = async (
    strategy: ConflictResolutionStrategy,
    manualResolutions?: Record<string, ConflictResolutionStrategy>
  ) => {
    if (!user) return;
    
    setIsSyncing(true);
    
    try {
      await resolveNoteConflicts(user, false, strategy, manualResolutions);
      
      // Save sync status to local storage
      const syncStatus = localStorage.getItem(SYNC_STATUS_KEY) || '{}';
      const parsedStatus = JSON.parse(syncStatus);
      parsedStatus[user.uid] = sessionStorage.getItem('session_id');
      localStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(parsedStatus));
      
      // Show success toast
      toast({
        title: "Sync Complete",
        description: "Your notes have been successfully synchronized.",
      });
      
      console.log('Note synchronization completed successfully');
    } catch (error) {
      console.error('Error during note synchronization:', error);
      
      // Show error toast
      toast({
        title: "Sync Failed",
        description: "There was a problem synchronizing your notes.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
      setShowSyncModal(false);
    }
  };

  // Close modal without syncing
  const handleClose = () => {
    setShowSyncModal(false);
    
    // Even if user cancels, don't show the modal again in this session
    if (user) {
      const syncStatus = localStorage.getItem(SYNC_STATUS_KEY) || '{}';
      const parsedStatus = JSON.parse(syncStatus);
      parsedStatus[user.uid] = sessionStorage.getItem('session_id');
      localStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(parsedStatus));
    }
  };

  return (
    <>
      <SyncModal
        isOpen={showSyncModal}
        onClose={handleClose}
        onSync={handleSync}
        localNoteCount={syncData.localNoteCount}
        cloudNoteCount={syncData.cloudNoteCount}
        conflictedNotes={syncData.conflictedNotes}
        isLoading={isSyncing}
      />
    </>
  );
};

export default SyncManager;
