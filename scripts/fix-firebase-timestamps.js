/**
 * Script to fix existing Firebase data that contains serverTimestamp() in arrays
 * This converts any serverTimestamp() objects in editHistory arrays to regular Date objects
 */

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  updateDoc,
  writeBatch,
  serverTimestamp
} = require('firebase/firestore');
// Firebase configuration (using process.env directly)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Convert Firebase Timestamp objects to regular Date objects
 */
function convertTimestamp(timestamp) {
  if (!timestamp) return new Date();
  
  // If it's a Firebase Timestamp object, convert to Date
  if (timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  
  // If it's a serverTimestamp placeholder or invalid, return current date
  if (timestamp && timestamp._methodName === 'serverTimestamp') {
    return new Date();
  }
  
  // If it's already a Date object or string, return it
  return new Date(timestamp);
}

/**
 * Fix editHistory arrays in a note document
 */
function fixEditHistory(editHistory) {
  if (!Array.isArray(editHistory)) return editHistory;
  
  return editHistory.map(entry => ({
    ...entry,
    timestamp: convertTimestamp(entry.timestamp)
  }));
}

/**
 * Fix all notes in the admin collection
 */
async function fixAdminNotes() {
  console.log('🔥 Fixing admin notes collection...');
  
  try {
    const notesRef = collection(db, 'notes');
    const snapshot = await getDocs(notesRef);
    
    let fixed = 0;
    let batch = writeBatch(db);
    let batchCount = 0;
    
    for (const noteDoc of snapshot.docs) {
      const data = noteDoc.data();
      
      if (data.editHistory && Array.isArray(data.editHistory)) {
        const originalHistory = data.editHistory;
        const fixedHistory = fixEditHistory(originalHistory);
        
        // Check if any changes were made
        const needsUpdate = originalHistory.some((entry, index) => {
          const originalTs = entry.timestamp;
          const fixedTs = fixedHistory[index].timestamp;
          
          // Check if timestamp was converted
          return originalTs !== fixedTs || 
                 (originalTs && originalTs._methodName === 'serverTimestamp');
        });
        
        if (needsUpdate) {
          const docRef = doc(db, 'notes', noteDoc.id);
          batch.update(docRef, {
            editHistory: fixedHistory,
            updatedAt: serverTimestamp()
          });
          
          fixed++;
          batchCount++;
          
          console.log(`📝 Fixed note "${data.noteTitle || noteDoc.id}" - converted ${originalHistory.length} history entries`);
          
          // Commit batch every 500 operations
          if (batchCount >= 500) {
            await batch.commit();
            batch = writeBatch(db);
            batchCount = 0;
            console.log(`✅ Committed batch of 500 operations`);
          }
        }
      }
    }
    
    // Commit remaining operations
    if (batchCount > 0) {
      await batch.commit();
      console.log(`✅ Committed final batch of ${batchCount} operations`);
    }
    
    console.log(`✅ Fixed ${fixed} admin notes`);
    return fixed;
  } catch (error) {
    console.error('❌ Error fixing admin notes:', error);
    throw error;
  }
}

/**
 * Fix all user notes (this is more complex as we need to iterate through all users)
 */
async function fixUserNotes() {
  console.log('👥 Fixing user notes collections...');
  
  try {
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    let totalFixed = 0;
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      console.log(`🔍 Checking user ${userId}...`);
      
      const userNotesRef = collection(db, 'users', userId, 'notes');
      const notesSnapshot = await getDocs(userNotesRef);
      
      if (notesSnapshot.empty) {
        console.log(`  No notes found for user ${userId}`);
        continue;
      }
      
      let userFixed = 0;
      let batch = writeBatch(db);
      let batchCount = 0;
      
      for (const noteDoc of notesSnapshot.docs) {
        const data = noteDoc.data();
        
        if (data.editHistory && Array.isArray(data.editHistory)) {
          const originalHistory = data.editHistory;
          const fixedHistory = fixEditHistory(originalHistory);
          
          // Check if any changes were made
          const needsUpdate = originalHistory.some((entry, index) => {
            const originalTs = entry.timestamp;
            const fixedTs = fixedHistory[index].timestamp;
            
            return originalTs !== fixedTs || 
                   (originalTs && originalTs._methodName === 'serverTimestamp');
          });
          
          if (needsUpdate) {
            const docRef = doc(db, 'users', userId, 'notes', noteDoc.id);
            batch.update(docRef, {
              editHistory: fixedHistory,
              updatedAt: serverTimestamp()
            });
            
            userFixed++;
            batchCount++;
            
            console.log(`  📝 Fixed note "${data.noteTitle || noteDoc.id}" for user ${userId}`);
            
            // Commit batch every 500 operations
            if (batchCount >= 500) {
              await batch.commit();
              batch = writeBatch(db);
              batchCount = 0;
              console.log(`  ✅ Committed batch of 500 operations`);
            }
          }
        }
      }
      
      // Commit remaining operations for this user
      if (batchCount > 0) {
        await batch.commit();
        console.log(`  ✅ Committed final batch of ${batchCount} operations for user ${userId}`);
      }
      
      console.log(`✅ Fixed ${userFixed} notes for user ${userId}`);
      totalFixed += userFixed;
    }
    
    console.log(`✅ Fixed ${totalFixed} total user notes`);
    return totalFixed;
  } catch (error) {
    console.error('❌ Error fixing user notes:', error);
    throw error;
  }
}

/**
 * Main function to fix all Firebase timestamp issues
 */
async function main() {
  console.log('🚀 Starting Firebase timestamp fix...\n');
  
  try {
    const adminFixed = await fixAdminNotes();
    const userFixed = await fixUserNotes();
    
    console.log('\n📊 Summary:');
    console.log(`✅ Fixed ${adminFixed} admin notes`);
    console.log(`✅ Fixed ${userFixed} user notes`);
    console.log(`✅ Total notes fixed: ${adminFixed + userFixed}`);
    
    if (adminFixed + userFixed > 0) {
      console.log('\n🎉 Firebase timestamp fix completed successfully!');
      console.log('The serverTimestamp() in arrays error should now be resolved.');
    } else {
      console.log('\n✨ No timestamp issues found in Firebase data.');
    }
    
  } catch (error) {
    console.error('\n❌ Firebase timestamp fix failed:', error);
    process.exit(1);
  }
}

// Run the fix
if (require.main === module) {
  main().then(() => {
    console.log('\n🏁 Script completed.');
    process.exit(0);
  }).catch(error => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
}

module.exports = { main, fixAdminNotes, fixUserNotes };
