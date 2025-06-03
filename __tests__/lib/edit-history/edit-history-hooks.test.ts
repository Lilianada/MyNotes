import { renderHook, act } from '@testing-library/react';
import { useEditHistory } from '@/lib/edit-history/edit-history-hooks';
import { editHistoryService } from '@/lib/edit-history/edit-history-service';

// Mock the edit history service
jest.mock('@/lib/edit-history/edit-history-service', () => {
  return {
    editHistoryService: {
      updateConfig: jest.fn(),
      initializeTracking: jest.fn(),
      cleanupTracking: jest.fn(),
      cleanup: jest.fn(),
      trackContentChange: jest.fn(),
      forceSave: jest.fn().mockResolvedValue(undefined),
      getHistory: jest.fn().mockResolvedValue([]),
    },
  };
});

describe('useEditHistory hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should initialize tracking for a note on mount', () => {
    const note = { id: 1, title: 'Test Note', content: 'Test content' };
    const isAdmin = false;
    const user = { uid: 'test-user' };

    renderHook(() => useEditHistory(note, isAdmin, user));

    expect(editHistoryService.initializeTracking).toHaveBeenCalledWith(1, 'Test content');
  });

  test('should clean up when unmounted', () => {
    const note = { id: 1, title: 'Test Note', content: 'Test content' };
    const isAdmin = false;
    const user = { uid: 'test-user' };

    const { unmount } = renderHook(() => useEditHistory(note, isAdmin, user));
    
    unmount();

    expect(editHistoryService.cleanupTracking).toHaveBeenCalledWith(1);
  });

  test('should clean up previous note when switching notes', () => {
    const note1 = { id: 1, title: 'Note 1', content: 'Content 1' };
    const note2 = { id: 2, title: 'Note 2', content: 'Content 2' };
    const isAdmin = false;
    const user = { uid: 'test-user' };

    const { rerender } = renderHook(
      ({ note }) => useEditHistory(note, isAdmin, user),
      { initialProps: { note: note1 } }
    );

    // Switch to note 2
    rerender({ note: note2 });

    // Should clean up note 1 and initialize note 2
    expect(editHistoryService.cleanupTracking).toHaveBeenCalledWith(1);
    expect(editHistoryService.initializeTracking).toHaveBeenCalledWith(2, 'Content 2');
  });

  test('should track content changes', () => {
    const note = { id: 1, title: 'Test Note', content: 'Test content' };
    const isAdmin = false;
    const user = { uid: 'test-user' };

    const { result } = renderHook(() => useEditHistory(note, isAdmin, user));

    act(() => {
      result.current.trackContentChange('Updated content');
    });

    expect(editHistoryService.trackContentChange).toHaveBeenCalledWith(
      1, 
      'Updated content', 
      isAdmin, 
      user
    );
  });

  test('should force save content', async () => {
    const note = { id: 1, title: 'Test Note', content: 'Test content' };
    const isAdmin = false;
    const user = { uid: 'test-user' };

    const { result } = renderHook(() => useEditHistory(note, isAdmin, user));

    await act(async () => {
      await result.current.forceSave('Updated content', 'update');
    });

    expect(editHistoryService.forceSave).toHaveBeenCalledWith(
      1, 
      'Updated content', 
      'update', 
      isAdmin, 
      user
    );
  });

  test('should not call any service methods when note is null', () => {
    renderHook(() => useEditHistory(null, false, null));
    
    expect(editHistoryService.initializeTracking).not.toHaveBeenCalled();
    
    // Additional test for methods that should be no-ops with null note
    const { result } = renderHook(() => useEditHistory(null, false, null));
    
    act(() => {
      result.current.trackContentChange('Updated content');
    });
    
    expect(editHistoryService.trackContentChange).not.toHaveBeenCalled();
  });
});
