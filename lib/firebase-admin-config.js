/**
 * Firebase Admin SDK configuration
 * This file loads Firebase service account credentials from environment variables
 * instead of using a JSON file directly, which is more secure.
 */

const admin = require('firebase-admin');

function getFirebaseAdminCredential() {
  // Check if we have all required environment variables
  const requiredEnvVars = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_PRIVATE_KEY',
    'FIREBASE_CLIENT_EMAIL'
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
    console.error('Please set these variables in your .env.local file or environment');
    throw new Error('Firebase Admin SDK initialization failed: missing credentials');
  }
  
  // Create credential object from environment variables
  return admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Fix newlines
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL
  });
}

module.exports = {
  getFirebaseAdminCredential
};
