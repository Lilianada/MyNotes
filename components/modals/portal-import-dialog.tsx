"use client";

import React, { useState, useRef } from 'react';
import { FileUp, FileText, FilePlus, Loader2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { importFiles, ImportResult } from '@/lib/data-processing/import-utils';
import { useAppState } from '@/lib/state/app-state';
import { useAuth } from '@/contexts/auth-context';
import { createPortal } from 'react-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';

interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PortalImportDialog({ isOpen, onClose }: ImportDialogProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { addNote, updateNote, updateNoteData } = useAppState();
  const { user, isAdmin } = useAuth();

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(filesArray);
    }
  };

  // Handle drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Handle drop event
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      setSelectedFiles(filesArray);
    }
  };

  // Trigger file input click
  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  // Clear selected files
  const handleClearFiles = () => {
    setSelectedFiles([]);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Import the selected files
  const handleImport = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one file to import.",
        variant: "destructive"
      });
      return;
    }

    setIsImporting(true);
    setImportResult(null);

    try {
      const result = await importFiles(selectedFiles);
      setImportResult(result);

      if (result.success) {
        // Add imported notes to the app
        for (const note of result.notes) {
          try {
            // First create the note with just the title
            const createdNote = await addNote(note.noteTitle || 'Imported Note', user, isAdmin);
            
            // Then update the content
            await updateNote(createdNote.id, note.content || '', user, isAdmin);
            
            // Then update metadata if available
            if (note.description || note.category || note.tags) {
              const metadata: any = {};
              if (note.description) metadata.description = note.description;
              if (note.category) metadata.category = note.category;
              if (note.tags) metadata.tags = note.tags;
              
              await updateNoteData(createdNote.id, metadata, user, isAdmin);
            }
          } catch (error) {
            console.error('Error importing note:', error);
          }
        }

        toast({
          title: "Import successful",
          description: `Successfully imported ${result.notes.length} note${result.notes.length !== 1 ? 's' : ''}.`,
        });

        // Close dialog after successful import
        setTimeout(() => {
          onClose();
          handleClearFiles();
        }, 2000);
      } else {
        toast({
          title: "Import failed",
          description: "Failed to import files. See details in the dialog.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import error",
        description: `An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Notes</DialogTitle>
          <DialogDescription>
            Import notes from Markdown, text, PDF, or Word documents.
          </DialogDescription>
        </DialogHeader>
        
        <div className="p-4">
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center ${dragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-700'}`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center justify-center">
              <FileUp size={36} className="text-gray-400 mb-2" />
              <p className="text-sm font-medium mb-1">Drag and drop files here</p>
              <p className="text-xs text-gray-500 mb-4">or</p>
              <button
                type="button"
                onClick={handleButtonClick}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Select Files
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".md,.txt,.pdf,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
              />
              <p className="text-xs text-gray-500 mt-2">
                Supported formats: .md, .txt, .pdf, .doc, .docx
              </p>
            </div>
          </div>
          
          {selectedFiles.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">Selected Files ({selectedFiles.length})</h3>
                <button
                  type="button"
                  onClick={handleClearFiles}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  Clear All
                </button>
              </div>
              
              <div className="max-h-40 overflow-y-auto border rounded-md divide-y">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 text-sm">
                    <div className="flex items-center">
                      <FileText size={16} className="text-gray-400 mr-2" />
                      <span className="truncate max-w-[200px]">{file.name}</span>
                    </div>
                    <span className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {importResult && (
            <div className="mt-4">
              {importResult.warnings.length > 0 && (
                <div className="mb-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-md text-xs">
                  <p className="font-medium">Warnings:</p>
                  <ul className="list-disc ml-4 mt-1">
                    {importResult.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {importResult.errors.length > 0 && (
                <div className="mb-2 p-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md text-xs">
                  <p className="font-medium">Errors:</p>
                  <ul className="list-disc ml-4 mt-1">
                    {importResult.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {importResult.success && (
                <div className="mb-2 p-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-md text-xs">
                  <p>Successfully imported {importResult.notes.length} note{importResult.notes.length !== 1 ? 's' : ''}.</p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter className="flex justify-end mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 mr-2"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={isImporting || selectedFiles.length === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isImporting ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <FilePlus size={16} className="mr-2" />
                  Import
                </>
              )}
            </button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default PortalImportDialog;
