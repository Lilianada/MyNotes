"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  // If the modal isn't open, don't render anything
  if (!isOpen) return null;
  
  // Handle clicking outside to close
  const handleClickOutside = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]" onClick={handleClickOutside} style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0}}>
      <div className="bg-white p-4 rounded-lg shadow-lg w-full max-w-[600px] max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="mb-4">
          <h2 className="text-xl font-bold">NoteItDown Help</h2>
          <p className="text-sm text-gray-500 mt-1">
            Learn how to get the most out of NoteItDown
          </p>
        </div>

        <Tabs defaultValue="basics" className="mt-2">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="basics">Basics</TabsTrigger>
            <TabsTrigger value="organization">Organization</TabsTrigger>
            <TabsTrigger value="markdown">Markdown</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="basics" className="space-y-4">
            <div>
              <h3 className="font-bold text-lg mb-2">Getting Started in 30 Seconds</h3>
              <ol className="list-decimal pl-5 space-y-2 text-sm">
                <li><strong>Create</strong> a new note with the "+" button in the sidebar</li>
                <li><strong>Write</strong> using intuitive Markdown formatting</li>
                <li><strong>Toggle</strong> between edit and preview modes with the "View" button</li>
                <li><strong>Find</strong> notes instantly with the search feature</li>
                <li><strong>Organize</strong> with categories and tags for better note management</li>
              </ol>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-2">Navigation</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Use the sidebar to browse all your notes</li>
                <li>Click the search icon to find content across all notes</li>
                <li>Toggle sidebar visibility with the menu button on mobile</li>
                <li>Access note details by clicking the info icon (ⓘ) next to any note</li>
                <li>Use filters to view notes by category, tags, or archive status</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-2">Editor Features</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li><strong>Auto-save:</strong> Your changes are saved automatically every 45 seconds</li>
                <li><strong>Monaco Editor:</strong> Enjoy VS Code-like editing with syntax highlighting and IntelliSense</li>
                <li><strong>Split View:</strong> Toggle between edit mode, preview mode, and split view</li>
                <li><strong>Font Options:</strong> Switch between Sans and Mono fonts in settings (applies to all editors)</li>
                <li><strong>Title Editing:</strong> Click the note title to edit it directly</li>
                <li><strong>Keyboard Shortcuts:</strong> Use Ctrl/Cmd+S to manually save, and standard text editing shortcuts</li>
                <li><strong>Word Count:</strong> Real-time word count displayed in the editor</li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="organization" className="space-y-4">
            <div>
              <h3 className="font-bold text-lg mb-2">Categories & Tags</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <h4 className="font-semibold text-base mb-1">Categories</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Assign one category per note for high-level organization</li>
                    <li>Create categories with custom colors for visual organization</li>
                    <li>Access category management in note details (ⓘ icon)</li>
                    <li>Filter notes by category using the dropdown in the sidebar</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-base mb-1">Tags</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Add multiple tags per note for detailed classification</li>
                    <li>Maximum of 5 tags per note</li>
                    <li>Manage tags in the note details modal</li>
                    <li>Filter notes by tags using the tags dropdown</li>
                    <li>Previously used tags will appear as suggestions</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-2">Note Management</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li><strong>Note Details:</strong> Click the ⓘ icon to access comprehensive note information</li>
                <li><strong>Metadata:</strong> Add descriptions, publish status, and other metadata</li>
                <li><strong>Archive:</strong> Archive notes to keep them but hide from main view</li>
                <li><strong>Relationships:</strong> View and manage connections between notes</li>
                <li><strong>Edit History:</strong> Track changes with automatic version history</li>
                <li><strong>Search:</strong> Find notes by title, content, tags, or categories</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-2">Filtering & Search</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Use the filter bar to narrow down notes by category, tags, or archive status</li>
                <li>Combine multiple filters for precise note finding</li>
                <li>Clear filters individually or all at once</li>
                <li>Search works across note titles, content, and metadata</li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="markdown" className="space-y-4">
            <div>
              <h3 className="font-bold text-lg mb-2">Markdown Basics</h3>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li><strong>Headers:</strong> Use # for headers (# H1, ## H2, ### H3)</li>
                <li><strong>Formatting:</strong> **bold**, *italic*, ~~strikethrough~~</li>
                <li>
                  <strong>Lists:</strong>
                  <ul className="list-disc pl-5 mt-1">
                    <li>Bullet points like this one</li>
                    <li>Numbered lists (1. 2. 3.)</li>
                  </ul>
                </li>
                <li>
                  <strong>Code:</strong>
                  <ul className="list-disc pl-5 mt-1">
                    <li>Inline code with backticks: \`code\`</li>
                    <li>Code blocks with triple backticks: \`\`\`language</li>
                    <li>Supported languages: javascript, typescript, python, css, html, json...</li>
                  </ul>
                </li>
                <li><strong>Links:</strong> [text](url)</li>
                <li><strong>Internal Links:</strong> [[Note Title]] or [[Note Title|Display Text]]</li>
                <li>
                  <strong>Tasks:</strong>
                  <ul className="pl-5 mt-1">
                    <li className="flex items-center gap-2">
                      <input type="checkbox" disabled className="mt-1" /> Unchecked task (- [ ] text)
                    </li>
                    <li className="flex items-center gap-2">
                      <input type="checkbox" checked disabled className="mt-1" /> Checked task (- [x] text)
                    </li>
                  </ul>
                </li>
                <li><strong>Blockquotes:</strong> Start a line with &gt; for quotes</li>
                <li><strong>Tables:</strong> Use pipes to create tables (| Header 1 | Header 2 |)</li>
                <li><strong>Horizontal Rules:</strong> Use --- or *** for horizontal lines</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-2">Frontmatter Support</h3>
              <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-sm">
                <p className="mb-2">Add metadata to your notes using YAML frontmatter:</p>
                <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
{`---
title: "My Note Title"
description: "Note description"
publish: true
tags: ["tag1", "tag2"]
category: "Category Name"
---

Your note content goes here...`}
                </pre>
                <p className="mt-2 text-gray-600">Frontmatter is properly parsed and won't appear as headers in preview mode.</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <div>
              <h3 className="font-bold text-lg mb-2">Pro Tips</h3>
              <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-gray-700 text-sm">
                <p className="mb-2">💡 Type <code className="bg-rose-50 px-1.5 py-0.5 rounded font-mono text-xs text-rose-700 border-rose-100 border">-&gt;</code> to automatically convert to → arrow</p>
                <p className="mb-2">💡 Use <code className="bg-rose-50 px-1.5 py-0.5 rounded font-mono text-xs text-rose-700 border-rose-100 border">[[Note Title]]</code> to create links between your notes</p>
                <p className="mb-2">💡 Use Ctrl+S or Cmd+S to save notes manually (auto-save works every 45 seconds)</p>
                <p className="mb-2">💡 Your notes are saved in localStorage for offline access</p>
                <p className="mb-2">💡 Export your notes using the export button in the <code className="bg-rose-50 px-1.5 py-0.5 rounded font-mono text-xs text-rose-700 border-rose-100 border">...</code> menu</p>
                <p>💡 Click the note title in the editor to edit it directly</p>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-2">Edit History & Auto-save</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Intelligent Auto-save:</strong> Notes are automatically saved every 45 seconds when changes are detected</p>
                <p><strong>Change Detection:</strong> History entries are only created for significant changes (100+ characters or 20%+ content change)</p>
                <p><strong>Version Limit:</strong> Each note keeps the last 10 versions to prevent storage bloat</p>
                <p><strong>Access History:</strong> View edit history in the note details modal</p>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-2">Storage & Export</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Local Storage:</strong> Notes are stored locally in your browser</p>
                <p><strong>Export Formats:</strong> Export individual notes or all notes as Markdown, TXT, or PDF</p>
                <p><strong>Import/Export:</strong> Preserve metadata, relationships, and frontmatter during export</p>
                <p><strong>File Size Tracking:</strong> Each note's file size is calculated and displayed in note details</p>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-2">Firebase Integration (Optional)</h3>
              <p className="mb-2 text-sm">For cloud storage and sync across devices:</p>
              <ol className="list-decimal pl-5 space-y-1 text-sm">
                <li>Fork the repository from the project source</li>
                <li>Clone and install the app locally</li>
                <li>Create a Firebase project and enable Google authentication</li>
                <li>Add your email to the "admins" collection for admin privileges</li>
                <li>Add your Firebase configuration keys to .env.local file</li>
                <li>Run the app and sign in with Google to sync notes</li>
              </ol>
              <div className="mt-2 p-2 bg-blue-50 text-blue-700 rounded text-xs">
                <strong>Note:</strong> Non-admin users get 10MB storage limit with usage tracking and warnings at 7MB+
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-3 mt-4">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}
