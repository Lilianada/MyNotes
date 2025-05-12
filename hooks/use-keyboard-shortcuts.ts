"use client"

import { useEffect, useCallback } from 'react'

type KeyboardShortcutOptions = {
  onSave?: () => void
  onBold?: () => void
  onItalic?: () => void
  onNewNote?: () => void
  onToggleMenu?: () => void
  disabled?: boolean
}

/**
 * Custom hook to handle keyboard shortcuts for the note editor
 */
export function useKeyboardShortcuts({
  onSave,
  onBold,
  onItalic,
  onNewNote,
  onToggleMenu,
  disabled = false
}: KeyboardShortcutOptions) {
  
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (disabled) return
    
    // Check if Ctrl or Cmd key is pressed
    const modifierPressed = e.ctrlKey || e.metaKey
    
    if (modifierPressed) {
      switch (e.key.toLowerCase()) {
        case 's':
          // Ctrl/Cmd + S: Save
          if (onSave) {
            e.preventDefault()
            onSave()
          }
          break
          
        case 'b':
          // Ctrl/Cmd + B: Bold
          if (onBold) {
            e.preventDefault()
            onBold()
          }
          break
          
        case 'i':
          // Ctrl/Cmd + I: Italic
          if (onItalic) {
            e.preventDefault()
            onItalic()
          }
          break
          
        case 'n':
          // Ctrl/Cmd + N: New Note
          if (onNewNote) {
            e.preventDefault()
            onNewNote()
          }
          break
          
        case 'm':
          // Ctrl/Cmd + M: Toggle Menu
          if (onToggleMenu) {
            e.preventDefault()
            onToggleMenu()
          }
          break
      }
    }
  }, [disabled, onSave, onBold, onItalic, onNewNote, onToggleMenu])
  
  useEffect(() => {
    // Add event listener
    document.addEventListener('keydown', handleKeyDown)
    
    // Clean up
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])
}
