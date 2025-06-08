"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { RefreshCw, HardDrive, FileText, AlertTriangle, Users, Database, User, Cloud, Laptop } from 'lucide-react';
import { useStorage } from '@/contexts/storage-context';
import { formatBytes } from '@/lib/storage/storage-utils';
import { useAuth } from '@/contexts/auth-context';

interface StorageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StorageModal({ isOpen, onClose }: StorageModalProps) {
  const { userStorage, storagePercentage, storageAlert, isLoading, refreshStorage, 
          adminStats, loadAdminStorageStats } = useStorage();
  const { isAdmin, user } = useAuth();
  
  // State for local and Firebase note counts
  const [localNoteCount, setLocalNoteCount] = useState(0);
  const [firebaseNoteCount, setFirebaseNoteCount] = useState(0);
  
  // Calculate local and Firebase note counts
  useEffect(() => {
    if (isOpen) {
      // Get local notes count
      const notesString = localStorage.getItem('notes');
      let localCount = 0;
      if (notesString) {
        try {
          const localNotes = JSON.parse(notesString);
          localCount = localNotes.length;
          setLocalNoteCount(localCount);
        } catch (e) {
          console.error('Error parsing notes from localStorage:', e);
        }
      } else {
        setLocalNoteCount(0);
      }
      
      // Calculate Firebase notes (total - local)
      if (userStorage) {
        setFirebaseNoteCount(Math.max(0, userStorage.noteCount - localCount));
      } else {
        setFirebaseNoteCount(0);
      }
    }
  }, [isOpen, userStorage]);

  if (!userStorage) {
    return null;
  }

  const handleRefresh = async () => {
    if (isAdmin) {
      await loadAdminStorageStats();
    }
    await refreshStorage();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${isAdmin ? 'sm:max-w-2xl' : 'sm:max-w-md'}`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            {isAdmin ? "Admin Storage Dashboard" : "Storage Usage"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Storage Alert - Only shown for non-admin users */}
          {!isAdmin && storageAlert && (
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

          {/* Admin Storage Statistics */}
          {isAdmin && adminStats && (
            <div className="space-y-6">
              {/* Admin Storage Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Database className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium">Admin Storage</span>
                  </div>
                  <p className="text-lg font-semibold">{formatBytes(adminStats.adminStorage)}</p>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium">User Storage</span>
                  </div>
                  <p className="text-lg font-semibold">
                    {formatBytes(adminStats.totalStorage - adminStats.adminStorage)}
                  </p>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <HardDrive className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium">Total Storage</span>
                  </div>
                  <p className="text-lg font-semibold">{formatBytes(adminStats.totalStorage)}</p>
                </div>
              </div>
              
              {/* User Storage List */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-100 p-2">
                  <h3 className="text-sm font-medium">User Storage Consumption</h3>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-700">
                      <tr>
                        <th className="py-2 px-4 text-left">User</th>
                        <th className="py-2 px-4 text-right">Storage Used</th>
                        <th className="py-2 px-4 text-right">Notes Count</th>
                        <th className="py-2 px-4 text-right">Usage %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {adminStats.userStorageList.map((user) => (
                        <tr key={user.userId} className={user.isAdmin ? "bg-blue-50" : ""}>
                          <td className="py-2 px-4 text-left">
                            <div className="flex items-center">
                              <User className="h-3 w-3 mr-2 text-gray-500" />
                              <span>{user.displayName || user.userId.substring(0, 8) + '...'}</span>
                              {user.isAdmin && <span className="ml-2 text-xs bg-blue-100 px-1 rounded">Admin</span>}
                            </div>
                          </td>
                          <td className="py-2 px-4 text-right">{formatBytes(user.totalStorage)}</td>
                          <td className="py-2 px-4 text-right">{user.noteCount}</td>
                          <td className="py-2 px-4 text-right">
                            {((user.totalStorage / user.maxStorage) * 100).toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Regular User Storage Display */}
          {(!isAdmin || !adminStats) && (
            <>
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
                    <span className="text-sm font-medium">Total Notes</span>
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
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Laptop className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium">Local Notes</span>
                  </div>
                  <p className="text-lg font-semibold">{localNoteCount}</p>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Cloud className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium">Cloud Notes</span>
                  </div>
                  <p className="text-lg font-semibold">{user ? firebaseNoteCount : 'N/A'}</p>
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
            </>
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
