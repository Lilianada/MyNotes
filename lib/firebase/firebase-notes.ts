// filepath: /Users/lilian/Desktop/Projects/NoteIt-down/lib/firebase-notes.ts
/**
 * Re-export the firebase notes service
 * This file maintains backward compatibility with existing imports
 * while allowing the implementation to be refactored into smaller modules
 */

import { firebaseNotesService } from './index';

export { firebaseNotesService };
export default firebaseNotesService;
