"use client";

import ContentRecovery from "@/components/utils/content-recovery";

export default function RecoveryPage() {
  return (
    <div className="container max-w-7xl mx-auto py-6 px-4">
      <h1 className="text-3xl font-bold mb-2">Content Recovery</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Recover lost note content from previous versions and backups.
      </p>
      
      <ContentRecovery />
      
      <div className="mt-12 p-4 bg-blue-50 dark:bg-blue-900 rounded-md">
        <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">🔧 Fix Applied for Undo Issue</h3>
        <p className="text-blue-700 dark:text-blue-300">
          We've fixed the issue where using the undo (Cmd+Z) command in one note was affecting another note's content. 
          You will no longer lose content when switching between notes and using undo. This fix isolates each note's 
          editing history, preventing cross-note undo operations.
        </p>
      </div>
      
      <div className="mt-6 p-4 bg-green-50 dark:bg-green-900 rounded-md">
        <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">✅ Enhanced Recovery System</h3>
        <p className="text-green-700 dark:text-green-300">
          We've improved the content recovery system to better find and restore note history. 
          The system now searches multiple storage locations for history entries, including direct note data 
          and browser storage. This provides a more robust way to recover lost content.
        </p>
      </div>
    </div>
  );
}
