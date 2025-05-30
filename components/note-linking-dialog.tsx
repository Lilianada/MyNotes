"use client";

import React, { useState, useEffect } from 'react';
import { useNotes } from '@/contexts/notes/note-context';
import { Note } from '@/types';
import { 
  HigherDialog as Dialog, 
  HigherDialogContent as DialogContent, 
  HigherDialogHeader as DialogHeader, 
  HigherDialogTitle as DialogTitle,
  HigherDialogFooter as DialogFooter 
} from '@/components/ui/higher-dialog';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface NoteLinkingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentNoteId: number;
  mode: 'parent' | 'links';
  onSave: (selectedNotes: number[]) => void;
  initialSelectedIds?: number[];
}

const NoteLinkingDialog: React.FC<NoteLinkingDialogProps> = ({
  isOpen,
  onClose,
  currentNoteId,
  mode,
  onSave,
  initialSelectedIds = []
}) => {
  const { notes } = useNotes();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNoteIds, setSelectedNoteIds] = useState<number[]>(initialSelectedIds);
  
  // Reset selected notes when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedNoteIds(initialSelectedIds);
    }
  }, [isOpen, initialSelectedIds]);

  // Filter available notes - exclude current note
  const availableNotes = notes.filter(note => 
    note.id !== currentNoteId && 
    note.noteTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // For parent mode, only allow selecting a single note
  const handleNoteSelect = (noteId: number) => {
    if (mode === 'parent') {
      // Toggle selection for parent (can only select one)
      setSelectedNoteIds(selectedNoteIds.includes(noteId) ? [] : [noteId]);
    } else {
      // Toggle selection for links (can select multiple)
      setSelectedNoteIds(prev => 
        prev.includes(noteId)
          ? prev.filter(id => id !== noteId)
          : [...prev, noteId]
      );
    }
  };

  const handleSave = () => {
    onSave(selectedNoteIds);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={isOpen => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'parent' ? 'Select Parent Note' : 'Link to Other Notes'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="my-4">
          <div className="flex items-center border rounded-md px-3 py-2 mb-4">
            <Search className="h-4 w-4 mr-2 text-gray-500" />
            <Input
              className="border-0 p-0 focus-visible:ring-0 flex-1"
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <h3 className="text-sm font-medium mb-2">
            {mode === 'parent' 
              ? 'Select a parent note:' 
              : 'Select notes to link:'}
          </h3>
          
          <ScrollArea className="h-[300px] rounded border p-2">
            {availableNotes.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No notes found</p>
            ) : (
              <ul className="space-y-2">
                {availableNotes.map(note => (
                  <li 
                    key={note.id}
                    className={`
                      p-2 rounded cursor-pointer flex items-center justify-between
                      ${selectedNoteIds.includes(note.id) 
                        ? 'bg-blue-50 border border-blue-200' 
                        : 'hover:bg-gray-50 border border-transparent'}
                    `}
                    onClick={() => handleNoteSelect(note.id)}
                  >
                    <div className="flex-1">
                      <h4 className="font-medium">{note.noteTitle}</h4>
                      <p className="text-xs text-gray-500 truncate">
                        {note.content?.substring(0, 60)}...
                      </p>
                    </div>
                    {selectedNoteIds.includes(note.id) && (
                      <Badge variant="default" className="ml-2">Selected</Badge>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </ScrollArea>
        </div>
        
        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {mode === 'parent' ? 'Set Parent' : 'Link Notes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NoteLinkingDialog;
