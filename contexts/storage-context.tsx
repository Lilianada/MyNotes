"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { UserStorage, StorageAlert } from '@/types';
import { getUserStorage, recalculateUserStorage, getAdminStorageStats } from '@/lib/firebase/firebase-storage';
import { checkStorageAlerts, getStoragePercentage } from '@/lib/storage/storage-utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { firebaseNotesService } from '@/lib/firebase/firebase-notes';
import { useAppState } from '@/lib/state/app-state';

interface AdminStorageStats {
  adminStorage: number;
  totalStorage: number;
  userStorageList: UserStorage[];
}

interface StorageContextType {
  userStorage: UserStorage | null;
  storageAlert: StorageAlert | null;
  storagePercentage: number;
  isLoading: boolean;
  refreshStorage: () => Promise<void>;
  checkStorageLimit: (noteSize: number) => boolean;
  adminStats: AdminStorageStats | null;
  loadAdminStorageStats: () => Promise<void>;
}

const StorageContext = createContext<StorageContextType | undefined>(undefined);

export function StorageProvider({ children }: { children: ReactNode }) {
  const [userStorage, setUserStorage] = useState<UserStorage | null>(null);
  const [storageAlert, setStorageAlert] = useState<StorageAlert | null>(null);
  const [storagePercentage, setStoragePercentage] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [lastAlertShown, setLastAlertShown] = useState<number>(0);
  const [adminStats, setAdminStats] = useState<AdminStorageStats | null>(null);
  
  // Use auth context to get user information
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  
  // Get app state to monitor note changes
  const appState = useAppState();
  
  // Load storage data from both local and Firebase sources
  const loadUserStorage = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Calculate storage used from localStorage
      let totalSize = 0;
      let noteCount = 0;
      
      // Get notes from localStorage
      const notesString = localStorage.getItem('notes');
      let localNotes = [];
      if (notesString) {
        try {
          localNotes = JSON.parse(notesString);
          noteCount += localNotes.length;
          
          // Calculate local notes size
          totalSize += notesString.length * 2; // Approximate size in bytes (UTF-16)
          
          // Add size of note histories
          localNotes.forEach((note: any) => {
            const historyKey = `note_history_${note.id}`;
            const historyString = localStorage.getItem(historyKey);
            if (historyString) {
              totalSize += historyString.length * 2; // Approximate size in bytes
            }
          });
        } catch (e) {
          console.error('Error parsing notes from localStorage:', e);
        }
      }
      
      // If user is logged in, also get Firebase notes
      let firebaseNotes = [];
      if (user?.uid && firebaseNotesService) {
        try {
          firebaseNotes = await firebaseNotesService.getNotes(user.uid, isAdmin);
          
          // Count Firebase notes that aren't duplicates of local notes
          const localNoteIds = new Set(localNotes.map((note: any) => note.id));
          const uniqueFirebaseNotes = firebaseNotes.filter((note: any) => !localNoteIds.has(note.id));
          
          noteCount += uniqueFirebaseNotes.length;
          
          // Estimate Firebase notes size
          const firebaseNotesSize = uniqueFirebaseNotes.reduce((size: number, note: any) => {
            // Estimate size based on content length
            return size + (note.content?.length || 0) * 2;
          }, 0);
          
          totalSize += firebaseNotesSize;
        } catch (e) {
          console.error('Error fetching Firebase notes for storage calculation:', e);
        }
      }
      
      // Update storage info
      const updatedStorage: UserStorage = {
        userId: user?.uid || 'local-user',
        totalStorage: totalSize,
        maxStorage: 10 * 1024 * 1024, // 10MB default
        noteCount: noteCount,
        lastUpdated: new Date(),
        isAdmin: Boolean(isAdmin)
      };
      
      setUserStorage(updatedStorage);
    } catch (error) {
      console.error('Error calculating storage:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, isAdmin]);
  
  // Simplified refresh function
  const refreshStorage = useCallback(async () => {
    try {
      setIsLoading(true);
      await loadUserStorage();
    } catch (error) {
      console.error('Error refreshing storage:', error);
      toast({
        title: "Error",
        description: "Failed to refresh storage information.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [loadUserStorage]);

  // Initialize with local storage values
  useEffect(() => {
    // Load storage info on mount
    loadUserStorage();
    
    // Set up periodic refresh (every 5 minutes)
    const refreshInterval = setInterval(() => {
      refreshStorage();
    }, 5 * 60 * 1000);
    
    // Clean up interval on unmount
    return () => {
      clearInterval(refreshInterval);
    };
  }, [loadUserStorage, refreshStorage]);
  
  // Monitor note changes to update storage info automatically
  // Debounce the refresh to avoid excessive updates
  useEffect(() => {
    // Only refresh when notes actually change and not on initial render
    if (appState?.notes && appState.notes.length > 0) {
      // Use a short timeout to debounce multiple rapid changes
      const debounceTimeout = setTimeout(() => {
        refreshStorage();
      }, 2000); // Wait 2 seconds after notes change before refreshing
      
      return () => clearTimeout(debounceTimeout);
    }
  }, [appState?.notes, refreshStorage]);

  // Check for storage alerts when storage changes
  useEffect(() => {
    if (userStorage) {
      const alert = checkStorageAlerts(userStorage);
      setStorageAlert(alert);
      setStoragePercentage(getStoragePercentage(userStorage));
      
      // Show toast for storage alerts (but not too frequently)
      if (alert && Date.now() - lastAlertShown > 60000) { // Only show once per minute
        toast({
          title: alert.type === 'error' ? "Storage Full!" : "Storage Warning",
          description: alert.message,
          variant: alert.type === 'error' ? "destructive" : "default",
        });
        setLastAlertShown(Date.now());
      }
    }
  }, [userStorage, toast, lastAlertShown]);

  // Simplified admin stats function (no-op in local mode)
  const loadAdminStorageStats = useCallback(async () => {
    // No admin stats in local mode
    return;
  }, []);

  const checkStorageLimit = (noteSize: number): boolean => {
    if (!userStorage) return true; // No storage info yet, allow it
    return (userStorage.totalStorage + noteSize) <= userStorage.maxStorage;
  };

  return (
    <StorageContext.Provider
      value={{
        userStorage,
        storageAlert,
        storagePercentage,
        isLoading,
        refreshStorage,
        checkStorageLimit,
        adminStats,
        loadAdminStorageStats
      }}
    >
      {children}
    </StorageContext.Provider>
  );
}

export function useStorage() {
  const context = useContext(StorageContext);
  if (context === undefined) {
    throw new Error('useStorage must be used within a StorageProvider');
  }
  return context;
}
