/**
 * Helper script to extract Firebase credentials from service account JSON
 * and format them for use in .env.local file
 */

const fs = require('fs');
const path = require('path');

try {
  // Check if service account file exists
  const serviceAccountPath = path.join(__dirname, '..', 'firebase-service-account.json');
  
  if (!fs.existsSync(serviceAccountPath)) {
    console.error('❌ firebase-service-account.json not found');
    process.exit(1);
  }
  
  // Read and parse the service account file
  const serviceAccount = require(serviceAccountPath);
  
  // Extract the necessary credentials
  const { project_id, private_key, client_email } = serviceAccount;
  
  if (!project_id || !private_key || !client_email) {
    console.error('❌ Missing required fields in service account file');
    process.exit(1);
  }
  
  // Format the credentials for .env file
  const envContent = `# Firebase Admin SDK credentials
FIREBASE_PROJECT_ID=${project_id}
FIREBASE_PRIVATE_KEY="${private_key}"
FIREBASE_CLIENT_EMAIL=${client_email}
`;

  console.log('✅ Add these variables to your .env.local file:');
  console.log('\n' + envContent);
  
  // Optionally write to .env.local directly
  const envPath = path.join(__dirname, '..', '.env.local');
  
  if (fs.existsSync(envPath)) {
    const currentEnv = fs.readFileSync(envPath, 'utf8');
    
    // Check if variables already exist
    const hasProjectId = currentEnv.includes('FIREBASE_PROJECT_ID=');
    const hasPrivateKey = currentEnv.includes('FIREBASE_PRIVATE_KEY=');
    const hasClientEmail = currentEnv.includes('FIREBASE_CLIENT_EMAIL=');
    
    if (hasProjectId && hasPrivateKey && hasClientEmail) {
      console.log('⚠️ Firebase variables already exist in .env.local');
      console.log('If you want to update them, please edit the file manually.');
    } else {
      // Append to existing file
      fs.appendFileSync(envPath, '\n' + envContent);
      console.log('✅ Variables added to .env.local');
    }
  } else {
    // Create new file
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Created .env.local with Firebase credentials');
  }
  
  console.log('\n🔒 Remember to add firebase-service-account.json to .gitignore');
  console.log('   and consider deleting it after transferring credentials to .env.local');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
