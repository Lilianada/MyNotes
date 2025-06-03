#!/bin/zsh

# -----------------------------------------------------
# Simple script to maintain NoteIt-down date handling
# -----------------------------------------------------

echo "🚀 Starting date maintenance operations..."

# Check if service account file exists
if [ ! -f "../firebase-service-account.json" ]; then
  echo "❌ Error: firebase-service-account.json not found!"
  echo "Please create a service account file before proceeding."
  exit 1
fi

# Install required dependencies
npm install firebase-admin

# Run the fix script for timestamps
echo "🔧 Running fix for Firebase timestamp formats..."
node fix-createdAt-timestamps.js

echo "✅ Date maintenance completed!"
echo "Remember: Use serverTimestamp() for all new date fields in Firebase"
