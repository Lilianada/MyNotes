"use client";

import React from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface PublishedDropdownProps {
  selectedPublished: boolean | null;
  onSelectPublished: (isPublished: boolean | null) => void;
}

export const PublishedDropdown: React.FC<PublishedDropdownProps> = ({
  selectedPublished,
  onSelectPublished,
}) => {
  const getDisplayText = () => {
    if (selectedPublished === true) return 'Published';
    if (selectedPublished === false) return 'Unpublished';
    return 'All';
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className={`flex items-center gap-2 ${selectedPublished !== null ? 'bg-blue-50 border-blue-200' : ''}`}
        >
          <Globe size={14} />
          <span>{getDisplayText()}</span>
          {selectedPublished !== null && (
            <Badge variant="secondary" className="ml-1 px-1 py-0 text-xs">
              ●
            </Badge>
          )}
          <ChevronDown size={12} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {selectedPublished !== null && (
          <>
            <DropdownMenuItem onClick={() => onSelectPublished(null)} className="text-blue-600">
              Show All Notes
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem 
          onClick={() => onSelectPublished(true)}
          className={selectedPublished === true ? 'bg-blue-50' : ''}
        >
          <Globe size={14} className="mr-2" />
          Published Notes
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => onSelectPublished(false)}
          className={selectedPublished === false ? 'bg-blue-50' : ''}
        >
          <Globe size={14} className="mr-2 text-gray-400" />
          Unpublished Notes
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default PublishedDropdown;
