// Firebase Configuration Test Script
// This script tests your Firebase configuration and admin access

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDoc, collection, addDoc, deleteDoc } from 'firebase/firestore';

// Load environment variables (only works in Next.js environment)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

console.log('Starting Firebase configuration test...');

// Initialize Firebase
try {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const googleProvider = new GoogleAuthProvider();
  
  console.log('✅ Firebase initialized successfully');
  
  // Test authentication (this will open a popup)
  console.log('Testing Google authentication...');
  console.log('A Google sign-in popup should appear. Please sign in to continue the test.');
  
  signInWithPopup(auth, googleProvider)
    .then(async (result) => {
      const user = result.user;
      console.log(`✅ Authentication successful - Signed in as ${user.displayName} (${user.email})`);
      
      // Test admin status
      console.log('Checking admin status...');
      const adminRef = doc(db, 'admins', user.email || '');
      const adminDoc = await getDoc(adminRef);
      
      if (adminDoc.exists()) {
        console.log('✅ Admin status confirmed - User exists in admins collection');
        
        // Test database write operation
        console.log('Testing database write operation...');
        try {
          const testDocRef = await addDoc(collection(db, 'test'), {
            message: 'Test document',
            createdBy: user.email,
            timestamp: new Date()
          });
          console.log(`✅ Database write successful - Created document ${testDocRef.id}`);
          
          // Clean up test document
          await deleteDoc(testDocRef);
          console.log('✅ Test document deleted successfully');
          
          console.log('\nAll tests passed! Your Firebase configuration is working correctly.');
        } catch (error) {
          console.error('❌ Database write failed:', error);
          console.log('\nTest failed. Please check your Firestore rules and settings.');
        }
      } else {
        console.log('❌ Admin status check failed - User not found in admins collection');
        console.log(`To fix: Add a document with ID "${user.email}" to the "admins" collection in Firestore`);
      }
    })
    .catch((error) => {
      console.error('❌ Authentication failed:', error);
      console.log('\nTest failed. Please check your Firebase authentication settings.');
    });
  
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
  console.log('\nTest failed. Please check your Firebase configuration in .env.local');
}
