"use client";

import React from 'react';
import { Progress } from '@/components/ui/progress';
import { HardDrive } from 'lucide-react';
import { useStorage } from '@/contexts/storage-context';
import { formatBytes } from '@/lib/storage/storage-utils';

export function StorageProgress() {
  const { userStorage, storagePercentage, storageAlert } = useStorage();

  if (!userStorage) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <HardDrive className={`h-3 w-3 ${
        storageAlert?.type === 'error' ? 'text-red-500' :
        storageAlert?.type === 'warning' ? 'text-yellow-500' :
        'text-gray-500'
      }`} />
      <div className="flex items-center gap-1">
        <Progress 
          value={storagePercentage} 
          className={`w-16 h-1.5 ${
            storagePercentage >= 95 ? 'bg-red-100' : 
            storagePercentage >= 70 ? 'bg-yellow-100' : 
            'bg-green-100'
          }`}
        />
        <span className={`${
          storageAlert?.type === 'error' ? 'text-red-600' :
          storageAlert?.type === 'warning' ? 'text-yellow-600' :
          'text-gray-600'
        }`}>
          {formatBytes(userStorage.totalStorage)} / {formatBytes(userStorage.maxStorage)}
        </span>
      </div>
    </div>
  );
}
