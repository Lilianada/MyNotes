"use client";

import React, { useState } from 'react';
import { useNotes } from '@/contexts/notes/note-context';
import { Note } from '@/types';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusIcon, Link, Unlink, FolderTree } from 'lucide-react';
import NoteLinkingDialog from './note-linking-dialog';

interface NoteRelationshipsProps {
  note: Note;
}

const NoteRelationships: React.FC<NoteRelationshipsProps> = ({ note }) => {
  const { 
    notes, 
    selectNote, 
    updateNoteParent, 
    updateNoteLinks, 
    getChildNotes, 
    getLinkedNotes 
  } = useNotes();
  
  const [isParentDialogOpen, setIsParentDialogOpen] = useState(false);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  
  // Get parent note if it exists
  const parentNote = note.parentId 
    ? notes.find(n => n.id === note.parentId) 
    : null;
  
  // Get child notes
  const childNotes = getChildNotes(note.id);
  
  // Get linked notes
  const linkedNotes = getLinkedNotes(note.id);
  
  // Handle setting parent note
  const handleSetParent = async (selectedIds: number[]) => {
    const parentId = selectedIds.length > 0 ? selectedIds[0] : null;
    await updateNoteParent(note.id, parentId);
  };
  
  // Handle setting linked notes
  const handleSetLinks = async (selectedIds: number[]) => {
    await updateNoteLinks(note.id, selectedIds);
  };
  
  // Remove parent relationship
  const handleRemoveParent = async () => {
    await updateNoteParent(note.id, null);
  };
  
  // Helper to navigate to a note
  const navigateToNote = (noteId: number) => {
    selectNote(noteId);
  };

  return (
    <div className="space-y-6 my-4">
      {/* Parent Note Section */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center">
            <FolderTree className="h-4 w-4 mr-2" />
            Parent Note
          </CardTitle>
        </CardHeader>
        <CardContent>
          {parentNote ? (
            <div className="flex items-center justify-between">
              <div 
                className="flex-1 p-2 hover:bg-gray-50 rounded cursor-pointer"
                onClick={() => navigateToNote(parentNote.id)}
              >
                <h4 className="font-medium">{parentNote.noteTitle}</h4>
                <p className="text-xs text-gray-500 truncate">
                  {parentNote.content?.substring(0, 40)}...
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleRemoveParent}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Unlink className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <p className="text-gray-500 text-sm py-2">No parent note selected</p>
          )}
        </CardContent>
        <CardFooter className="pt-0">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsParentDialogOpen(true)}
            className="w-full"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            {parentNote ? 'Change Parent' : 'Set Parent'}
          </Button>
        </CardFooter>
      </Card>
      
      {/* Child Notes Section */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Child Notes</CardTitle>
          <CardDescription>
            Notes that have this note as their parent
          </CardDescription>
        </CardHeader>
        <CardContent>
          {childNotes.length > 0 ? (
            <ul className="space-y-2">
              {childNotes.map(childNote => (
                <li 
                  key={childNote.id}
                  className="p-2 hover:bg-gray-50 rounded cursor-pointer"
                  onClick={() => navigateToNote(childNote.id)}
                >
                  <h4 className="font-medium">{childNote.noteTitle}</h4>
                  <p className="text-xs text-gray-500 truncate">
                    {childNote.content?.substring(0, 40)}...
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm py-2">No child notes</p>
          )}
        </CardContent>
      </Card>
      
      {/* Linked Notes Section */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center">
            <Link className="h-4 w-4 mr-2" />
            Linked Notes
          </CardTitle>
          <CardDescription>
            Notes that are connected to this note
          </CardDescription>
        </CardHeader>
        <CardContent>
          {linkedNotes.length > 0 ? (
            <ul className="space-y-2">
              {linkedNotes.map(linkedNote => (
                <li 
                  key={linkedNote.id}
                  className="p-2 hover:bg-gray-50 rounded cursor-pointer flex justify-between items-center"
                  onClick={() => navigateToNote(linkedNote.id)}
                >
                  <div>
                    <h4 className="font-medium">{linkedNote.noteTitle}</h4>
                    <p className="text-xs text-gray-500 truncate">
                      {linkedNote.content?.substring(0, 40)}...
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm py-2">No linked notes</p>
          )}
        </CardContent>
        <CardFooter className="pt-0">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsLinkDialogOpen(true)}
            className="w-full"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Manage Links
          </Button>
        </CardFooter>
      </Card>
      
      {/* Dialogs */}
      <NoteLinkingDialog
        isOpen={isParentDialogOpen}
        onClose={() => setIsParentDialogOpen(false)}
        currentNoteId={note.id}
        mode="parent"
        onSave={handleSetParent}
        initialSelectedIds={note.parentId ? [note.parentId] : []}
      />
      
      <NoteLinkingDialog
        isOpen={isLinkDialogOpen}
        onClose={() => setIsLinkDialogOpen(false)}
        currentNoteId={note.id}
        mode="links"
        onSave={handleSetLinks}
        initialSelectedIds={note.linkedNoteIds || []}
      />
    </div>
  );
};

export default NoteRelationships;
