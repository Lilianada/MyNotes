#!/usr/bin/env node
/**
 * Script to clean up existing note history to keep only last 15 entries
 * Run this script to clean up existing notes that have more than 15 history entries
 */

console.log('🧹 Starting edit history cleanup...');

// Check if we're in a browser environment
if (typeof window !== 'undefined' && window.localStorage) {
  console.log('Running in browser environment');
  
  let totalNotesProcessed = 0;
  let totalHistoryEntriesRemoved = 0;
  
  try {
    // Get all notes from localStorage
    const notesString = localStorage.getItem('notes');
    if (!notesString) {
      console.log('No notes found in localStorage');
      return;
    }
    
    const notes = JSON.parse(notesString);
    console.log(`Found ${notes.length} notes`);
    
    // Process each note's history
    notes.forEach(note => {
      const historyKey = `note_history_${note.id}`;
      const historyString = localStorage.getItem(historyKey);
      
      if (historyString) {
        try {
          const history = JSON.parse(historyString);
          
          if (Array.isArray(history) && history.length > 15) {
            // Sort by timestamp (newest first) and keep only last 15
            const sortedHistory = history
              .map(entry => ({
                ...entry,
                timestamp: new Date(entry.timestamp)
              }))
              .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
              .slice(0, 15);
            
            // Save the pruned history
            localStorage.setItem(historyKey, JSON.stringify(sortedHistory));
            
            const removedCount = history.length - 15;
            totalHistoryEntriesRemoved += removedCount;
            
            console.log(`📝 Note "${note.noteTitle}" (ID: ${note.id}): Kept 15, removed ${removedCount} entries`);
          } else {
            console.log(`✅ Note "${note.noteTitle}" (ID: ${note.id}): Already has ${history.length || 0} entries (≤15)`);
          }
          
          totalNotesProcessed++;
        } catch (error) {
          console.error(`❌ Failed to process history for note ${note.id}:`, error);
        }
      } else {
        console.log(`ℹ️ Note "${note.noteTitle}" (ID: ${note.id}): No history found`);
        totalNotesProcessed++;
      }
    });
    
    console.log('\n📊 Cleanup Summary:');
    console.log(`   • Notes processed: ${totalNotesProcessed}`);
    console.log(`   • History entries removed: ${totalHistoryEntriesRemoved}`);
    console.log('✅ Edit history cleanup completed!');
    
  } catch (error) {
    console.error('❌ Failed to cleanup edit history:', error);
  }
} else {
  console.log('❌ This script needs to run in a browser environment with localStorage access');
  console.log('');
  console.log('To run this script:');
  console.log('1. Open your application in a browser');
  console.log('2. Open browser developer tools (F12)');
  console.log('3. Go to the Console tab');
  console.log('4. Copy and paste the contents of this file');
  console.log('5. Press Enter to execute');
  console.log('');
  console.log('Or run it through the application UI if available.');
}
