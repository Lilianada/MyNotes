"use client"

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useNoteStore } from '@/lib/state/note-store';
import { SyncModal, ConflictResolutionStrategy } from '../modals/sync-modal';

export const SyncManager: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { findSyncConflicts, resolveNoteConflicts } = useNoteStore();
  
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

    // Small delay to ensure auth state is stable
    const timer = setTimeout(checkForConflicts, 1000);
    return () => clearTimeout(timer);
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
      console.log('Note synchronization completed successfully');
    } catch (error) {
      console.error('Error during note synchronization:', error);
    } finally {
      setIsSyncing(false);
      setShowSyncModal(false);
    }
  };

  // Close modal without syncing
  const handleClose = () => {
    setShowSyncModal(false);
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
