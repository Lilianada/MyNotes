import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useNotes } from '@/contexts/notes/note-context';
import { ContextNoteEditor } from '@/components/editor/context-note-editor';

// Mock dependencies
jest.mock('@/contexts/notes/note-context');
jest.mock('@/components/editor/note-editor', () => {
  return function MockNoteEditor({ note, onChange }) {
    return (
      <div data-testid="note-editor">
        <div data-testid="note-id">ID: {note.id}</div>
        <textarea
          data-testid="note-content-editor"
          value={note.content}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    );
  };
});

jest.mock('@/lib/edit-history/edit-history-service', () => ({
  editHistoryService: {
    initializeTracking: jest.fn(),
    cleanupTracking: jest.fn(),
    trackContentChange: jest.fn(),
  },
}));

describe('Note Switching Integration Test', () => {
  // Setup mock notes
  const mockNotes = [
    { id: 1, title: 'Note 1', content: 'Content of note 1' },
    { id: 2, title: 'Note 2', content: 'Content of note 2' },
  ];
  
  let updateNoteMock;
  
  beforeEach(() => {
    jest.clearAllMocks();
    updateNoteMock = jest.fn((id, content) => {
      // Update the mock note content when updateNote is called
      mockNotes.find(note => note.id === id).content = content;
    });
    
    // Mock initial state with note 1 selected
    (useNotes as jest.Mock).mockReturnValue({
      notes: [...mockNotes], // Clone to avoid test interference
      selectedNoteId: 1,
      updateNote: updateNoteMock,
      updateNoteTitle: jest.fn(),
    });
  });
  
  test('should preserve note content when switching between notes', async () => {
    const user = userEvent.setup();
    
    // Render with note 1 selected
    const { rerender } = render(<ContextNoteEditor />);
    
    // Change content of note 1
    const editor = screen.getByTestId('note-content-editor');
    await user.clear(editor);
    await user.type(editor, 'Updated content for note 1');
    
    // Switch to note 2
    (useNotes as jest.Mock).mockReturnValue({
      notes: mockNotes,
      selectedNoteId: 2,
      updateNote: updateNoteMock,
      updateNoteTitle: jest.fn(),
    });
    rerender(<ContextNoteEditor />);
    
    // Verify note 2 content is correct
    expect(screen.getByTestId('note-id')).toHaveTextContent('ID: 2');
    expect(screen.getByTestId('note-content-editor')).toHaveValue('Content of note 2');
    
    // Change content of note 2
    await user.clear(screen.getByTestId('note-content-editor'));
    await user.type(screen.getByTestId('note-content-editor'), 'Updated content for note 2');
    
    // Switch back to note 1
    (useNotes as jest.Mock).mockReturnValue({
      notes: mockNotes,
      selectedNoteId: 1,
      updateNote: updateNoteMock,
      updateNoteTitle: jest.fn(),
    });
    rerender(<ContextNoteEditor />);
    
    // Verify note 1 content is preserved
    expect(screen.getByTestId('note-id')).toHaveTextContent('ID: 1');
    expect(screen.getByTestId('note-content-editor')).toHaveValue('Updated content for note 1');
    
    // Switch back to note 2 again
    (useNotes as jest.Mock).mockReturnValue({
      notes: mockNotes,
      selectedNoteId: 2,
      updateNote: updateNoteMock,
      updateNoteTitle: jest.fn(),
    });
    rerender(<ContextNoteEditor />);
    
    // Verify note 2 content is still preserved
    expect(screen.getByTestId('note-id')).toHaveTextContent('ID: 2');
    expect(screen.getByTestId('note-content-editor')).toHaveValue('Updated content for note 2');
  });
});
