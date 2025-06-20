/**
 * Storage Monitor Component
 * Monitors storage usage and provides warnings/recovery options
 */

"use client";

import React, { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { dataProtectionService, getStorageUsage } from '@/lib/utils/data-protection';
import { AlertTriangle, HardDrive, RefreshCw, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';

interface StorageWarningLevel {
  level: 'warning' | 'critical';
}

interface CrashDetectionEvent {
  hasBackups: boolean;
}

export function StorageMonitor() {
  const [showStorageWarning, setShowStorageWarning] = useState(false);
  const [showCrashRecovery, setShowCrashRecovery] = useState(false);
  const [storageWarningLevel, setStorageWarningLevel] = useState<'warning' | 'critical'>('warning');
  const [storageUsage, setStorageUsage] = useState<{ used: number; available: number; percentage: number } | null>(null);
  const [availableBackups, setAvailableBackups] = useState<Array<{ key: string; timestamp: number; noteCount: number }>>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Listen for storage warnings
    const handleStorageWarning = (event: CustomEvent<StorageWarningLevel>) => {
      setStorageWarningLevel(event.detail.level);
      setShowStorageWarning(true);
      
      if (event.detail.level === 'critical') {
        toast({
          title: "Storage Critical",
          description: "Your storage is almost full. Some features may not work properly.",
          variant: "destructive",
          duration: 10000,
        });
      } else {
        toast({
          title: "Storage Warning",
          description: "Your storage is getting full. Consider backing up your data.",
          variant: "default",
          duration: 5000,
        });
      }
    };

    // Listen for crash detection
    const handleCrashDetection = (event: CustomEvent<CrashDetectionEvent>) => {
      if (event.detail.hasBackups) {
        setShowCrashRecovery(true);
        setAvailableBackups(dataProtectionService.getAvailableBackups());
        
        toast({
          title: "Potential Crash Detected",
          description: "We detected the app may have crashed. Would you like to recover your data?",
          variant: "default",
          duration: 15000,
        });
      }
    };

    // Add event listeners
    window.addEventListener('storage-warning', handleStorageWarning as EventListener);
    window.addEventListener('crash-detected', handleCrashDetection as EventListener);

    // Initial storage check
    updateStorageUsage();

    return () => {
      window.removeEventListener('storage-warning', handleStorageWarning as EventListener);
      window.removeEventListener('crash-detected', handleCrashDetection as EventListener);
    };
  }, [toast]);

  const updateStorageUsage = async () => {
    const usage = await getStorageUsage();
    setStorageUsage(usage);
  };

  const handleCreateBackup = async () => {
    const success = await dataProtectionService.createBackup();
    if (success) {
      toast({
        title: "Backup Created",
        description: "Your notes have been backed up successfully.",
        variant: "default",
      });
    } else {
      toast({
        title: "Backup Failed",
        description: "Failed to create backup. Please try again.",
        variant: "destructive",
      });
    }
    setShowStorageWarning(false);
  };

  const handleRestoreBackup = async (timestamp?: number) => {
    const success = await dataProtectionService.restoreFromBackup(timestamp);
    if (success) {
      toast({
        title: "Data Restored",
        description: "Your notes have been restored from backup.",
        variant: "default",
      });
      
      // Reload the page to refresh the app state
      window.location.reload();
    } else {
      toast({
        title: "Restore Failed",
        description: "Failed to restore from backup. Please try again.",
        variant: "destructive",
      });
    }
    setShowCrashRecovery(false);
  };

  const handleExportNotes = () => {
    try {
      const notes = localStorage.getItem('notes');
      if (notes) {
        const blob = new Blob([notes], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `notes-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Notes Exported",
          description: "Your notes have been exported successfully.",
          variant: "default",
        });
      }
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export notes. Please try again.",
        variant: "destructive",
      });
    }
    setShowStorageWarning(false);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <>
      {/* Storage Warning Dialog */}
      <Dialog open={showStorageWarning} onOpenChange={setShowStorageWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className={`h-5 w-5 ${storageWarningLevel === 'critical' ? 'text-red-500' : 'text-yellow-500'}`} />
              {storageWarningLevel === 'critical' ? 'Storage Critical' : 'Storage Warning'}
            </DialogTitle>
            <DialogDescription>
              {storageWarningLevel === 'critical' 
                ? 'Your browser storage is almost full. Some features may not work properly.'
                : 'Your browser storage is getting full. Consider backing up your data.'
              }
            </DialogDescription>
          </DialogHeader>

          {storageUsage && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4" />
                <span className="text-sm">Storage Usage</span>
              </div>
              <Progress value={storageUsage.percentage * 100} className="w-full" />
              <div className="text-xs text-gray-600 flex justify-between">
                <span>{formatBytes(storageUsage.used)} used</span>
                <span>{formatBytes(storageUsage.available)} total</span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={handleExportNotes}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export Notes
            </Button>
            <Button
              onClick={handleCreateBackup}
              className="flex items-center gap-2"
            >
              <HardDrive className="h-4 w-4" />
              Create Backup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Crash Recovery Dialog */}
      <Dialog open={showCrashRecovery} onOpenChange={setShowCrashRecovery}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-blue-500" />
              Crash Recovery
            </DialogTitle>
            <DialogDescription>
              We detected that the app may have crashed previously. Would you like to restore your notes from a backup?
            </DialogDescription>
          </DialogHeader>

          {availableBackups.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Available Backups:</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {availableBackups.slice(0, 5).map((backup, index) => (
                  <div
                    key={backup.key}
                    className="flex items-center justify-between p-2 border rounded-md hover:bg-gray-50"
                  >
                    <div>
                      <div className="text-sm font-medium">
                        {index === 0 ? 'Latest Backup' : `Backup ${index + 1}`}
                      </div>
                      <div className="text-xs text-gray-600">
                        {formatDate(backup.timestamp)} • {backup.noteCount} notes
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleRestoreBackup(backup.timestamp)}
                    >
                      Restore
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCrashRecovery(false)}
            >
              Continue Without Restoring
            </Button>
            <Button
              onClick={() => handleRestoreBackup()}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Restore Latest
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
