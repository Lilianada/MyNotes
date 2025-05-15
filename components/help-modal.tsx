"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">NoteItDown Help</DialogTitle>
          <DialogDescription>
            Learn how to get the most out of NoteItDown
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basics" className="mt-2">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="basics">Basics</TabsTrigger>
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
              </ol>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-2">Navigation</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Use the sidebar to browse all your notes</li>
                <li>Click the search icon to find content across all notes</li>
                <li>Toggle sidebar visibility with the menu button on mobile</li>
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
                    <li>Inline code with backticks: `code`</li>
                    <li>Code blocks with triple backticks: ```language</li>
                    <li>Supported languages: javascript, typescript, python, css, html, json...</li>
                  </ul>
                </li>
                <li><strong>Links:</strong> [text](url)</li>
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
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <div>
              <h3 className="font-bold text-lg mb-2">Pro Tips</h3>
              <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-gray-700 text-sm">
                <p className="mb-2">💡 Type <code className="bg-rose-50 px-1.5 py-0.5 rounded font-mono text-xs text-rose-700 border-rose-100 border">-&gt;</code> to automatically convert to → arrow</p>
                <p className="mb-2">💡 Use Ctrl+S or Cmd+S to save notes</p>
                <p className="mb-2">💡 Your notes are saved in localStorage so do not clear site data to preserve them</p>
                <p className="mb-2">💡 Export your notes using the export button in the <code className="bg-rose-50 px-1.5 py-0.5 rounded font-mono text-xs text-rose-700 border-rose-100 border">...</code> menu</p>
                <p>💡 You can change the note's title by clicking the title on the editor to edit it</p>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-2">Firebase Integration (Optional)</h3>
              <p className="mb-2 text-sm">If you want to enable cloud storage:</p>
              <ol className="list-decimal pl-5 space-y-1 text-sm">
                <li>Fork the repository at github.com/mynotes</li>
                <li>Clone and install the app locally</li>
                <li>Create a Firebase project and enable Google authentication</li>
                <li>Add your email to the "admins" collection</li>
                <li>Add your Firebase keys to .env.local file</li>
                <li>Run the app and sign in with Google</li>
              </ol>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="pt-4">
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
