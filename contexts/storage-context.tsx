"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserStorage, StorageAlert } from '@/types';
// Remove dependency on auth context
import { getUserStorage, recalculateUserStorage, getAdminStorageStats } from '@/lib/firebase/firebase-storage';
import { checkStorageAlerts, getStoragePercentage } from '@/lib/storage/storage-utils';
import { useToast } from '@/hooks/use-toast';

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
  
  // Use local state instead of auth context
  const [user, setUser] = useState<{ uid: string } | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const { toast } = useToast();
  
  // Simplified version that works with local storage only
  const loadUserStorage = async () => {
    try {
      setIsLoading(true);
      
      // Calculate storage used from localStorage
      let totalSize = 0;
      let noteCount = 0;
      
      // Get notes from localStorage
      const notesString = localStorage.getItem('notes');
      if (notesString) {
        try {
          const notes = JSON.parse(notesString);
          noteCount = notes.length;
          
          // Calculate total size
          totalSize = notesString.length * 2; // Approximate size in bytes (UTF-16)
          
          // Add size of note histories
          notes.forEach((note: any) => {
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
      
      // Update storage info
      const updatedStorage: UserStorage = {
        userId: 'local-user',
        totalStorage: totalSize,
        maxStorage: 10 * 1024 * 1024, // 10MB default
        noteCount: noteCount,
        lastUpdated: new Date(),
        isAdmin: false
      };
      
      setUserStorage(updatedStorage);
    } catch (error) {
      console.error('Error calculating local storage:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Simplified refresh function
  const refreshStorage = async () => {
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
  };

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
  }, []);

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
  const loadAdminStorageStats = async () => {
    // No admin stats in local mode
    return;
  };

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
