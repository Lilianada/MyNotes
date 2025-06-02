"use client";

import React, { useState } from 'react';
import { Note } from '@/types';
import { exportNote, exportAllNotes } from '@/lib/data-processing/export-utils';
import { FileDown, FileText, AlertCircle } from 'lucide-react';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentNote?: Note | null;
  allNotes: Note[];
}

type ExportFormat = 'markdown' | 'txt' | 'pdf';

interface FormatOption {
  id: ExportFormat;
  label: string;
  description: string;
  icon: React.ReactNode;
}

export function ExportDialog({ isOpen, onClose, currentNote, allNotes }: ExportDialogProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('markdown');
  const [exportType, setExportType] = useState<'current' | 'all'>(currentNote ? 'current' : 'all');
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const formatOptions: FormatOption[] = [
    {
      id: 'markdown',
      label: 'Markdown',
      description: 'Export as .md file with Markdown formatting, includes frontmatter',
      icon: <FileText size={18} />
    },
    {
      id: 'txt',
      label: 'Plain Text',
      description: 'Export as .txt file without formatting',
      icon: <FileText size={18} />
    },
    {
      id: 'pdf',
      label: 'PDF',
      description: 'Export as .pdf document',
      icon: <FileDown size={18} />
    }
  ];
  
  const handleExport = async () => {
    setIsExporting(true);
    setError(null);
    
    try {
      if (exportType === 'current' && currentNote) {
        // Pass all notes to enable proper relationship sections
        await exportNote(currentNote, selectedFormat, allNotes);
      } else {
        await exportAllNotes(allNotes, selectedFormat);
      }
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
      setError(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div
      className="h-screen fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]"
      onClick={onClose}
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Export Notes</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            &times;
          </button>
        </div>
        
        <div className="p-4">
          {currentNote && (
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-2">What to export</h3>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setExportType('current')}
                  className={`px-3 py-2 text-sm border rounded-md ${
                    exportType === 'current'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 text-gray-700'
                  }`}
                >
                  Current Note
                </button>
                <button
                  type="button"
                  onClick={() => setExportType('all')}
                  className={`px-3 py-2 text-sm border rounded-md ${
                    exportType === 'all'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 text-gray-700'
                  }`}
                >
                  All Notes ({allNotes.length})
                </button>
              </div>
            </div>
          )}
          
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-2">Export Format</h3>
            <div className="space-y-2">
              {formatOptions.map((format) => (
                <button
                  key={format.id}
                  type="button"
                  onClick={() => setSelectedFormat(format.id)}
                  className={`flex items-start w-full p-3 border rounded-md ${
                    selectedFormat === format.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5 text-gray-500">
                    {format.icon}
                  </div>
                  <div className="ml-3 text-left">
                    <div className="text-sm font-medium">{format.label}</div>
                    <div className="text-xs text-gray-500">{format.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          {selectedFormat === 'markdown' && (
            <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-md text-sm">
              <p className="font-medium mb-1">Markdown Export Format</p>
              <p>Your notes will be exported with YAML frontmatter containing:</p>
              <ul className="list-disc ml-5 mt-1">
                <li>Note metadata (ID, title, slug)</li>
                <li>Tags and category information</li>
                <li>Parent-child relationships</li>
                <li>Linked note references</li>
                <li>Timestamps (created/updated)</li>
              </ul>
            </div>
          )}
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md flex items-start">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5 mr-2" />
              <span className="text-sm">{error}</span>
            </div>
          )}
          
          <div className="flex justify-end mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 mr-2"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? 'Exporting...' : 'Export'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExportDialog;

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentNote?: Note | null;
  allNotes: Note[];
}
