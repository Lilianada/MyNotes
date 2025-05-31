// Quick script to check and create admin entries in Firestore
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, setDoc } = require('firebase/firestore');

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

async function checkAndCreateAdmin() {
  try {
    // Replace with the actual admin email
    const adminEmail = 'your-admin-email@gmail.com'; // Update this with the actual admin email
    
    console.log(`Checking admin status for: ${adminEmail}`);
    
    const adminRef = doc(db, 'admins', adminEmail);
    const adminDoc = await getDoc(adminRef);
    
    if (adminDoc.exists()) {
      console.log(`✅ Admin entry exists for ${adminEmail}`);
      console.log('Admin data:', adminDoc.data());
    } else {
      console.log(`❌ No admin entry found for ${adminEmail}`);
      console.log('Creating admin entry...');
      
      await setDoc(adminRef, {
        email: adminEmail,
        isAdmin: true,
        createdAt: new Date()
      });
      
      console.log(`✅ Admin entry created for ${adminEmail}`);
    }
  } catch (error) {
    console.error('Error checking/creating admin:', error);
  }
}

checkAndCreateAdmin().then(() => {
  console.log('Admin check complete');
  process.exit(0);
}).catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
