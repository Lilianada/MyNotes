/**
 * Migration script to reorganize Firestore structure
 * Moves userStorage/{userId} to users/{userId}/storage/info
 * 
 * Run with: node scripts/migrate-storage-structure.js
 */

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  setDoc, 
  deleteDoc,
  writeBatch,
  serverTimestamp
} = require('firebase/firestore');
const { config } = require('dotenv');

// Load environment variables
config();

// Firebase configuration
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
 * Migrate userStorage collection to users/{userId}/storage/info subcollection
 */
async function migrateStorageStructure() {
  console.log('🚀 Starting Firestore storage structure migration...');
  
  try {
    // Get all documents from the old userStorage collection
    const userStorageRef = collection(db, 'userStorage');
    const snapshot = await getDocs(userStorageRef);
    
    if (snapshot.empty) {
      console.log('✅ No documents found in userStorage collection. Migration not needed.');
      return;
    }
    
    console.log(`📊 Found ${snapshot.size} storage documents to migrate`);
    
    const batch = writeBatch(db);
    let migratedCount = 0;
    let errorCount = 0;
    
    for (const docSnap of snapshot.docs) {
      try {
        const userId = docSnap.id;
        const storageData = docSnap.data();
        
        console.log(`📦 Migrating storage for user: ${userId}`);
        
        // Check if user document exists
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
          console.log(`⚠️  User document not found for ${userId}, skipping...`);
          continue;
        }
        
        // Create new storage document in subcollection
        const newStorageRef = doc(db, 'users', userId, 'storage', 'info');
        
        // Check if storage already exists in new location
        const existingStorage = await getDoc(newStorageRef);
        if (existingStorage.exists()) {
          console.log(`ℹ️  Storage already exists in new location for ${userId}, skipping...`);
          continue;
        }
        
        // Prepare storage data for new location
        const newStorageData = {
          ...storageData,
          migratedAt: serverTimestamp(),
          migratedFrom: 'userStorage'
        };
        
        // Add to batch: create new location
        batch.set(newStorageRef, newStorageData);
        
        // Add to batch: delete old location (commented out for safety)
        // batch.delete(docSnap.ref);
        
        migratedCount++;
        
      } catch (error) {
        console.error(`❌ Error migrating storage for user ${docSnap.id}:`, error);
        errorCount++;
      }
    }
    
    // Commit the batch
    if (migratedCount > 0) {
      console.log(`💾 Committing ${migratedCount} storage migrations...`);
      await batch.commit();
      console.log(`✅ Successfully migrated ${migratedCount} storage documents`);
    }
    
    if (errorCount > 0) {
      console.log(`⚠️  ${errorCount} documents failed to migrate`);
    }
    
    console.log('\n📋 Migration Summary:');
    console.log(`   • Total documents found: ${snapshot.size}`);
    console.log(`   • Successfully migrated: ${migratedCount}`);
    console.log(`   • Failed migrations: ${errorCount}`);
    console.log(`   • Skipped (already exists): ${snapshot.size - migratedCount - errorCount}`);
    
    console.log('\n⚠️  IMPORTANT: Old userStorage documents are NOT deleted.');
    console.log('   After verifying the migration worked correctly, you can manually delete the old userStorage collection.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

/**
 * Verify the migration was successful
 */
async function verifyMigration() {
  console.log('\n🔍 Verifying migration...');
  
  try {
    // Check users collection for storage subcollections
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    let verifiedCount = 0;
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const storageRef = doc(db, 'users', userId, 'storage', 'info');
      const storageDoc = await getDoc(storageRef);
      
      if (storageDoc.exists()) {
        verifiedCount++;
        console.log(`✅ Verified storage for user: ${userId}`);
      }
    }
    
    console.log(`\n📊 Verification complete: ${verifiedCount} users have storage in new location`);
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

/**
 * Main migration function
 */
async function main() {
  try {
    await migrateStorageStructure();
    await verifyMigration();
    console.log('\n🎉 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration script failed:', error);
    process.exit(1);
  }
}

// Run the migration
main();
