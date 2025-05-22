"use client";

import React, { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useNotes } from "@/contexts/note-context";
import { useToast } from "@/hooks/use-toast";

/**
 * A banner component that appears when the app detects potential issues
 * with note loading and provides recovery options
 */
export function RecoveryBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const { notes, isLoading, setNotes } = useNotes();
  const { toast } = useToast();
  
  // Check for potential recovery scenarios
  useEffect(() => {
    // Check if notes loaded in localStorage but not in the app state
    const checkForRecoveryState = async () => {
      try {
        // Don't show recovery option while still loading
        if (isLoading) return;
        
        // Only show recovery option if no notes are loaded in state
        if (notes.length > 0) return;
        
        // Check if notes exist in localStorage as a potential recovery source
        if (typeof window !== "undefined") {
          const localStorageModule = await import('@/lib/local-storage-notes');
          const localNotes = localStorageModule.localStorageNotesService.getNotes();
          
          if (localNotes.length > 0) {
            console.log(`[RecoveryBanner] Found ${localNotes.length} notes in localStorage that aren't in state`);
            setShowBanner(true);
          }
        }
      } catch (error) {
        console.error("[RecoveryBanner] Error checking for recovery state:", error);
      }
    };
    
    // Wait a bit before checking for recovery to avoid flickering during normal load
    const timer = setTimeout(checkForRecoveryState, 2000);
    return () => clearTimeout(timer);
  }, [notes.length, isLoading]);
  
  // Handler for the recover button
  const handleRecover = async () => {
    try {
      // Show loading toast
      toast({
        title: "Recovering notes...",
        description: "Attempting to recover your notes from local storage"
      });
      
      // Get notes from localStorage
      const localStorageModule = await import('@/lib/local-storage-notes');
      const localNotes = localStorageModule.localStorageNotesService.getNotes();
      
      if (localNotes.length > 0) {
        // Update state with recovered notes
        setNotes(localNotes);
        
        // Show success toast
        toast({
          title: "Notes recovered",
          description: `Successfully recovered ${localNotes.length} notes from local storage`,
          variant: "default"
        });
        
        // Hide banner
        setShowBanner(false);
      } else {
        // No notes found in localStorage
        toast({
          title: "Recovery failed",
          description: "No notes found in local storage to recover",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("[RecoveryBanner] Error during recovery:", error);
      
      // Show error toast
      toast({
        title: "Recovery failed",
        description: "An error occurred while trying to recover your notes",
        variant: "destructive"
      });
    }
  };
  
  if (!showBanner) return null;
  
  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border border-amber-200 shadow-lg rounded-lg px-4 py-3 flex items-center justify-between z-50">
      <div className="flex-1">
        <h3 className="text-sm font-medium text-amber-800">Feature seems disabled?</h3>
        <p className="text-xs text-amber-700 mt-1">
          We found notes in storage but they aren't displayed. Try to recover them.
        </p>
      </div>
      <button
        onClick={handleRecover}
        className="ml-4 bg-amber-100 hover:bg-amber-200 text-amber-800 px-3 py-1 rounded-md text-sm flex items-center"
      >
        <RefreshCw size={14} className="mr-1" />
        Recover
      </button>
    </div>
  );
}
