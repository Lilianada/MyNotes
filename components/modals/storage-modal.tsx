"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { RefreshCw, HardDrive, FileText, AlertTriangle } from 'lucide-react';
import { useStorage } from '@/contexts/storage-context';
import { formatBytes } from '@/lib/storage-utils';

interface StorageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StorageModal({ isOpen, onClose }: StorageModalProps) {
  const { userStorage, storagePercentage, storageAlert, isLoading, refreshStorage } = useStorage();

  if (!userStorage) {
    return null;
  }

  const handleRefresh = async () => {
    await refreshStorage();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Storage Usage
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Storage Alert */}
          {storageAlert && (
            <div className={`p-3 rounded-lg border ${
              storageAlert.type === 'error' 
                ? 'bg-red-50 border-red-200 text-red-800' 
                : 'bg-yellow-50 border-yellow-200 text-yellow-800'
            }`}>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">{storageAlert.message}</span>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Storage Used</span>
              <span>{storagePercentage.toFixed(1)}%</span>
            </div>
            <Progress 
              value={storagePercentage} 
              className={`h-3 ${
                storagePercentage >= 95 ? 'bg-red-100' : 
                storagePercentage >= 70 ? 'bg-yellow-100' : 
                'bg-green-100'
              }`}
            />
            <div className="flex justify-between text-xs text-gray-600">
              <span>{formatBytes(userStorage.totalStorage)}</span>
              <span>{formatBytes(userStorage.maxStorage)}</span>
            </div>
          </div>

          {/* Storage Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium">Notes</span>
              </div>
              <p className="text-lg font-semibold">{userStorage.noteCount}</p>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <HardDrive className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium">Used</span>
              </div>
              <p className="text-lg font-semibold">{formatBytes(userStorage.totalStorage)}</p>
            </div>
          </div>

          {/* Storage Tips */}
          {storagePercentage > 50 && (
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Storage Tips</h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Archive old notes to reduce active storage</li>
                <li>• Delete unnecessary notes and drafts</li>
                <li>• Consider removing large attachments</li>
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button 
              onClick={handleRefresh} 
              disabled={isLoading}
              variant="outline"
              className="flex-1"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
            <Button onClick={onClose} className="flex-1">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
