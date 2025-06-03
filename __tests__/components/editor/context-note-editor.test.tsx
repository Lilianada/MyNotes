import React from 'react';
import { render, screen } from '@testing-library/react';
import { ContextNoteEditor } from '@/components/editor/context-note-editor';
import { useNotes } from '@/contexts/notes/note-context';
import { editHistoryService } from '@/lib/edit-history/edit-history-service';

// Mock dependencies
jest.mock('@/contexts/notes/note-context', () => ({
  useNotes: jest.fn(),
}));

jest.mock('@/components/editor/note-editor', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(({ note }) => (
      <div data-testid="note-editor">
        <div data-testid="note-title">{note.title}</div>
        <div data-testid="note-content">{note.content}</div>
      </div>
    )),
  };
});

jest.mock('@/lib/edit-history/edit-history-service', () => ({
  editHistoryService: {
    cleanupTracking: jest.fn(),
  },
}));

describe('ContextNoteEditor', () => {
  // Mock note data
  const mockNotes = [
    { id: 1, title: 'Note 1', content: 'Content of note 1' },
    { id: 2, title: 'Note 2', content: 'Content of note 2' },
  ];
  
  // Default mock for useNotes hook
  const defaultUseNotesMock = {
    notes: mockNotes,
    selectedNoteId: 1,
    updateNote: jest.fn(),
    updateNoteTitle: jest.fn(),
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    (useNotes as jest.Mock).mockReturnValue(defaultUseNotesMock);
  });
  
  test('should render note editor with selected note', () => {
    render(<ContextNoteEditor />);
    
    expect(screen.getByTestId('note-editor')).toBeInTheDocument();
    expect(screen.getByTestId('note-title')).toHaveTextContent('Note 1');
    expect(screen.getByTestId('note-content')).toHaveTextContent('Content of note 1');
  });
  
  test('should not render when no note is selected', () => {
    (useNotes as jest.Mock).mockReturnValue({
      ...defaultUseNotesMock,
      selectedNoteId: null,
    });
    
    const { container } = render(<ContextNoteEditor />);
    
    expect(container).toBeEmptyDOMElement();
  });
  
  test('should clean up previous note when switching notes', () => {
    const { rerender } = render(<ContextNoteEditor />);
    
    // Switch to note 2
    (useNotes as jest.Mock).mockReturnValue({
      ...defaultUseNotesMock,
      selectedNoteId: 2,
    });
    
    rerender(<ContextNoteEditor />);
    
    // Should clean up note 1 when switching to note 2
    expect(editHistoryService.cleanupTracking).toHaveBeenCalledWith(1);
    
    // Verify note 2 content is now shown
    expect(screen.getByTestId('note-title')).toHaveTextContent('Note 2');
    expect(screen.getByTestId('note-content')).toHaveTextContent('Content of note 2');
  });
  
  test('should clean up on unmount', () => {
    const { unmount } = render(<ContextNoteEditor />);
    
    unmount();
    
    // Should clean up when unmounted
    expect(editHistoryService.cleanupTracking).toHaveBeenCalledWith(1);
  });
  
  test('should call updateNote when content changes', () => {
    const updateNoteMock = jest.fn();
    (useNotes as jest.Mock).mockReturnValue({
      ...defaultUseNotesMock,
      updateNote: updateNoteMock,
    });
    
    const { rerender } = render(<ContextNoteEditor />);
    
    // Access the NoteEditor's onChange prop and call it
    const noteEditorProps = (require('@/components/editor/note-editor').default as jest.Mock).mock.calls[0][0];
    noteEditorProps.onChange('Updated content');
    
    expect(updateNoteMock).toHaveBeenCalledWith(1, 'Updated content');
  });
});
