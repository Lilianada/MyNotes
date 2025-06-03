// Test script to verify that createdAt is protected during updates
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin (you'll need to update the path to your service account file)
const serviceAccount = require('../path/to/your-service-account.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

// Test function to verify the createdAt protection
async function testUpdateProtection() {
  try {
    console.log('Starting update protection test...');
    
    // Get a test note (update the path as needed)
    const notesRef = db.collection('notes');
    const snapshot = await notesRef.limit(1).get();
    
    if (snapshot.empty) {
      console.log('No notes found for testing');
      return;
    }
    
    const noteDoc = snapshot.docs[0];
    const noteData = noteDoc.data();
    const noteId = noteData.id;
    
    console.log(`Testing with note ID: ${noteId}`);
    
    // Get the original createdAt value
    const originalCreatedAt = noteData.createdAt;
    console.log('Original createdAt:', originalCreatedAt);
    
    // Try to update the note with a new createdAt value
    const testDate = new Date('2000-01-01');
    console.log('Attempting to update note with createdAt:', testDate);
    
    // Simulate an update using the updateNoteData function logic
    await noteDoc.ref.update({
      content: 'Test content update',
      updatedAt: new Date(),
      createdAt: testDate // This should be ignored by our fix
    });
    
    // Get the updated note
    const updatedDoc = await noteDoc.ref.get();
    const updatedData = updatedDoc.data();
    
    // Check if createdAt was modified
    if (updatedData.createdAt.isEqual(originalCreatedAt)) {
      console.log('✅ SUCCESS: createdAt was protected from modification!');
    } else {
      console.log('❌ FAIL: createdAt was modified during update!');
      console.log('New createdAt:', updatedData.createdAt);
    }
    
    // Restore the original content if needed
    if (noteData.content !== 'Test content update') {
      await noteDoc.ref.update({
        content: noteData.content
      });
      console.log('Restored original content');
    }
    
  } catch (error) {
    console.error('Error during test:', error);
  }
}

// Run the test
testUpdateProtection().then(() => {
  console.log('Test completed');
  process.exit(0);
});
