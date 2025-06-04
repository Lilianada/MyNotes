"use client";

import React from 'react';
import { Keyboard } from 'lucide-react';

interface ShortcutProps {
  keys: string[];
  description: string;
}

const Shortcut: React.FC<ShortcutProps> = ({ keys, description }) => {
  return (
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm">{description}</span>
      <div className="flex space-x-1">
        {keys.map((key, index) => (
          <React.Fragment key={index}>
            <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">
              {key}
            </kbd>
            {index < keys.length - 1 && <span className="self-center">+</span>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium flex items-center">
            <Keyboard className="w-5 h-5 mr-2" />
            Keyboard Shortcuts
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Basic Controls</h4>
            <Shortcut keys={["Ctrl/Cmd", "S"]} description="Save note" />
            <Shortcut keys={["Ctrl/Cmd", "/"]} description="Toggle comment" />
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Formatting</h4>
            <Shortcut keys={["Ctrl/Cmd", "B"]} description="Bold text" />
            <Shortcut keys={["Ctrl/Cmd", "I"]} description="Italic text" />
            <Shortcut keys={["Ctrl/Cmd", "K"]} description="Inline code" />
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Auto-completion</h4>
            <Shortcut keys={["("]} description="Auto-complete with )" />
            <Shortcut keys={["["]} description="Auto-complete with ]" />
            <Shortcut keys={["{"]} description="Auto-complete with }" />
            <Shortcut keys={["`"]} description="Auto-complete with `" />
            <Shortcut keys={["``", "`"]} description="Create code block with ```" />
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Navigation</h4>
            <Shortcut keys={["Alt", "←"]} description="Previous note" />
            <Shortcut keys={["Alt", "→"]} description="Next note" />
          </div>
        </div>
        
        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            type="button"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShortcutsModal;
