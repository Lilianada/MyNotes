// Comprehensive test file to verify all date fixes
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');

// Initialize Firebase Admin (you'll need to update the path to your service account file)
const serviceAccount = require('../firebase-service-account.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

// Helper function to convert any timestamp to a readable string
function formatTimestamp(timestamp) {
  if (!timestamp) return 'null';

  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString();
  }

  if (timestamp instanceof Date) {
    return timestamp.toISOString();
  }

  if (timestamp && timestamp.seconds) {
    return new Date(timestamp.seconds * 1000).toISOString();
  }

  return String(timestamp);
}

// Test 1: Verify createdAt is protected during updates
async function testUpdateProtection() {
  try {
    console.log('\n🔍 TEST 1: Verifying createdAt protection during updates...');
    
    // Get a test note (update the path as needed)
    const notesRef = db.collection('notes');
    const snapshot = await notesRef.limit(1).get();
    
    if (snapshot.empty) {
      console.log('No notes found for testing');
      return false;
    }
    
    const noteDoc = snapshot.docs[0];
    const noteData = noteDoc.data();
    const noteId = noteData.id;
    
    console.log(`Testing with note ID: ${noteId}`);
    
    // Get the original createdAt value
    const originalCreatedAt = noteData.createdAt;
    console.log('Original createdAt:', formatTimestamp(originalCreatedAt));
    
    // Try to update the note with a new createdAt value
    const testDate = new Date('2000-01-01');
    console.log('Attempting to update note with createdAt:', formatTimestamp(testDate));
    
    // Simulate an update using the updateNoteData function logic
    await noteDoc.ref.update({
      content: 'Test content update',
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: testDate // This should be ignored by our fix
    });
    
    // Get the updated note
    const updatedDoc = await noteDoc.ref.get();
    const updatedData = updatedDoc.data();
    
    // Check if createdAt was modified
    const createdAtPreserved = updatedData.createdAt.isEqual(originalCreatedAt);
    
    if (createdAtPreserved) {
      console.log('✅ SUCCESS: createdAt was protected from modification!');
    } else {
      console.log('❌ FAIL: createdAt was modified during update!');
      console.log('New createdAt:', formatTimestamp(updatedData.createdAt));
    }
    
    // Restore the original content
    await noteDoc.ref.update({
      content: noteData.content
    });
    console.log('Restored original content');
    
    return createdAtPreserved;
  } catch (error) {
    console.error('Error during test:', error);
    return false;
  }
}

// Test 2: Create a new note and verify timestamp format
async function testCreateNote() {
  try {
    console.log('\n🔍 TEST 2: Verifying timestamp format for new notes...');
    
    // Create a test note with the proper timestamp format
    const notesRef = db.collection('test_notes');
    const testNoteTitle = `Test Note ${Date.now()}`;
    
    // Create timestamp for the test
    const serverTimestamp = FieldValue.serverTimestamp();
    
    // Create test note
    const testNote = {
      id: Date.now(),
      noteTitle: testNoteTitle,
      content: 'This is a test note to verify timestamp format',
      createdAt: serverTimestamp,
      updatedAt: serverTimestamp,
      wordCount: 9,
      slug: `test-note-${Date.now()}`
    };
    
    console.log('Creating test note...');
    const docRef = await notesRef.add(testNote);
    console.log(`Test note created with ID: ${docRef.id}`);
    
    // Wait a moment for server timestamp to resolve
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Retrieve the test note
    const noteSnapshot = await docRef.get();
    const noteData = noteSnapshot.data();
    
    console.log('createdAt data type:', Object.prototype.toString.call(noteData.createdAt));
    console.log('createdAt value:', formatTimestamp(noteData.createdAt));
    
    // Check if createdAt is a Firebase Timestamp
    const isFirebaseTimestamp = noteData.createdAt instanceof Timestamp;
    
    if (isFirebaseTimestamp) {
      console.log('✅ SUCCESS: createdAt is a proper Firebase Timestamp!');
    } else {
      console.log('❌ FAIL: createdAt is not a Firebase Timestamp!');
      console.log('Actual type:', Object.prototype.toString.call(noteData.createdAt));
    }
    
    // Clean up - delete the test note
    await docRef.delete();
    console.log('Test note deleted');
    
    return isFirebaseTimestamp;
  } catch (error) {
    console.error('Error during test:', error);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('💻 RUNNING DATE FIX VERIFICATION TESTS');
  
  const results = [];
  results.push(await testUpdateProtection());
  results.push(await testCreateNote());
  
  console.log('\n📝 TEST RESULTS SUMMARY:');
  const allPassed = results.every(result => result === true);
  
  if (allPassed) {
    console.log('✅ ALL TESTS PASSED! The date fixes are working correctly.');
  } else {
    console.log('❌ SOME TESTS FAILED! Please review the issues above.');
  }
}

// Run the tests
runAllTests().then(() => {
  console.log('\nTests completed');
  process.exit(0);
});
