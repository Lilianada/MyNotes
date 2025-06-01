#!/usr/bin/env node
/**
 * Script to clean up existing note history to keep only last 10 entries
 * This will clean up both localStorage and Firebase edit history
 */

console.log('🧹 Starting edit history cleanup (keeping only 10 most recent entries)...');

// Function to clean up localStorage edit history
function cleanupLocalStorageHistory() {
  if (typeof window === 'undefined' || !window.localStorage) {
    console.log('❌ localStorage not available');
    return { notesProcessed: 0, entriesRemoved: 0 };
  }

  console.log('📱 Cleaning up localStorage edit history...');
  
  let totalNotesProcessed = 0;
  let totalHistoryEntriesRemoved = 0;
  
  try {
    // Get all notes from localStorage
    const notesString = localStorage.getItem('notes');
    if (!notesString) {
      console.log('No notes found in localStorage');
      return { notesProcessed: 0, entriesRemoved: 0 };
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
            
            console.log(`📝 Note "${note.noteTitle}" (ID: ${note.id}): Kept 10, removed ${removedCount} entries`);
          } else {
            console.log(`✅ Note "${note.noteTitle}" (ID: ${note.id}): Already has ${history.length || 0} entries (≤10)`);
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

    return { notesProcessed: totalNotesProcessed, entriesRemoved: totalHistoryEntriesRemoved };
    
  } catch (error) {
    console.error('❌ Failed to cleanup localStorage edit history:', error);
    return { notesProcessed: 0, entriesRemoved: 0 };
  }
}

// Function to clean up Firebase edit history (requires Firebase SDK)
async function cleanupFirebaseHistory() {
  // Check if we're in a Firebase environment
  if (typeof window === 'undefined' || !window.firebase) {
    console.log('🔥 Firebase not available - skipping Firebase cleanup');
    return { notesProcessed: 0, entriesRemoved: 0 };
  }

  console.log('🔥 Cleaning up Firebase edit history...');
  
  try {
    const db = window.firebase.firestore();
    let totalNotesProcessed = 0;
    let totalHistoryEntriesRemoved = 0;

    // Check if user is authenticated
    const user = window.firebase.auth().currentUser;
    if (!user) {
      console.log('❌ No authenticated user found for Firebase cleanup');
      return { notesProcessed: 0, entriesRemoved: 0 };
    }

    // Determine if user is admin (you may need to adjust this logic)
    const isAdmin = user.email === 'admin@example.com'; // Adjust this condition

    // Get the appropriate collection reference
    let notesRef;
    if (isAdmin) {
      notesRef = db.collection('notes');
    } else {
      notesRef = db.collection('users').doc(user.uid).collection('notes');
    }

    // Get all notes
    const notesSnapshot = await notesRef.get();
    console.log(`Found ${notesSnapshot.size} notes in Firebase`);

    // Process each note
    for (const noteDoc of notesSnapshot.docs) {
      const noteData = noteDoc.data();
      
      if (noteData.editHistory && Array.isArray(noteData.editHistory) && noteData.editHistory.length > 10) {
        // Sort by timestamp (newest first) and keep only last 10
        const sortedHistory = noteData.editHistory
          .map(entry => ({
            ...entry,
            timestamp: entry.timestamp?.toDate ? entry.timestamp.toDate() : new Date(entry.timestamp)
          }))
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
          .slice(0, 10);

        // Update the note with pruned history
        await noteDoc.ref.update({
          editHistory: sortedHistory
        });

        const removedCount = noteData.editHistory.length - 10;
        totalHistoryEntriesRemoved += removedCount;
        
        console.log(`📝 Firebase Note "${noteData.noteTitle || noteData.id}" (ID: ${noteData.id}): Kept 10, removed ${removedCount} entries`);
      } else {
        console.log(`✅ Firebase Note "${noteData.noteTitle || noteData.id}" (ID: ${noteData.id}): Already has ${noteData.editHistory?.length || 0} entries (≤10)`);
      }
      
      totalNotesProcessed++;
    }

    return { notesProcessed: totalNotesProcessed, entriesRemoved: totalHistoryEntriesRemoved };

  } catch (error) {
    console.error('❌ Failed to cleanup Firebase edit history:', error);
    return { notesProcessed: 0, entriesRemoved: 0 };
  }
}

// Main cleanup function
async function runCleanup() {
  console.log('🚀 Starting comprehensive edit history cleanup...');
  
  // Clean up localStorage
  const localResults = cleanupLocalStorageHistory();
  
  // Clean up Firebase (if available)
  const firebaseResults = await cleanupFirebaseHistory();
  
  // Summary
  const totalNotesProcessed = localResults.notesProcessed + firebaseResults.notesProcessed;
  const totalEntriesRemoved = localResults.entriesRemoved + firebaseResults.entriesRemoved;
  
  console.log('\n📊 Final Cleanup Summary:');
  console.log(`   • Total notes processed: ${totalNotesProcessed}`);
  console.log(`   • Total history entries removed: ${totalEntriesRemoved}`);
  console.log(`   • localStorage notes: ${localResults.notesProcessed} (${localResults.entriesRemoved} entries removed)`);
  console.log(`   • Firebase notes: ${firebaseResults.notesProcessed} (${firebaseResults.entriesRemoved} entries removed)`);
  console.log('✅ Edit history cleanup completed!');
  console.log('\n💡 All notes now have maximum 10 edit history entries.');
}

// Check environment and run cleanup
if (typeof window !== 'undefined') {
  // Browser environment - run immediately
  runCleanup().catch(error => {
    console.error('❌ Cleanup failed:', error);
  });
} else {
  // Node.js environment - provide instructions
  console.log('❌ This script needs to run in a browser environment with access to localStorage and Firebase');
  console.log('');
  console.log('To run this script:');
  console.log('1. Open your application in a browser');
  console.log('2. Make sure you are logged in (for Firebase cleanup)');
  console.log('3. Open browser developer tools (F12)');
  console.log('4. Go to the Console tab');
  console.log('5. Copy and paste the contents of this file');
  console.log('6. Press Enter to execute');
  console.log('');
  console.log('Alternative: Use the browser-based function below:');
  console.log('');
  console.log('// Copy this function into your browser console:');
  console.log('// ' + runCleanup.toString());
  console.log('// Then call: runCleanup()');
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.cleanupEditHistory = runCleanup;
  window.cleanupLocalStorageHistory = cleanupLocalStorageHistory;
  window.cleanupFirebaseHistory = cleanupFirebaseHistory;
}
