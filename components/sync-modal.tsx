import React from "react";
import { Button } from "./ui/button";
import { AlertCircle, ArrowUpFromLine } from "lucide-react";

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSync: () => void;
  localNoteCount: number;
}

export function SyncModal({ isOpen, onClose, onSync, localNoteCount }: SyncModalProps) {
  if (!isOpen) return null;

  const handleClickOutside = (e: React.MouseEvent<HTMLDivElement>) => {
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]" 
      onClick={handleClickOutside}
      style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0}}
    >
      <div 
        className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start mb-4">
          <AlertCircle className="text-blue-500 mr-3 mt-0.5" size={24} />
          <div>
            <h2 className="text-xl font-semibold mb-2">Sync Notes to Cloud</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              You have {localNoteCount} {localNoteCount === 1 ? 'note' : 'notes'} stored locally. 
              Would you like to sync {localNoteCount === 1 ? 'it' : 'them'} to your account?
            </p>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3">
          <Button 
            variant="outline" 
            onClick={onClose}
          >
            Not Now
          </Button>
          <Button 
            variant="default"
            onClick={onSync}
            className="flex items-center"
          >
            <ArrowUpFromLine size={16} className="mr-1.5" />
            Sync to Cloud
          </Button>
        </div>
      </div>
    </div>
  );
}
