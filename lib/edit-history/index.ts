"use client";

import { Note, NoteEditHistory } from '@/types';

export interface EditHistoryConfig {
  autosaveInterval: number; // milliseconds (30-60 seconds)
  minChangeThreshold: number; // minimum characters changed
  minChangePercentage: number; // minimum percentage changed (0-100)
  maxVersions: number; // maximum versions to keep
  significantChangeThreshold: number; // threshold for significant changes
}

export const DEFAULT_EDIT_HISTORY_CONFIG: EditHistoryConfig = {
  autosaveInterval: 45000, // 45 seconds
  minChangeThreshold: 10, // at least 10 characters changed
  minChangePercentage: 5, // at least 5% change
  maxVersions: 20, // keep last 20 versions
  significantChangeThreshold: 50 // 50+ characters is significant
};

/**
 * Calculate the difference between two text strings
 */
export function calculateTextDifference(oldText: string, newText: string): {
  charactersChanged: number;
  changePercentage: number;
  isSignificant: boolean;
} {
  if (!oldText && !newText) {
    return { charactersChanged: 0, changePercentage: 0, isSignificant: false };
  }
  
  if (!oldText) {
    return { 
      charactersChanged: newText.length, 
      changePercentage: 100, 
      isSignificant: newText.length > DEFAULT_EDIT_HISTORY_CONFIG.significantChangeThreshold 
    };
  }
  
  if (!newText) {
    return { 
      charactersChanged: oldText.length, 
      changePercentage: 100, 
      isSignificant: oldText.length > DEFAULT_EDIT_HISTORY_CONFIG.significantChangeThreshold 
    };
  }

  // Simple character-based difference calculation
  const maxLength = Math.max(oldText.length, newText.length);
  const minLength = Math.min(oldText.length, newText.length);
  
  let differences = Math.abs(oldText.length - newText.length);
  
  // Count character differences in the common part
  for (let i = 0; i < minLength; i++) {
    if (oldText[i] !== newText[i]) {
      differences++;
    }
  }
  
  const changePercentage = maxLength > 0 ? (differences / maxLength) * 100 : 0;
  const isSignificant = differences >= DEFAULT_EDIT_HISTORY_CONFIG.significantChangeThreshold;
  
  return {
    charactersChanged: differences,
    changePercentage,
    isSignificant
  };
}

/**
 * Determine if a change should trigger a new history entry
 */
export function shouldCreateHistoryEntry(
  oldContent: string,
  newContent: string,
  config?: EditHistoryConfig
): boolean {
  const effectiveConfig = config || DEFAULT_EDIT_HISTORY_CONFIG;
  const diff = calculateTextDifference(oldContent, newContent);
  
  return (
    diff.charactersChanged >= effectiveConfig.minChangeThreshold ||
    diff.changePercentage >= effectiveConfig.minChangePercentage
  );
}

/**
 * Create a new edit history entry
 */
export function createHistoryEntry(
  oldContent: string,
  newContent: string,
  editType: NoteEditHistory['editType'] = 'update'
): NoteEditHistory {
  const diff = calculateTextDifference(oldContent, newContent);
  
  return {
    timestamp: new Date(),
    editType,
    contentSnapshot: diff.isSignificant ? newContent : undefined,
    contentLength: newContent.length,
    changePercentage: diff.changePercentage
  };
}

/**
 * Prune old history entries to keep only the most recent N versions
 */
export function pruneHistoryEntries(
  history: NoteEditHistory[],
  maxVersions?: number
): NoteEditHistory[] {
  const effectiveMaxVersions = maxVersions || DEFAULT_EDIT_HISTORY_CONFIG.maxVersions;
  if (history.length <= effectiveMaxVersions) {
    return history;
  }
  
  // Sort by timestamp (newest first) and take only the most recent entries
  return history
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, effectiveMaxVersions);
}

/**
 * Get the last content snapshot from history
 */
export function getLastContentSnapshot(history: NoteEditHistory[]): string | null {
  for (const entry of history) {
    if (entry.contentSnapshot) {
      return entry.contentSnapshot;
    }
  }
  return null;
}
