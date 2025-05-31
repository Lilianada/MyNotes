// Debug component to test admin functionality
"use client";

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';

export default function AdminDebugPanel() {
  const { user, isAdmin, loading } = useAuth();
  const [testEmail, setTestEmail] = useState('');
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
        createdBy: user?.email || 'system'
      });
      
      addLog(`✅ Admin entry created for ${email}`);
    } catch (error) {
      addLog(`❌ Error creating admin entry: ${error}`);
    }
  };

  const removeAdminEntry = async (email: string) => {
    try {
      addLog(`Removing admin entry for: ${email}`);
      const adminRef = doc(db, 'admins', email);
      await deleteDoc(adminRef);
      addLog(`✅ Admin entry removed for ${email}`);
    } catch (error) {
      addLog(`❌ Error removing admin entry: ${error}`);
    }
  };

  if (loading) {
    return <div className="p-4 bg-yellow-100 rounded">Auth loading...</div>;
  }

  return (
    <div className="p-4 bg-gray-100 rounded-lg space-y-4 max-w-2xl">
      <h3 className="text-lg font-bold">Admin Debug Panel</h3>
      
      <div className="space-y-2">
        <div><strong>Current User:</strong> {user?.email || 'Not logged in'}</div>
        <div><strong>User ID:</strong> {user?.uid || 'N/A'}</div>
        <div><strong>Is Admin:</strong> {isAdmin ? '✅ Yes' : '❌ No'}</div>
        <div><strong>Auth Loading:</strong> {loading ? 'Yes' : 'No'}</div>
      </div>

      <div className="space-y-2">
        <input
          type="email"
          placeholder="Email to test admin status"
          value={testEmail}
          onChange={(e) => setTestEmail(e.target.value)}
          className="w-full p-2 border rounded"
        />
        
        <div className="space-x-2">
          <button
            onClick={() => checkAdminStatus(testEmail)}
            disabled={!testEmail}
            className="px-3 py-1 bg-blue-500 text-white rounded disabled:bg-gray-300"
          >
            Check Admin Status
          </button>
          
          <button
            onClick={() => createAdminEntry(testEmail)}
            disabled={!testEmail}
            className="px-3 py-1 bg-green-500 text-white rounded disabled:bg-gray-300"
          >
            Create Admin Entry
          </button>
          
          <button
            onClick={() => removeAdminEntry(testEmail)}
            disabled={!testEmail}
            className="px-3 py-1 bg-red-500 text-white rounded disabled:bg-gray-300"
          >
            Remove Admin Entry
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <button
          onClick={() => user?.email && checkAdminStatus(user.email)}
          disabled={!user?.email}
          className="px-3 py-1 bg-purple-500 text-white rounded disabled:bg-gray-300"
        >
          Check My Admin Status
        </button>
        
        <button
          onClick={() => user?.email && createAdminEntry(user.email)}
          disabled={!user?.email}
          className="px-3 py-1 bg-purple-500 text-white rounded disabled:bg-gray-300"
        >
          Make Me Admin
        </button>
      </div>

      <div className="max-h-64 overflow-y-auto bg-black text-green-400 p-2 rounded font-mono text-sm">
        <div className="font-bold mb-2">Debug Log:</div>
        {debugOutput.map((log, index) => (
          <div key={index}>{log}</div>
        ))}
        {debugOutput.length === 0 && <div className="text-gray-500">No debug output yet...</div>}
      </div>

      <button
        onClick={() => setDebugOutput([])}
        className="px-3 py-1 bg-gray-500 text-white rounded"
      >
        Clear Log
      </button>
    </div>
  );
}
