/**
 * Temporary React component for cleaning up edit history
 * This can be added to your app temporarily to run the cleanup
 */

import React, { useState } from 'react';

interface CleanupStats {
  notesProcessed: number;
  entriesRemoved: number;
  isComplete: boolean;
}

export const EditHistoryCleanupComponent: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [stats, setStats] = useState<CleanupStats | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const cleanupEditHistory = async () => {
    setIsRunning(true);
    setStats(null);
    setLogs([]);
    
    addLog('🧹 Starting edit history cleanup...');
    
    let totalNotesProcessed = 0;
    let totalHistoryEntriesRemoved = 0;
    
    try {
      // Get all notes from localStorage
      const notesString = localStorage.getItem('notes');
      if (!notesString) {
        addLog('❌ No notes found in localStorage');
        setIsRunning(false);
        return;
      }
      
      const notes = JSON.parse(notesString);
      addLog(`📚 Found ${notes.length} notes to process`);
      
      // Process each note's history
      for (const note of notes) {
        const historyKey = `note_history_${note.id}`;
        const historyString = localStorage.getItem(historyKey);
        
        if (historyString) {
          try {
            const history = JSON.parse(historyString);
            
            if (Array.isArray(history) && history.length > 10) {
              // Sort by timestamp (newest first) and keep only last 10
              const sortedHistory = history
                .map(entry => ({
                  ...entry,
                  timestamp: new Date(entry.timestamp)
                }))
                .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                .slice(0, 10);
              
              // Save the pruned history
              localStorage.setItem(historyKey, JSON.stringify(sortedHistory));
              
              const removedCount = history.length - 10;
              totalHistoryEntriesRemoved += removedCount;
              
              addLog(`📝 "${note.noteTitle}" (ID: ${note.id}): Kept 10, removed ${removedCount} entries`);
            } else {
              addLog(`✅ "${note.noteTitle}" (ID: ${note.id}): Has ${history.length || 0} entries (already ≤10)`);
            }
            
            totalNotesProcessed++;
          } catch (error) {
            addLog(`❌ Failed to process history for note ${note.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        } else {
          addLog(`ℹ️ "${note.noteTitle}" (ID: ${note.id}): No edit history found`);
          totalNotesProcessed++;
        }
      }
      
      setStats({
        notesProcessed: totalNotesProcessed,
        entriesRemoved: totalHistoryEntriesRemoved,
        isComplete: true
      });
      
      addLog('🎉 Edit history cleanup completed successfully!');
      addLog(`✅ Processed ${totalNotesProcessed} notes, removed ${totalHistoryEntriesRemoved} history entries`);
      
      if (totalHistoryEntriesRemoved > 0) {
        addLog('🔄 Refresh the page to see the changes take effect.');
      }
      
    } catch (error) {
      addLog(`❌ Failed to cleanup edit history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          🧹 Edit History Cleanup
        </h2>
        <p className="text-gray-600">
          This tool will clean up your edit history to keep only the 10 most recent entries per note. 
          This will help reduce storage usage and improve performance.
        </p>
      </div>

      <div className="mb-6">
        <button
          onClick={cleanupEditHistory}
          disabled={isRunning}
          className={`px-6 py-3 rounded-md font-medium transition-colors ${
            isRunning
              ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
              : 'bg-red-600 text-white hover:bg-red-700'
          }`}
        >
          {isRunning ? '🔄 Cleaning up...' : '🚀 Start Cleanup'}
        </button>
      </div>

      {stats && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <h3 className="font-semibold text-green-800 mb-2">📊 Cleanup Results</h3>
          <div className="text-green-700">
            <p>✅ Notes processed: {stats.notesProcessed}</p>
            <p>🗑️ History entries removed: {stats.entriesRemoved}</p>
            <p className="mt-2 font-medium">
              {stats.entriesRemoved > 0 
                ? '🔄 Please refresh the page to see changes take effect.' 
                : '✨ No cleanup needed - all notes already have ≤10 history entries!'}
            </p>
          </div>
        </div>
      )}

      {logs.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold text-gray-800 mb-2">📋 Cleanup Log</h3>
          <div className="bg-gray-50 border border-gray-200 rounded-md p-4 max-h-64 overflow-y-auto">
            {logs.map((log, index) => (
              <div key={index} className="text-sm text-gray-700 mb-1 font-mono">
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <h3 className="font-semibold text-blue-800 mb-2">ℹ️ What this tool does:</h3>
        <ul className="text-blue-700 text-sm space-y-1">
          <li>• Scans all your notes for edit history</li>
          <li>• Keeps the 10 most recent edit history entries per note</li>
          <li>• Removes older history entries to free up storage space</li>
          <li>• Updates the localStorage data structure</li>
          <li>• Does not affect your note content, only the edit history</li>
        </ul>
      </div>
    </div>
  );
};

export default EditHistoryCleanupComponent;
