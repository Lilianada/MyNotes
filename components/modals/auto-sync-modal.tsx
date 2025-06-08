"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useNoteStore } from '@/lib/state/note-store';
import { SyncModal } from './sync-modal';

export function AutoSyncModal() {
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncData, setSyncData] = useState<{
    localNoteCount: number;
    cloudNoteCount: number;
    conflictedNotes: any[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { user } = useAuth();
  const { findSyncConflicts, resolveNoteConflicts } = useNoteStore();
  
  // Check for sync needs when user logs in
  useEffect(() => {
    let isMounted = true;
    
    const checkForSyncNeeds = async () => {
      // Only show sync modal if user is logged in
      if (user && user.uid) {
        try {
          setIsLoading(true);
          // Check for conflicts between local and cloud notes
          const syncInfo = await findSyncConflicts(user);
          
          // Only show sync modal if there are local notes or conflicts
          if (isMounted && (syncInfo.localNoteCount > 0 || syncInfo.conflictedNotes.length > 0)) {
            setSyncData(syncInfo);
            setShowSyncModal(true);
          }
        } catch (error) {
          console.error('Error checking for sync conflicts:', error);
        } finally {
          if (isMounted) {
            setIsLoading(false);
          }
        }
      }
    };
    
    // Small delay to ensure Firebase is ready
    const timer = setTimeout(() => {
      checkForSyncNeeds();
    }, 1000);
    
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [user, findSyncConflicts]);
  
  const handleSync = async (strategy, manualResolutions) => {
    try {
      setIsLoading(true);
      await resolveNoteConflicts(user, false, strategy, manualResolutions);
    } catch (error) {
      console.error('Error resolving note conflicts:', error);
    } finally {
      setIsLoading(false);
      setShowSyncModal(false);
    }
  };
  
  const handleClose = () => {
    setShowSyncModal(false);
  };
  
  if (!syncData || !showSyncModal) {
    return null;
  }
  
  return (
    <SyncModal
      isOpen={showSyncModal}
      onClose={handleClose}
      onSync={handleSync}
      localNoteCount={syncData.localNoteCount}
      cloudNoteCount={syncData.cloudNoteCount}
      conflictedNotes={syncData.conflictedNotes}
      isLoading={isLoading}
    />
  );
}
