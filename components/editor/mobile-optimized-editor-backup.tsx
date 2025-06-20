"use client";

import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import type { Note } from '@/types';
import { Button } from '@/components/ui/button';
import { Maximize2, Minimize2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export interface MobileOptimizedEditorProps {
  note: Note;
  onChange: (content: string) => void;
  onSave: () => void;
  onToggleFullscreen?: (isFullscreen: boolean) => void;
}

// Create a ref interface for external control
export interface MobileEditorRef {
  toggleFullscreen: () => void;
  isFullscreen: boolean;
}
import { Button } from '@/components/ui/button';
import { Maximize2, Minimize2, Save } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface MobileOptimizedEditorProps {
  note: Note;
  onChange: (content: string) => void;
  onSave: () => void;
}

export function MobileOptimizedEditor({ note, onChange, onSave }: MobileOptimizedEditorProps) {
  const [content, setContent] = useState(note.content || '');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const { toast } = useToast();

  // Update content when note changes
  useEffect(() => {
    if (note && note.content !== undefined) {
      setContent(note.content || '');
      setIsDirty(false);
    }
  }, [note, note?.id, note?.content]);

  // Handle content change
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    onChange(newContent);
    setIsDirty(true);
  };

  // Handle save
  const handleSave = () => {
    onSave();
    setIsDirty(false);
    toast({
      title: "Note saved",
      description: "Your changes have been saved successfully.",
      duration: 2000,
    });
  };

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900' : 'h-full'}`}>
      {/* Mobile editor toolbar */}
      <div className="flex-shrink-0 flex items-center justify-end p-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </Button>
      </div>
      
      {/* Mobile-optimized textarea */}
      <div className={`flex-1 overflow-hidden ${isFullscreen ? 'h-[calc(100vh-120px)]' : 'h-[calc(100vh-240px)] md:h-auto'}`}>
        <TextareaAutosize
          className="w-full h-full p-4 resize-none outline-none bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-base leading-relaxed border-0 focus:ring-0 overflow-auto"
          value={content}
          onChange={handleChange}
          placeholder="Start writing..."
          minRows={isFullscreen ? 25 : 15}
          maxRows={isFullscreen ? 100 : 50}
          spellCheck={true}
          autoCapitalize="sentences"
          autoComplete="on"
          autoCorrect="on"
          aria-label="Note content"
        />
      </div>
      
      {/* Character count */}
      <div className="p-2 text-xs text-gray-500 dark:text-gray-400 text-right border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        {content.length} characters
      </div>
    </div>
  );
}
