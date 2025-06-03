import { EditHistoryService } from '@/lib/edit-history/edit-history-service';
import { DEFAULT_EDIT_HISTORY_CONFIG } from '@/lib/edit-history/index';

// Mock the firebase and localStorage services
jest.mock('@/lib/firebase/firebase-notes', () => ({
  firebaseNotesService: {
    updateNote: jest.fn().mockResolvedValue({}),
    fetchNoteHistory: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock('@/lib/storage/local-storage-notes', () => ({
  localStorageNotesService: {
    updateNoteContent: jest.fn().mockResolvedValue({}),
    getNoteHistory: jest.fn().mockResolvedValue([]),
  },
}));

describe('EditHistoryService', () => {
  let service: EditHistoryService;
  
  // Setup for each test
  beforeEach(() => {
    jest.useFakeTimers();
    service = new EditHistoryService();
    
    // Clear mocks between tests
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });
  
  describe('Initialization and Config', () => {
    test('should initialize with default config', () => {
      const service = new EditHistoryService();
      expect(service['config']).toEqual(DEFAULT_EDIT_HISTORY_CONFIG);
    });
    
    test('should update config correctly', () => {
      service.updateConfig({ autosaveInterval: 120000 });
      expect(service['config'].autosaveInterval).toBe(120000);
      expect(service['config'].maxVersions).toBe(DEFAULT_EDIT_HISTORY_CONFIG.maxVersions);
    });
  });
  
  describe('Note Tracking', () => {
    test('should initialize tracking for a note', () => {
      service.initializeTracking(1, 'Test content');
      expect(service['lastSavedContent'].get(1)).toBe('Test content');
    });
    
    test('should cleanup tracking for a specific note', () => {
      // Setup tracking for two notes
      service.initializeTracking(1, 'Note 1 content');
      service.initializeTracking(2, 'Note 2 content');
      
      // Set pending changes and timers
      service['pendingChanges'].set(1, 'Updated content 1');
      service['pendingChanges'].set(2, 'Updated content 2');
      
      const timer1 = setTimeout(() => {}, 1000);
      const timer2 = setTimeout(() => {}, 1000);
      
      service['autosaveTimers'].set(1, timer1);
      service['autosaveTimers'].set(2, timer2);
      
      // Cleanup just note 1
      service.cleanupTracking(1);
      
      // Verify note 1 is cleaned up but note 2 remains
      expect(service['lastSavedContent'].has(1)).toBe(false);
      expect(service['pendingChanges'].has(1)).toBe(false);
      expect(service['autosaveTimers'].has(1)).toBe(false);
      
      expect(service['lastSavedContent'].has(2)).toBe(true);
      expect(service['pendingChanges'].has(2)).toBe(true);
      expect(service['autosaveTimers'].has(2)).toBe(true);
    });
    
    test('should cleanup all tracking', () => {
      // Setup tracking for multiple notes
      service.initializeTracking(1, 'Note 1');
      service.initializeTracking(2, 'Note 2');
      
      service.cleanup();
      
      expect(service['lastSavedContent'].size).toBe(0);
      expect(service['pendingChanges'].size).toBe(0);
      expect(service['autosaveTimers'].size).toBe(0);
    });
  });
  
  describe('Content Change Tracking', () => {
    test('should not track changes for invalid noteId', () => {
      const consoleSpy = jest.spyOn(console, 'warn');
      service.trackContentChange(0, 'Test content', false, null);
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid noteId'));
      expect(service['pendingChanges'].size).toBe(0);
      expect(service['autosaveTimers'].size).toBe(0);
    });
    
    test('should initialize tracking on first change', () => {
      const consoleSpy = jest.spyOn(console, 'log');
      service.trackContentChange(1, 'Initial content', false, null);
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Initializing tracking for note 1'));
      expect(service['lastSavedContent'].get(1)).toBe('Initial content');
      expect(service['pendingChanges'].has(1)).toBe(false); // No pending changes on first init
    });
    
    test('should set timer and store pending change', () => {
      // Initialize tracking first
      service.initializeTracking(1, 'Initial content');
      
      // Now track a change
      service.trackContentChange(1, 'Updated content', false, null);
      
      expect(service['pendingChanges'].get(1)).toBe('Updated content');
      expect(service['autosaveTimers'].has(1)).toBe(true);
    });
    
    test('should clear existing timer when new change is tracked', () => {
      // Initialize tracking
      service.initializeTracking(1, 'Initial content');
      
      // Track first change
      service.trackContentChange(1, 'First update', false, null);
      const firstTimer = service['autosaveTimers'].get(1);
      
      // Track second change
      service.trackContentChange(1, 'Second update', false, null);
      const secondTimer = service['autosaveTimers'].get(1);
      
      expect(firstTimer).not.toBe(secondTimer);
    });
  });
  
  describe('Note Switching Behavior', () => {
    test('should handle switching between notes correctly', async () => {
      // Setup note 1
      service.initializeTracking(1, 'Note 1 content');
      service.trackContentChange(1, 'Updated Note 1 content', false, null);
      
      // Clean up note 1 (simulating switch to note 2)
      await service.cleanupTracking(1);
      
      // Setup note 2
      service.initializeTracking(2, 'Note 2 content');
      service.trackContentChange(2, 'Updated Note 2 content', false, null);
      
      // Verify note 1 content wasn't tracked anymore
      expect(service['lastSavedContent'].has(1)).toBe(false);
      expect(service['pendingChanges'].has(1)).toBe(false);
      
      // Verify note 2 is being tracked
      expect(service['lastSavedContent'].get(2)).toBe('Note 2 content');
      expect(service['pendingChanges'].get(2)).toBe('Updated Note 2 content');
    });
    
  test('should gracefully handle cleanup for nonexistent notes', async () => {
      // Setup tracking for a note
      service.initializeTracking(999, 'Test content');
      service.trackContentChange(999, 'Updated content', false, null);
      
      // Mock localStorageNotesService to return empty array (simulating note not existing)
      jest.spyOn(localStorageNotesService, 'getNotes').mockReturnValueOnce([]);
      
      // This should not throw an error despite the note not existing
      await service.cleanupTracking(999);
      
      // Verify tracking was cleaned up
      expect(service['lastSavedContent'].has(999)).toBe(false);
      expect(service['pendingChanges'].has(999)).toBe(false);
    });
  });
});
