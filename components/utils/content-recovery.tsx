"use client";

import { useState, useEffect } from "react";
import { useNotes } from "@/contexts/notes/note-context";
import { Note, NoteEditHistory } from "@/types";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";

interface HistoryWithNote {
  note: Note;
  history: NoteEditHistory[];
}

export default function ContentRecovery() {
  const { notes, getNoteHistory, updateNote } = useNotes();
  const { isAdmin, user } = useAuth();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [allHistory, setAllHistory] = useState<HistoryWithNote[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<NoteEditHistory | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [recoveredContent, setRecoveredContent] = useState<string | null>(null);

  // Helper function to sanitize and normalize edit history entries
  const normalizeHistoryEntries = (entries: any[], note: Note): NoteEditHistory[] => {
    if (!Array.isArray(entries)) return [];
    
    return entries.map(entry => {
      // Ensure timestamp is a Date object
      let timestamp: Date;
      try {
        if (entry.timestamp instanceof Date) {
          timestamp = entry.timestamp;
        } else if (entry.timestamp) {
          timestamp = new Date(entry.timestamp);
        } else {
          timestamp = new Date();
        }
      } catch (e) {
        timestamp = new Date();
        console.error("Invalid timestamp:", entry.timestamp);
      }
      
      // Ensure editType is valid
      const validEditTypes = ['create', 'update', 'title', 'tags', 'category', 'autosave'];
      const editType = validEditTypes.includes(entry.editType) ? entry.editType : 'update';
      
      // If contentSnapshot is missing, use the note's current content as fallback
      const contentSnapshot = typeof entry.contentSnapshot === 'string' && entry.contentSnapshot.length > 0
        ? entry.contentSnapshot 
        : note.content;
      
      // Calculate content length if missing
      const contentLength = entry.contentLength || (contentSnapshot ? contentSnapshot.length : 0);
      
      return {
        timestamp,
        editType,
        contentSnapshot,
        contentLength,
        changePercentage: entry.changePercentage || 0
      };
    });
  };
  
  // Load all note histories
  const loadAllHistory = async () => {
    setIsLoading(true);
    
    try {
      const historyPromises = notes.map(async (note) => {
        // First check if the note itself has edit history
        let history: NoteEditHistory[] = [];
        
        // Check for editHistory in the note object
        if (note.editHistory && Array.isArray(note.editHistory) && note.editHistory.length > 0) {
          history = normalizeHistoryEntries(note.editHistory, note);
          console.log(`Found ${history.length} history entries in note object for ${note.noteTitle}`);
        }
        
        // If no history found in the note object, try the API
        if (history.length === 0) {
          const apiHistory = await getNoteHistory(note.id);
          if (Array.isArray(apiHistory) && apiHistory.length > 0) {
            history = normalizeHistoryEntries(apiHistory, note);
            console.log(`Found ${history.length} history entries via API for ${note.noteTitle}`);
          }
        }
        
        // If still no history, try to get it directly from localStorage
        if (history.length === 0 && typeof window !== 'undefined') {
          try {
            const historyString = window.localStorage.getItem(`note_history_${note.id}`);
            if (historyString) {
              const localHistory = JSON.parse(historyString);
              if (Array.isArray(localHistory) && localHistory.length > 0) {
                history = normalizeHistoryEntries(localHistory, note);
                console.log(`Found ${history.length} history entries in localStorage for ${note.noteTitle}`);
              }
            }
          } catch (e) {
            console.error(`Error reading history from localStorage for note ${note.id}:`, e);
          }
        }
        
        // If still no history, create a synthetic history entry from the current note content
        if (history.length === 0 && note.content && note.content.trim().length > 0) {
          const creationTime = note.createdAt instanceof Date ? note.createdAt : new Date(note.createdAt || Date.now());
          const updateTime = note.updatedAt instanceof Date ? note.updatedAt : 
                           (note.updatedAt ? new Date(note.updatedAt) : new Date());
          
          // Create two synthetic entries - one from creation and one from the latest update
          history = [
            {
              timestamp: updateTime,
              editType: 'update',
              contentSnapshot: note.content,
              contentLength: note.content.length,
              changePercentage: 100
            }
          ];
          
          // Only add creation entry if it's different from update time
          if (creationTime.getTime() !== updateTime.getTime()) {
            history.push({
              timestamp: creationTime,
              editType: 'create',
              contentSnapshot: note.content,
              contentLength: note.content.length,
              changePercentage: 100
            });
          }
          
          console.log(`Created ${history.length} synthetic history entries for ${note.noteTitle}`);
        }
        
        // Debug any issues with history entries
        if (history.length > 0) {
          // Count entries with and without content snapshots
          const entriesWithSnapshot = history.filter(h => typeof h.contentSnapshot === 'string' && h.contentSnapshot.length > 0).length;
          const entriesWithoutSnapshot = history.length - entriesWithSnapshot;
          
          if (entriesWithoutSnapshot > 0) {
            console.log(`Warning: ${entriesWithoutSnapshot} of ${history.length} history entries for "${note.noteTitle}" are missing content snapshots`);
          }
          
          // Log sample entry for debugging
          const sampleEntry = history[0];
          if (sampleEntry) {
            console.log(`Sample history entry for "${note.noteTitle}":`, {
              hasSnapshot: !!sampleEntry.contentSnapshot,
              snapshotLength: sampleEntry.contentSnapshot?.length || 0,
              timestamp: sampleEntry.timestamp,
              type: sampleEntry.editType
            });
          }
        }

        // Only include history entries that have content snapshots
        const filteredHistory = history.filter(h => {
          // Verify each entry has a contentSnapshot - this is the critical field for recovery
          return typeof h.contentSnapshot === 'string' && h.contentSnapshot.length > 0;
        });

        // Sort by timestamp (newest first)
        filteredHistory.sort((a, b) => {
          // Handle various timestamp formats safely
          let timeA = 0;
          let timeB = 0;
          
          try {
            if (a.timestamp instanceof Date) {
              timeA = a.timestamp.getTime();
            } else if (typeof a.timestamp === 'string') {
              timeA = new Date(a.timestamp).getTime();
            } else if (typeof a.timestamp === 'number') {
              timeA = a.timestamp;
            }
          } catch (e) {
            console.error("Error converting timestamp A:", e);
          }
          
          try {
            if (b.timestamp instanceof Date) {
              timeB = b.timestamp.getTime();
            } else if (typeof b.timestamp === 'string') {
              timeB = new Date(b.timestamp).getTime();
            } else if (typeof b.timestamp === 'number') {
              timeB = b.timestamp;
            }
          } catch (e) {
            console.error("Error converting timestamp B:", e);
          }
          
          return timeB - timeA; // Sort in descending order (newest first)
        });
        
        return { note, history: filteredHistory };
      });
      
      const results = await Promise.all(historyPromises);
      // Process the history entries to ensure they're valid and have content snapshots
      const processedResults = results.map(item => {
        if (!item.history || item.history.length === 0) {
          return item;
        }
        
        // Only keep history entries with valid content snapshots
        const validHistory = item.history.filter(h => 
          h && typeof h.contentSnapshot === 'string' && h.contentSnapshot.length > 0
        );
        
        return { ...item, history: validHistory };
      });
      
      // Check how many notes have history after processing
      let notesWithHistory = processedResults.filter(item => item.history && item.history.length > 0);
      console.log(`After processing: ${notesWithHistory.length} notes have valid history entries`);
      
      // Debug history entries that might have been filtered out
      for (const item of processedResults) {
        if (item.history && item.history.length > 0) {
          console.log(`Note "${item.note.noteTitle}" has ${item.history.length} valid history entries with content snapshots`);
        }
      }
      
      // Set the history for display
      const validHistory = processedResults.filter(item => item.history && item.history.length > 0);
      console.log(`Found ${validHistory.length} notes with history entries out of ${notes.length} total notes`);
      
      // Log more detailed information for debugging purposes
      if (validHistory.length === 0) {
        console.log("No history found for any notes. Here are the note IDs that were checked:", 
          notes.map(n => `ID: ${n.id}, Title: ${n.noteTitle}`).join(", "));
        
        // Check if any localStorage keys match the note_history_ pattern
        if (typeof window !== 'undefined') {
          const historyKeys = Object.keys(localStorage).filter(key => key.startsWith('note_history_'));
          if (historyKeys.length > 0) {
            console.log("Found history keys in localStorage:", historyKeys);
          } else {
            console.log("No history keys found in localStorage");
          }
        }
      } else {
        console.log("History found for notes:", 
          validHistory.map(item => `ID: ${item.note.id}, Title: ${item.note.noteTitle}, Versions: ${item.history.length}`).join("; "));
      }
      
      setAllHistory(validHistory);
    } catch (error) {
      console.error("Failed to load history:", error);
      toast({
        title: "Error Loading History",
        description: "There was a problem retrieving note history. Please try again.",
        variant: "destructive",
      });
      
      // Log more detailed error information to help with troubleshooting
      console.error("Details:", {
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        notesCount: notes.length,
        browserStorage: typeof window !== 'undefined' ? Object.keys(localStorage).length : 'N/A'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle note selection
  const handleSelectNote = (noteId: number) => {
    setSelectedNoteId(noteId);
    setSelectedVersion(null);
    setPreviewContent(null);
    setRecoveredContent(null);
    
    const noteWithHistory = allHistory.find(item => item.note.id === noteId);
    if (noteWithHistory && noteWithHistory.history.length > 0) {
      // Select the most recent version by default
      setSelectedVersion(noteWithHistory.history[0]);
      setPreviewContent(noteWithHistory.history[0].contentSnapshot || '');
    }
  };

  // Handle version selection
  const handleSelectVersion = (version: NoteEditHistory) => {
    // Ensure contentSnapshot is accessible
    if (!version.contentSnapshot) {
      console.error("Selected version has no content snapshot:", version);
      toast({
        title: "Error",
        description: "This version doesn't have recoverable content",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedVersion(version);
    setPreviewContent(version.contentSnapshot);
    setRecoveredContent(null);
  };

  // Handle content recovery
  const handleRecoverContent = () => {
    if (!selectedNoteId || !previewContent) return;
    
    // Find the original note
    const noteToUpdate = notes.find(note => note.id === selectedNoteId);
    if (!noteToUpdate) {
      toast({
        title: "Error",
        description: "Could not find the selected note",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Update the note with the recovered content
      updateNote(selectedNoteId, previewContent);
      setRecoveredContent(previewContent);
      
      toast({
        title: "Recovery Successful",
        description: `Content recovered for "${noteToUpdate.noteTitle}"`,
      });
      
      console.log(`Recovered content for note "${noteToUpdate.noteTitle}" (${selectedNoteId})`);
    } catch (error) {
      console.error("Failed to recover content:", error);
      toast({
        title: "Recovery Failed",
        description: "There was a problem applying the recovered content",
        variant: "destructive",
      });
    }
  };

  // Format date for display
  const formatDate = (date: Date | string | number | undefined) => {
    if (!date) return 'Unknown date';
    
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      return dateObj.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short', 
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (e) {
      console.error("Error formatting date:", e);
      return 'Invalid date';
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
        🔄 Content Recovery Tool
      </h2>
      
      <p className="mb-6 text-gray-600 dark:text-gray-300">
        This tool helps you recover previous versions of your notes, including content that may have been lost due to undo operations affecting multiple notes.
      </p>
      
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={loadAllHistory}
            disabled={isLoading}
            className={`px-4 py-2 rounded-md font-medium ${
              isLoading
                ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isLoading ? '🔄 Loading History...' : '🔍 Scan All Note History'}
          </button>
          
          {isLoading && (
            <div className="animate-pulse text-sm text-gray-600 dark:text-gray-400">
              Scanning notes for history entries...
            </div>
          )}
        </div>
        
        {!isLoading && allHistory.length === 0 && (
          <div className="mt-3 text-sm text-blue-600 dark:text-blue-400">
            Click the button above to scan for recoverable note history.
          </div>
        )}
      </div>

      {allHistory.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-lg mb-3">Select a Note</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {allHistory.map((item) => (
                <div 
                  key={item.note.id}
                  onClick={() => handleSelectNote(item.note.id)}
                  className={`p-2 rounded-md cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 ${
                    selectedNoteId === item.note.id ? 'bg-blue-100 dark:bg-blue-900' : ''
                  }`}
                >
                  <div className="font-medium">{item.note.noteTitle}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {item.history.length} versions • Last updated {formatDate(item.note.updatedAt || item.note.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedNoteId && (
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-lg mb-3">Select a Version</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {allHistory
                  .find(item => item.note.id === selectedNoteId)
                  ?.history.map((version, index) => (
                    <div
                      key={index}
                      onClick={() => handleSelectVersion(version)}
                      className={`p-2 rounded-md cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 ${
                        selectedVersion === version ? 'bg-blue-100 dark:bg-blue-900' : ''
                      }`}
                    >
                      <div className="font-medium">
                        {version.editType === 'autosave' ? '🔄 Auto-saved' : '💾 Manual Save'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(version.timestamp)}
                        {version.changePercentage && ` • ${version.changePercentage.toFixed(1)}% change`}
                        {version.contentLength && ` • ${version.contentLength} chars`}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {previewContent && (
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-lg mb-3">Preview Content</h3>
              <div className="prose dark:prose-invert prose-sm max-h-96 overflow-y-auto mb-4">
                <pre className="p-3 bg-white dark:bg-gray-800 rounded text-xs border border-gray-300 dark:border-gray-600">
                  {previewContent.substring(0, 500)}
                  {previewContent.length > 500 && '...'}
                </pre>
              </div>
              
              <button
                onClick={handleRecoverContent}
                disabled={!selectedNoteId || !previewContent}
                className={`px-4 py-2 rounded-md font-medium ${
                  !selectedNoteId || !previewContent
                    ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                ✅ Recover This Content
              </button>
              
              {recoveredContent && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-md text-green-800 dark:text-green-200">
                  Content was successfully recovered and applied to the note!
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {allHistory.length === 0 && !isLoading && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-md">
          <div className="font-medium mb-2">No history entries found</div>
          <p>
            This could be because:
          </p>
          <ul className="list-disc list-inside mt-2 mb-3 space-y-1">
            <li>You haven't made any edits to your notes yet</li>
            <li>History tracking was recently enabled and hasn't captured changes</li>
            <li>A previous issue prevented history from being saved properly</li>
          </ul>
          <p>
            Try making some changes to your notes and then come back to this page to recover content if needed.
          </p>
        </div>
      )}
    </div>
  );
}
