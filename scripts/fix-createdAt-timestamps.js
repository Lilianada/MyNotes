/**
 * Script to fix createdAt timestamps in Firebase notes
 * This converts createdAt fields saved as JavaScript Date objects or maps to Firebase serverTimestamp
 */

// This needs to be run in a Node.js environment with Firebase Admin SDK
const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin SDK with your service account
// You need to provide a path to your service account key JSON file
const serviceAccount = require('../firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = getFirestore();

/**
 * Check if a value appears to be a JavaScript Date object that was serialized to Firestore
 * (which becomes a map with seconds and nanoseconds)
 */
function isDateMap(value) {
  return (
    value && 
    typeof value === 'object' && 
    value.seconds !== undefined && 
    value.nanoseconds !== undefined
  );
}

/**
 * Fix createdAt fields in admin notes collection
 */
async function fixCreatedAtFields() {
  console.log('🔍 Checking admin notes collection for createdAt fields...');
  
  try {
    const notesRef = db.collection('notes');
    const snapshot = await notesRef.get();
    
    let fixed = 0;
    const batch = db.batch();
    let batchCount = 0;
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // Check if createdAt exists and is a map (which means it was saved as a Date object)
      if (data.createdAt && isDateMap(data.createdAt)) {
        console.log(`📝 Found note "${data.noteTitle || doc.id}" with date map createdAt field`);
        
        const docRef = db.collection('notes').doc(doc.id);
        // Use set with merge to keep all other fields
        batch.set(docRef, {
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
        fixed++;
        batchCount++;
        
        // Commit batch every 500 operations
        if (batchCount >= 500) {
          await batch.commit();
          batchCount = 0;
          console.log(`✅ Committed batch of 500 operations`);
        }
      }
    }
    
    // Commit remaining operations
    if (batchCount > 0) {
      await batch.commit();
      console.log(`✅ Committed final batch of ${batchCount} operations`);
    }
    
    console.log(`✅ Fixed ${fixed} admin notes createdAt fields`);
    return fixed;
  } catch (error) {
    console.error('❌ Error fixing admin notes createdAt fields:', error);
    throw error;
  }
}

/**
 * Fix createdAt fields in user notes collections
 */
async function fixUserCreatedAtFields() {
  console.log('👥 Checking user notes collections for createdAt fields...');
  
  try {
    const usersRef = db.collection('users');
    const usersSnapshot = await usersRef.get();
    
    let totalFixed = 0;
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      console.log(`👤 Checking notes for user: ${userId}`);
      
      const userNotesRef = db.collection('users').doc(userId).collection('notes');
      const notesSnapshot = await userNotesRef.get();
      
      let userFixed = 0;
      let batch = db.batch();  // Changed to let instead of const
      let batchCount = 0;
      
      for (const noteDoc of notesSnapshot.docs) {
        const data = noteDoc.data();
        
        // Check if createdAt exists and is a map (which means it was saved as a Date object)
        if (data.createdAt && isDateMap(data.createdAt)) {
          const docRef = db.collection('users').doc(userId).collection('notes').doc(noteDoc.id);
          // Use set with merge to keep all other fields
          batch.set(docRef, {
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
          
          userFixed++;
          batchCount++;
          
          // Commit batch every 500 operations
          if (batchCount >= 500) {
            await batch.commit();
            // Create a new batch
            batch = db.batch();
            batchCount = 0;
            console.log(`✅ Committed batch of 500 operations for user ${userId}`);
          }
        }
      }
      
      // Commit remaining operations for this user
      if (batchCount > 0) {
        await batch.commit();
        console.log(`✅ Committed final batch of ${batchCount} operations for user ${userId}`);
      }
      
      console.log(`👍 Fixed ${userFixed} notes for user ${userId}`);
      totalFixed += userFixed;
    }
    
    console.log(`✅ Fixed createdAt fields for ${totalFixed} user notes across ${usersSnapshot.size} users`);
    return totalFixed;
  } catch (error) {
    console.error('❌ Error fixing user notes createdAt fields:', error);
    throw error;
  }
}

/**
 * Main function to run all fixes
 */
async function main() {
  try {
    console.log('🚀 Starting createdAt timestamp fix script...');
    
    // Fix createdAt fields in admin notes
    const adminFixed = await fixCreatedAtFields();
    
    // Fix createdAt fields in user notes
    const userFixed = await fixUserCreatedAtFields();
    
    console.log(`
    =========================
    🎉 Fix complete! Summary:
    =========================
    ✅ Fixed ${adminFixed} admin notes
    ✅ Fixed ${userFixed} user notes
    =========================
    `);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

// Run the main function
main();
