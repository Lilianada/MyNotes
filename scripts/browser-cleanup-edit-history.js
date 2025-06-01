/**
 * Simple browser-ready function to clean up edit history
 * Copy and paste this entire function into your browser console, then run: cleanupEditHistory()
 */

async function cleanupEditHistory() {
  console.log('🧹 Starting edit history cleanup (keeping only 10 most recent entries)...');
  
  let totalNotesProcessed = 0;
  let totalHistoryEntriesRemoved = 0;
  
  try {
    // Get all notes from localStorage
    const notesString = localStorage.getItem('notes');
    if (!notesString) {
      console.log('❌ No notes found in localStorage');
      return;
    }
    
    const notes = JSON.parse(notesString);
    console.log(`📚 Found ${notes.length} notes to process`);
    
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
            
            console.log(`📝 "${note.noteTitle}" (ID: ${note.id}): Kept 10, removed ${removedCount} entries`);
          } else {
            console.log(`✅ "${note.noteTitle}" (ID: ${note.id}): Has ${history.length || 0} entries (already ≤10)`);
          }
          
          totalNotesProcessed++;
        } catch (error) {
          console.error(`❌ Failed to process history for note ${note.id}:`, error);
        }
      } else {
        console.log(`ℹ️ "${note.noteTitle}" (ID: ${note.id}): No edit history found`);
        totalNotesProcessed++;
      }
    }
    
    console.log('\n📊 Cleanup Summary:');
    console.log(`✅ Notes processed: ${totalNotesProcessed}`);
    console.log(`🗑️ History entries removed: ${totalHistoryEntriesRemoved}`);
    console.log('🎉 Edit history cleanup completed successfully!');
    console.log('\n💡 All notes now have maximum 10 edit history entries.');
    
    if (totalHistoryEntriesRemoved > 0) {
      console.log('\n🔄 Refresh the page to see the changes take effect.');
    }
    
  } catch (error) {
    console.error('❌ Failed to cleanup edit history:', error);
  }
}

// Instructions for usage
console.log(`
🚀 Edit History Cleanup Tool Ready!

To clean up your edit history and keep only the 10 most recent entries:

1. Make sure this entire script has been pasted into the console
2. Run the command: cleanupEditHistory()
3. Wait for the cleanup to complete
4. Refresh the page

The function is now available as: cleanupEditHistory()
`);
