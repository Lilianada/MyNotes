"use client";

import React, { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { useNotes } from "@/contexts/notes/note-context";

export function NoteErrorDetector() {
  const [showBanner, setShowBanner] = useState(false);
  const { notes, isLoading } = useNotes();

  // Check if we have the "feature disabled" state
  useEffect(() => {
    // Wait for loading to complete
    if (isLoading) return;
    
    // If no notes are loaded after loading is complete, show the banner
    // to help user diagnose and fix
    const timer = setTimeout(() => {
      if (notes.length === 0) {
        console.log('[NoteErrorDetector] Detected possible issue - no notes after loading complete');
        setShowBanner(true);
      }
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [notes.length, isLoading]);
  
  // Handle refresh action
  const handleRefresh = () => {
    window.location.reload();
  };
  
  if (!showBanner) return null;
  
  return (
    <div className="fixed bottom-4 inset-x-4 sm:left-1/2 sm:transform sm:-translate-x-1/2 sm:w-full sm:max-w-md bg-white border border-amber-200 shadow-lg rounded-lg px-4 py-3 flex items-center justify-between z-50">
      <div className="flex-1">
        <h3 className="text-sm font-medium text-amber-800">Feature may be disabled</h3>
        <p className="text-xs text-amber-700 mt-1">
          Try refreshing the page to resolve any loading issues.
        </p>
      </div>
      <button
        onClick={handleRefresh}
        className="ml-4 bg-amber-100 hover:bg-amber-200 text-amber-800 px-3 py-1 rounded-md text-sm flex items-center"
      >
        <RefreshCw size={14} className="mr-1" />
        Refresh
      </button>
    </div>
  );
}
