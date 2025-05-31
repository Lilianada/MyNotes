"use client";

import React from 'react';
import { Archive, ChevronDown } from 'lucide-react';
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
}

export const ArchivesDropdown: React.FC<ArchivesDropdownProps> = ({
  selectedArchive,
  onSelectArchive,
}) => {
  const getDisplayText = () => {
    if (selectedArchive === true) return 'Archived';
    if (selectedArchive === false) return 'Active';
    return 'All';
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className={`flex items-center gap-2 ${selectedArchive !== null ? 'bg-blue-50 border-blue-200' : ''}`}
        >
          <Archive size={14} />
          <span>{getDisplayText()}</span>
          {selectedArchive !== null && (
            <Badge variant="secondary" className="ml-1 px-1 py-0 text-xs">
              ●
            </Badge>
          )}
          <ChevronDown size={12} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {selectedArchive !== null && (
          <>
            <DropdownMenuItem onClick={() => onSelectArchive(null)} className="text-blue-600">
              Show All Notes
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem 
          onClick={() => onSelectArchive(false)}
          className={selectedArchive === false ? 'bg-blue-50' : ''}
        >
          <Archive size={14} className="mr-2" />
          Active Notes
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => onSelectArchive(true)}
          className={selectedArchive === true ? 'bg-blue-50' : ''}
        >
          <Archive size={14} className="mr-2" />
          Archived Notes
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ArchivesDropdown;
