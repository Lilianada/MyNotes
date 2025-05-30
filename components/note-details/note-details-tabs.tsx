"use client";

import React from 'react';
import { Hash, Link, Edit } from 'lucide-react';
import { TabType } from './note-details-hooks';

interface NoteDetailsTabsProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export function NoteDetailsTabs({ activeTab, setActiveTab }: NoteDetailsTabsProps) {
  const tabs = [
    { id: 'details' as const, label: 'Details', icon: null },
    { id: 'category' as const, label: 'Category', icon: null },
    { id: 'tags' as const, label: 'Tags', icon: Hash },
    { id: 'relationships' as const, label: 'Links', icon: Link },
    { id: 'metadata' as const, label: 'Meta', icon: Edit },
  ];

  return (
    <div className="flex border-b border-gray-200 dark:border-gray-700">
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === id
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          } ${Icon ? 'flex items-center' : ''}`}
          onClick={() => setActiveTab(id)}
        >
          {Icon && <Icon className="h-3 w-3 mr-1" />}
          {label}
        </button>
      ))}
    </div>
  );
}
