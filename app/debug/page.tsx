"use client";

import { useAuth } from '@/contexts/auth-context';
import { useNotes } from '@/contexts/notes/note-context';
import { useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';

export default function DebugPage() {
  const { user, isAdmin, loading } = useAuth();
  const { notes } = useNotes();
  const [debugOutput, setDebugOutput] = useState<string[]>([]);

  const addLog = (message: string) => {
    setDebugOutput(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const checkAdminStatus = async (email: string) => {
    try {
      addLog(`Checking admin status for: ${email}`);
      const adminRef = doc(db, 'admins', email);
      const adminDoc = await getDoc(adminRef);
      
      if (adminDoc.exists()) {
        addLog(`✅ Admin entry exists for ${email}`);
        addLog(`Admin data: ${JSON.stringify(adminDoc.data())}`);
      } else {
        addLog(`❌ No admin entry found for ${email}`);
      }
      
      return adminDoc.exists();
    } catch (error) {
      addLog(`❌ Error checking admin status: ${error}`);
      return false;
    }
  };

  const createAdminEntry = async (email: string) => {
    try {
      addLog(`Creating admin entry for: ${email}`);
      const adminRef = doc(db, 'admins', email);
      
      await setDoc(adminRef, {
        email: email,
        isAdmin: true,
        createdAt: new Date(),
        createdBy: 'debug-page'
      });
      
      addLog(`✅ Admin entry created for ${email}`);
      addLog(`Please refresh the page to see updated admin status`);
    } catch (error) {
      addLog(`❌ Error creating admin entry: ${error}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Debug Page</h1>
          <div className="p-4 bg-yellow-100 rounded">Auth loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold mb-4">Authentication & Notes Debug Page</h1>
        
        {/* Auth Status */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
          <div className="space-y-2">
            <div><strong>Signed In:</strong> {user ? '✅ Yes' : '❌ No'}</div>
            <div><strong>User Email:</strong> {user?.email || 'N/A'}</div>
            <div><strong>User ID:</strong> {user?.uid || 'N/A'}</div>
            <div><strong>Is Admin:</strong> {isAdmin ? '✅ Yes' : '❌ No'}</div>
            <div><strong>Auth Loading:</strong> {loading ? 'Yes' : 'No'}</div>
          </div>
        </div>

        {/* Notes Status */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Notes Status</h2>
          <div className="space-y-2">
            <div><strong>Notes Count:</strong> {notes.length}</div>
            <div><strong>Expected Collection:</strong> {isAdmin ? 'notes' : 'userNotes'}</div>
            <div><strong>User Context:</strong> {isAdmin ? 'Admin Context' : 'Regular Context'}</div>
          </div>
        </div>

        {/* Admin Management */}
        {user && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Admin Management</h2>
            
            <div className="space-y-4">
              <button
                onClick={() => user.email && checkAdminStatus(user.email)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Check My Admin Status
              </button>
              
              <button
                onClick={() => user.email && createAdminEntry(user.email)}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 ml-2"
              >
                Make Me Admin
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 ml-2"
              >
                Refresh Page
              </button>
            </div>
          </div>
        )}

        {/* Debug Log */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Debug Log</h2>
          <div className="max-h-64 overflow-y-auto bg-black text-green-400 p-4 rounded font-mono text-sm">
            {debugOutput.map((log, index) => (
              <div key={index}>{log}</div>
            ))}
            {debugOutput.length === 0 && (
              <div className="text-gray-500">No debug output yet...</div>
            )}
          </div>
          <button
            onClick={() => setDebugOutput([])}
            className="mt-2 px-3 py-1 bg-gray-500 text-white rounded text-sm"
          >
            Clear Log
          </button>
        </div>

        {/* Navigation */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Navigation</h2>
          <a 
            href="/"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Back to Main App
          </a>
        </div>
      </div>
    </div>
  );
}
