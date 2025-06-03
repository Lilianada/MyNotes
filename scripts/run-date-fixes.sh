#!/bin/bash
# Script to run the date fix and verification scripts in sequence

# Check if the service account file has been updated
if grep -q "REPLACE_WITH_YOUR_PROJECT_ID" firebase-service-account.json; then
  echo "⚠️ ERROR: You need to update the firebase-service-account.json file with your actual credentials first."
  echo "Please follow these steps:"
  echo "1. Go to Firebase console (console.firebase.google.com)"
  echo "2. Select your project"
  echo "3. Go to Project Settings > Service accounts"
  echo "4. Click 'Generate new private key'"
  echo "5. Replace the content of firebase-service-account.json with the downloaded JSON"
  exit 1
fi

# Run the fix script
echo "🚀 Running fix-createdAt-timestamps.js..."
node scripts/fix-createdAt-timestamps.js

# Check if the fix script succeeded
if [ $? -eq 0 ]; then
  echo "✅ Fix script completed successfully"
  
  # Run the verification script
  echo "🔍 Running verify-date-fixes.js..."
  node scripts/verify-date-fixes.js
  
  if [ $? -eq 0 ]; then
    echo "✅ Verification script completed successfully"
    echo "🎉 All date fixes have been applied and verified!"
  else
    echo "❌ Verification script failed"
    exit 1
  fi
else
  echo "❌ Fix script failed"
  exit 1
fi
