"use client";

import React from 'react';
import { Archive, ChevronDown, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface ArchivesDropdownProps {
  selectedArchive: boolean | null;
  onSelectArchive: (isArchived: boolean | null) => void;
  selectedPublished: boolean | null;
  onSelectPublished: (isPublished: boolean | null) => void;
}

export const ArchivesDropdown: React.FC<ArchivesDropdownProps> = ({
  selectedArchive,
  onSelectArchive,
  selectedPublished,
  onSelectPublished,
}) => {
  const getDisplayText = () => {
    if (selectedArchive === true) return 'Archived';
    if (selectedArchive === false) return 'Active';
    if (selectedPublished === true) return 'Published';
    if (selectedPublished === false) return 'Unpublished';
    return 'All';
  };
  
  const hasActiveFilter = selectedArchive !== null || selectedPublished !== null;
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className={`flex items-center gap-2 ${hasActiveFilter ? 'bg-blue-50 border-blue-200' : ''}`}
        >
          {selectedPublished !== null ? <Globe size={14} /> : <Archive size={14} />}
          <span>{getDisplayText()}</span>
          {hasActiveFilter && (
            <Badge variant="secondary" className="ml-1 px-1 py-0 text-xs">
              ●
            </Badge>
          )}
          <ChevronDown size={12} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {hasActiveFilter && (
          <>
            <DropdownMenuItem 
              onClick={() => {
                onSelectArchive(null);
                onSelectPublished(null);
              }} 
              className="text-blue-600"
            >
              Show All Notes
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        
        {/* Archive Status Section */}
        <div className="px-2 py-1 text-xs font-medium text-gray-500">Archive Status</div>
        <DropdownMenuItem 
          onClick={() => {
            onSelectArchive(false);
            onSelectPublished(null);
          }}
          className={selectedArchive === false && selectedPublished === null ? 'bg-blue-50' : ''}
        >
          <Archive size={14} className="mr-2" />
          Active Notes
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => {
            onSelectArchive(true);
            onSelectPublished(null);
          }}
          className={selectedArchive === true && selectedPublished === null ? 'bg-blue-50' : ''}
        >
          <Archive size={14} className="mr-2" />
          Archived Notes
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* Published Status Section */}
        <div className="px-2 py-1 text-xs font-medium text-gray-500">Published Status</div>
        <DropdownMenuItem 
          onClick={() => {
            onSelectPublished(true);
            onSelectArchive(null);
          }}
          className={selectedPublished === true && selectedArchive === null ? 'bg-blue-50' : ''}
        >
          <Globe size={14} className="mr-2" />
          Published Notes
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => {
            onSelectPublished(false);
            onSelectArchive(null);
          }}
          className={selectedPublished === false && selectedArchive === null ? 'bg-blue-50' : ''}
        >
          <Globe size={14} className="mr-2 text-gray-400" />
          Unpublished Notes
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ArchivesDropdown;
