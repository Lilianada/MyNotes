import React, { useEffect, KeyboardEvent } from 'react';

interface TitleModalProps {
  handleTitleSubmit: (e: React.FormEvent) => void;
  titleInputRef: React.RefObject<HTMLInputElement>;
  newNoteTitle: string;
  setNewNoteTitle: (value: string) => void;
  cancelTitleInput: () => void;
}

const TitleModal: React.FC<TitleModalProps> = ({
  handleTitleSubmit,
  titleInputRef,
  newNoteTitle,
  setNewNoteTitle,
  cancelTitleInput
}) => {
  // Handle escape key to cancel
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      cancelTitleInput();
    }
  };

  // Add escape key listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown as any);
    return () => {
      document.removeEventListener('keydown', handleKeyDown as any);
    };
  }, []);
  // Handle clicking outside to close
  const handleClickOutside = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      cancelTitleInput();
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]" onClick={handleClickOutside} style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0}}>
      <div className="bg-white p-4 rounded-lg shadow-lg w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-medium mb-3">Create New Note</h3>
        <form onSubmit={handleTitleSubmit}>
          <div className="mb-4">
            <label htmlFor="noteTitle" className="block text-sm font-medium text-gray-700 mb-1">
              Note Title
            </label>
            <input
              type="text"
              id="noteTitle"
              ref={titleInputRef}
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              placeholder="Enter a title for your note"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={cancelTitleInput}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              Create Note
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TitleModal;
