# Firebase Setup Guide for MyNotes

This guide will help you set up Firebase for the MyNotes application.

## Prerequisites
- A Google account
- Node.js and npm installed

## Step 1: Create a Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter a project name (e.g., "MyNotes")
4. Configure Google Analytics if desired
5. Click "Create project"

## Step 2: Register a Web App
1. In the Firebase Console, select your project
2. Click the web icon (</>) to add a web app
3. Register your app with a nickname (e.g., "MyNotes Web")
4. Click "Register app"
5. Copy the Firebase configuration object for the next step

## Step 3: Configure Environment Variables
1. In your project, update the `.env.local` file with your Firebase config:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

## Step 4: Enable Authentication
1. In the Firebase Console, go to "Authentication"
2. Click "Get started"
3. Select the "Google" provider
4. Enable it and configure:
   - Enter your app name
   - Select your email for support
   - Configure authorized domains if needed
5. Click "Save"

## Step 5: Set Up Firestore Database
1. In the Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Start in production mode or test mode (we'll set up security rules later)
4. Choose a location for your database
5. Click "Enable"

## Step 6: Create the Admins Collection
1. In Firestore, click "Start collection"
2. Set the Collection ID to `admins`
3. Create a document with the ID as your email address (e.g., `your.email@example.com`)
4. Add any fields you want (optional) or leave it empty
5. Click "Save"

## Step 7: Deploy Firestore Security Rules
1. In the Firebase Console, go to "Firestore Database" > "Rules"
2. Replace the default rules with those from the `firestore.rules` file in this project
3. Click "Publish"

## Step 8: Test Your Setup
1. Run your application locally with `npm run dev`
2. Sign in with Google using the same email you added to the `admins` collection
3. You should see a toast notification confirming you're an admin
4. Create, edit, and delete notes to verify that they're being stored in Firestore

## Troubleshooting
- If sign-in fails, check that the Google Authentication provider is properly enabled
- If admin detection fails, verify that the document in the `admins` collection exactly matches your email
- Check browser console for any Firebase-related errors
