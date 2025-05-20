"use client";

import React, { useState } from 'react';

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

const EditorShortcuts: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
        title="View keyboard shortcuts"
        type="button"
      >
        Shortcuts
      </button>

      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Editor Keyboard Shortcuts</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Basic Controls</h4>
                <Shortcut keys={["Ctrl/Cmd", "S"]} description="Save note" />
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Formatting (Monaco Editor)</h4>
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
                <Shortcut keys={["Enter"]} description="Add newline with indentation between brackets" />
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Special Characters</h4>
                <Shortcut keys={["-", ">"]} description="Converted to → arrow" />
                <Shortcut keys={["-", "-"]} description="Converted to — em dash" />
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                type="button"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EditorShortcuts;
