/**
 * Service for syncing local storage notes to Firebase without overwriting existing data
 */

import { Note } from '@/types';
import { firebaseNotesService } from '@/lib/firebase/firebase-notes';
import { localStorageNotesService } from '@/lib/storage/local-storage-notes';
import { generateUniqueId, calculateNoteSize } from '@/lib/storage/storage-utils';
import { getUserStorage, incrementStorage } from '@/lib/firebase/firebase-storage';

/**
 * Sync local storage notes to Firebase for a user
 * Only uploads notes that don't already exist in Firebase (based on uniqueId)
 */
export async function syncLocalNotesToFirebase(userId: string, isAdmin: boolean = false): Promise<{
  synced: number;
  skipped: number;
  errors: string[];
}> {
  const result = {
    synced: 0,
    skipped: 0,
    errors: [] as string[]
  };

  try {
    // Get all local notes
    const localNotes = localStorageNotesService.getNotes();
    
    if (localNotes.length === 0) {
      return result;
    }

    // Get all Firebase notes to check for existing uniqueIds
    const firebaseNotes = await firebaseNotesService.getNotes(userId, isAdmin);
    const existingUniqueIds = new Set(firebaseNotes.map(note => note.uniqueId).filter(Boolean));

    // Get user storage to check limits
    const userStorage = await getUserStorage(userId, isAdmin);

    for (const localNote of localNotes) {
      try {
        // Ensure the note has a unique ID
        if (!localNote.uniqueId) {
          localNote.uniqueId = generateUniqueId();
          // Update local storage with the new uniqueId
          localStorageNotesService.updateNote(localNote.id, localNote.content, { uniqueId: localNote.uniqueId });
        }

        // Skip if note already exists in Firebase
        if (existingUniqueIds.has(localNote.uniqueId)) {
          result.skipped++;
          continue;
        }

        // Calculate note size
        const noteSize = calculateNoteSize(localNote);

        // Check storage limits for non-admin users
        if (!isAdmin && (userStorage.totalStorage + noteSize) > userStorage.maxStorage) {
          result.errors.push(`Note "${localNote.noteTitle}" skipped: would exceed storage limit`);
          continue;
        }

        // Create the note in Firebase using the proper collection structure
        await firebaseNotesService.addNote(userId, localNote.noteTitle, isAdmin);

        // Update storage tracking
        if (!isAdmin) {
          await incrementStorage(userId, noteSize);
        }

        result.synced++;
      } catch (error) {
        console.error(`Error syncing note ${localNote.id}:`, error);
        result.errors.push(`Failed to sync note "${localNote.noteTitle}": ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Clear local storage after successful sync (optional - you may want to keep for offline access)
    if (result.synced > 0 && result.errors.length === 0) {
      // Optionally clear local storage or mark notes as synced
      console.log(`Successfully synced ${result.synced} notes to Firebase`);
    }

  } catch (error) {
    console.error('Error during sync process:', error);
    result.errors.push(`Sync process failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

/**
 * Check if a note with the given uniqueId already exists in Firebase
 */
export async function noteExistsInFirebase(uniqueId: string, userId: string, isAdmin: boolean = false): Promise<boolean> {
  try {
    const firebaseNotes = await firebaseNotesService.getNotes(userId, isAdmin);
    return firebaseNotes.some(note => note.uniqueId === uniqueId);
  } catch (error) {
    console.error('Error checking if note exists in Firebase:', error);
    return false;
  }
}

/**
 * Add unique IDs to existing local notes that don't have them
 */
export function addUniqueIdsToLocalNotes(): void {
  try {
    const localNotes = localStorageNotesService.getNotes();
    let updated = false;

    for (const note of localNotes) {
      if (!note.uniqueId) {
        note.uniqueId = generateUniqueId();
        localStorageNotesService.updateNote(note.id, note.content, { uniqueId: note.uniqueId });
        updated = true;
      }
    }

    if (updated) {
      console.log('Added unique IDs to local notes');
      // Save all notes back to local storage with unique IDs
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('notes', JSON.stringify(localNotes));
      }
    }
  } catch (error) {
    console.error('Error adding unique IDs to local notes:', error);
  }
}
