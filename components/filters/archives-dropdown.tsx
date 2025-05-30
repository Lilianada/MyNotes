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
  // TODO: Implement archive functionality
  // For now, this is just a placeholder UI component
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className={`flex items-center gap-2 ${selectedArchive !== null ? 'bg-blue-50 border-blue-200' : ''}`}
          disabled // Disabled until implementation is ready
        >
          <Archive size={14} />
          <span>Archives</span>
          {selectedArchive !== null && (
            <Badge variant="secondary" className="ml-1 px-1 py-0 text-xs">
              1
            </Badge>
          )}
          <ChevronDown size={12} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {selectedArchive !== null && (
          <>
            <DropdownMenuItem onClick={() => onSelectArchive(null)} className="text-blue-600">
              Clear filter
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem disabled>
          <div className="flex items-center justify-between w-full">
            <span>Active Notes</span>
            <Badge variant="outline" className="text-xs">
              -
            </Badge>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <div className="flex items-center justify-between w-full">
            <span>Archived Notes</span>
            <Badge variant="outline" className="text-xs">
              -
            </Badge>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled className="text-gray-500 text-xs">
          Archive functionality coming soon
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ArchivesDropdown;
