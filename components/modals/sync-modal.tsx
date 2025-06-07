import React, { useState } from "react";
import { Button } from "../ui/button";
import { AlertCircle, ArrowUpFromLine, Cloud, HardDrive, MergeIcon, ChevronDown } from "lucide-react";
import { Note } from "@/types";
import { cn } from "@/lib/data-processing/utils";

export type ConflictResolutionStrategy = 'local' | 'cloud' | 'merge' | 'manual';

export interface ConflictedNote {
  localNote: Note;
  cloudNote: Note;
  resolution?: ConflictResolutionStrategy;
}

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSync: (strategy: ConflictResolutionStrategy, manualResolutions?: Record<string, ConflictResolutionStrategy>) => void;
  localNoteCount: number;
  cloudNoteCount: number;
  conflictedNotes?: ConflictedNote[];
  isLoading?: boolean;
}

export function SyncModal({ 
  isOpen, 
  onClose, 
  onSync, 
  localNoteCount, 
  cloudNoteCount, 
  conflictedNotes = [],
  isLoading = false
}: SyncModalProps) {
  const [globalStrategy, setGlobalStrategy] = useState<ConflictResolutionStrategy>('merge');
  const [manualResolutions, setManualResolutions] = useState<Record<string, ConflictResolutionStrategy>>({});
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});
  
  if (!isOpen) return null;

  const handleClickOutside = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isLoading) {
      onClose();
    }
  };
  
  const hasConflicts = conflictedNotes.length > 0;
  
  const toggleNoteExpansion = (noteId: string) => {
    setExpandedNotes(prev => ({
      ...prev,
      [noteId]: !prev[noteId]
    }));
  };
  
  const handleManualResolution = (noteId: string, resolution: ConflictResolutionStrategy) => {
    setManualResolutions(prev => ({
      ...prev,
      [noteId]: resolution
    }));
  };
  
  const handleSyncClick = () => {
    onSync(globalStrategy, hasConflicts ? manualResolutions : undefined);
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]" 
      onClick={handleClickOutside}
      style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0}}
    >
      <div 
        className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md max-h-[80vh] overflow-y-auto" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start mb-4">
          <AlertCircle className="text-blue-500 mr-3 mt-0.5 flex-shrink-0" size={20} />
          <div>
            <h2 className="text-lg font-semibold mb-2">Sync Notes</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              You have {localNoteCount} local {localNoteCount === 1 ? 'note' : 'notes'} and {cloudNoteCount} cloud {cloudNoteCount === 1 ? 'note' : 'notes'}.
            </p>
            
            {hasConflicts && (
              <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-md">
                <p className="text-amber-800 dark:text-amber-200 font-medium mb-1">Conflicts Detected</p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  {conflictedNotes.length} {conflictedNotes.length === 1 ? 'note has' : 'notes have'} different versions locally and in the cloud.
                  Choose how to resolve these conflicts below.
                </p>
              </div>
            )}
          </div>
        </div>
        
        {hasConflicts && (
          <div className="mb-6">
            <div className="mb-3">
              <h3 className="text-sm font-medium mb-2">Global Resolution Strategy:</h3>
              <div className="flex space-x-2">
                <Button 
                  variant={globalStrategy === 'local' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setGlobalStrategy('local')}
                  className="flex items-center"
                >
                  <HardDrive size={14} className="mr-1.5" />
                  Keep Local
                </Button>
                <Button 
                  variant={globalStrategy === 'cloud' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setGlobalStrategy('cloud')}
                  className="flex items-center"
                >
                  <Cloud size={14} className="mr-1.5" />
                  Keep Cloud
                </Button>
                <Button 
                  variant={globalStrategy === 'merge' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setGlobalStrategy('merge')}
                  className="flex items-center"
                >
                  <MergeIcon size={14} className="mr-1.5" />
                  Merge
                </Button>
              </div>
            </div>
            
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
              <h3 className="text-sm font-medium mb-2">Conflicted Notes:</h3>
              <div className="space-y-2 max-h-[30vh] overflow-y-auto">
                {conflictedNotes.map((conflict) => {
                  const noteId = conflict.localNote.uniqueId || String(conflict.localNote.id);
                  const isExpanded = expandedNotes[noteId] || false;
                  const resolution = manualResolutions[noteId] || globalStrategy;
                  
                  return (
                    <div 
                      key={noteId}
                      className="border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden"
                    >
                      <div 
                        className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 cursor-pointer"
                        onClick={() => toggleNoteExpansion(noteId)}
                      >
                        <div className="font-medium truncate">
                          {conflict.localNote.noteTitle || 'Untitled Note'}
                        </div>
                        <ChevronDown 
                          size={16} 
                          className={cn(
                            "transition-transform", 
                            isExpanded ? "transform rotate-180" : ""
                          )} 
                        />
                      </div>
                      
                      {isExpanded && (
                        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                              <h4 className="text-xs font-medium mb-1 flex items-center">
                                <HardDrive size={12} className="mr-1" /> Local Version
                              </h4>
                              <div className="text-xs p-2 bg-gray-100 dark:bg-gray-800 rounded h-20 overflow-y-auto">
                                <p className="font-medium">{conflict.localNote.noteTitle}</p>
                                <p className="text-gray-500 dark:text-gray-400 line-clamp-2">
                                  {conflict.localNote.content.substring(0, 100)}{conflict.localNote.content.length > 100 ? '...' : ''}
                                </p>
                                <p className="text-gray-400 dark:text-gray-500 text-[10px] mt-1">
                                  Updated: {new Date(conflict.localNote.updatedAt || conflict.localNote.createdAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <div>
                              <h4 className="text-xs font-medium mb-1 flex items-center">
                                <Cloud size={12} className="mr-1" /> Cloud Version
                              </h4>
                              <div className="text-xs p-2 bg-gray-100 dark:bg-gray-800 rounded h-20 overflow-y-auto">
                                <p className="font-medium">{conflict.cloudNote.noteTitle}</p>
                                <p className="text-gray-500 dark:text-gray-400 line-clamp-2">
                                  {conflict.cloudNote.content.substring(0, 100)}{conflict.cloudNote.content.length > 100 ? '...' : ''}
                                </p>
                                <p className="text-gray-400 dark:text-gray-500 text-[10px] mt-1">
                                  Updated: {new Date(conflict.cloudNote.updatedAt || conflict.cloudNote.createdAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex space-x-2 justify-end">
                            <Button 
                              variant={resolution === 'local' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handleManualResolution(noteId, 'local')}
                              className="flex items-center text-xs py-0 h-7"
                            >
                              <HardDrive size={12} className="mr-1" />
                              Local
                            </Button>
                            <Button 
                              variant={resolution === 'cloud' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handleManualResolution(noteId, 'cloud')}
                              className="flex items-center text-xs py-0 h-7"
                            >
                              <Cloud size={12} className="mr-1" />
                              Cloud
                            </Button>
                            <Button 
                              variant={resolution === 'merge' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handleManualResolution(noteId, 'merge')}
                              className="flex items-center text-xs py-0 h-7"
                            >
                              <MergeIcon size={12} className="mr-1" />
                              Merge
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        
        <div className="flex justify-end space-x-3">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            variant="default"
            onClick={handleSyncClick}
            className="flex items-center"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 mr-2 rounded-full border-2 border-t-transparent border-white animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <ArrowUpFromLine size={16} className="mr-1.5" />
                Sync Notes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
