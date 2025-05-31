/**
 * Firebase storage service for managing user storage limits and tracking
 */

import { UserStorage } from '@/types';
import { db } from '@/lib/firebase/firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { createDefaultUserStorage, calculateTotalStorage } from '@/lib/storage/storage-utils';
import { firebaseNotesService } from '@/lib/firebase/firebase-notes';

/**
 * Get user storage information
 * Now using users/{userId}/storage/info subcollection structure
 */
export async function getUserStorage(userId: string, isAdmin: boolean = false): Promise<UserStorage> {
  try {
    // New structure: users/{userId}/storage/info
    const storageRef = doc(db, 'users', userId, 'storage', 'info');
    const storageDoc = await getDoc(storageRef);
    
    if (storageDoc.exists()) {
      const data = storageDoc.data();
      return {
        userId: data.userId,
        totalStorage: data.totalStorage || 0,
        maxStorage: data.maxStorage || (isAdmin ? 1024 * 1024 * 1024 : 10 * 1024 * 1024),
        noteCount: data.noteCount || 0,
        lastUpdated: data.lastUpdated?.toDate() || new Date(),
        isAdmin: data.isAdmin || false
      };
    } else {
      // Create default storage record
      const defaultStorage = createDefaultUserStorage(userId, isAdmin);
      await setDoc(storageRef, {
        ...defaultStorage,
        lastUpdated: serverTimestamp()
      });
      return defaultStorage;
    }
  } catch (error) {
    console.error('Error getting user storage:', error);
    return createDefaultUserStorage(userId, isAdmin);
  }
}

/**
 * Update user storage information
 * Now using users/{userId}/storage/info subcollection structure
 */
export async function updateUserStorage(userStorage: UserStorage): Promise<void> {
  try {
    // New structure: users/{userId}/storage/info
    const storageRef = doc(db, 'users', userStorage.userId, 'storage', 'info');
    await updateDoc(storageRef, {
      totalStorage: userStorage.totalStorage,
      noteCount: userStorage.noteCount,
      lastUpdated: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating user storage:', error);
    throw error;
  }
}

/**
 * Recalculate and update user storage based on actual notes
 */
export async function recalculateUserStorage(userId: string, isAdmin: boolean = false): Promise<UserStorage> {
  try {
    // Get all user notes from the correct collection based on user type
    const notes = await firebaseNotesService.getNotes(userId, isAdmin);
    
    // Calculate total storage
    const totalStorage = calculateTotalStorage(notes);
    
    // Get current storage record
    const currentStorage = await getUserStorage(userId, isAdmin);
    
    // Update storage record
    const updatedStorage: UserStorage = {
      ...currentStorage,
      totalStorage,
      noteCount: notes.length,
      lastUpdated: new Date()
    };
    
    await updateUserStorage(updatedStorage);
    return updatedStorage;
  } catch (error) {
    console.error('Error recalculating user storage:', error);
    throw error;
  }
}

/**
 * Check if user can add a note based on storage limits
 */
export async function canUserAddNote(userId: string, noteSize: number, isAdmin: boolean = false): Promise<boolean> {
  try {
    const userStorage = await getUserStorage(userId, isAdmin);
    return (userStorage.totalStorage + noteSize) <= userStorage.maxStorage;
  } catch (error) {
    console.error('Error checking storage limit:', error);
    return false;
  }
}

/**
 * Increment storage usage when adding a note
 * Now using users/{userId}/storage/info subcollection structure
 */
export async function incrementStorage(userId: string, noteSize: number): Promise<void> {
  try {
    // New structure: users/{userId}/storage/info
    const storageRef = doc(db, 'users', userId, 'storage', 'info');
    const storageDoc = await getDoc(storageRef);
    
    if (storageDoc.exists()) {
      const currentData = storageDoc.data();
      await updateDoc(storageRef, {
        totalStorage: (currentData.totalStorage || 0) + noteSize,
        noteCount: (currentData.noteCount || 0) + 1,
        lastUpdated: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error incrementing storage:', error);
    throw error;
  }
}

/**
 * Decrement storage usage when deleting a note
 * Now using users/{userId}/storage/info subcollection structure
 */
export async function decrementStorage(userId: string, noteSize: number): Promise<void> {
  try {
    // New structure: users/{userId}/storage/info
    const storageRef = doc(db, 'users', userId, 'storage', 'info');
    const storageDoc = await getDoc(storageRef);
    
    if (storageDoc.exists()) {
      const currentData = storageDoc.data();
      await updateDoc(storageRef, {
        totalStorage: Math.max(0, (currentData.totalStorage || 0) - noteSize),
        noteCount: Math.max(0, (currentData.noteCount || 0) - 1),
        lastUpdated: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error decrementing storage:', error);
    throw error;
  }
}
