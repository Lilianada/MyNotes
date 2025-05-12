"use client"

import { useState, useEffect } from 'react';
import { KeyboardEvent } from 'react';

interface NoteTitleEditorProps {
  noteTitle: string;
  noteId: number;
  onUpdateTitle: (newTitle: string) => void;
}

const NoteTitleEditor: React.FC<NoteTitleEditorProps> = ({ 
  noteTitle, 
  noteId, 
  onUpdateTitle 
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(noteTitle);

  useEffect(() => {
    // Update title input when note changes
    setTitleInput(noteTitle);
  }, [noteTitle]);

  const handleTitleChange = () => {
    if (titleInput.trim() !== "" && titleInput !== noteTitle) {
      onUpdateTitle(titleInput);
    } else {
      setTitleInput(noteTitle);
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTitleChange();
    } else if (e.key === 'Escape') {
      setTitleInput(noteTitle);
      setIsEditingTitle(false);
    }
  };

  return (
    <div className="flex-1">
      {isEditingTitle ? (
        <input
          type="text"
          value={titleInput}
          onChange={(e) => setTitleInput(e.target.value)}
          onBlur={handleTitleChange}
          onKeyDown={handleTitleKeyDown}
          className="w-full text-xs font-medium p-1 border border-gray-300 rounded"
          autoFocus
        />
      ) : (
        <div 
          onClick={() => setIsEditingTitle(true)}
          className="text-xs font-medium cursor-pointer hover:bg-gray-50 p-1 rounded"
          title="Click to edit title"
        >
          {noteTitle || `Note #${noteId}`}
        </div>
      )}
    </div>
  );
};

export default NoteTitleEditor;
