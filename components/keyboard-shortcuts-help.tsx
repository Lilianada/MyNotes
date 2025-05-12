"use client"

import React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export function KeyboardShortcutsHelp() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-xs text-gray-400 hover:text-gray-600">
          Keyboard Shortcuts
        </Button>
      </DialogTrigger>
      <DialogContent className="font-mono">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Use these keyboard shortcuts to improve your workflow
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 items-center gap-4">
            <div className="text-sm font-medium">Ctrl/Cmd + S</div>
            <div className="text-sm text-gray-500">Save note</div>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <div className="text-sm font-medium">Ctrl/Cmd + B</div>
            <div className="text-sm text-gray-500">Bold text</div>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <div className="text-sm font-medium">Ctrl/Cmd + I</div>
            <div className="text-sm text-gray-500">Italic text</div>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <div className="text-sm font-medium">Ctrl/Cmd + N</div>
            <div className="text-sm text-gray-500">New note</div>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <div className="text-sm font-medium">Ctrl/Cmd + M</div>
            <div className="text-sm text-gray-500">Toggle menu</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default KeyboardShortcutsHelp
