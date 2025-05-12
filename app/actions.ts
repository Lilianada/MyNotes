// This is the updated actions.ts file that would handle saving files with .md extension

"use server"

import { existsSync, mkdirSync, writeFileSync } from "fs"
import { resolve } from "path"

// Helper to sanitize file names
const sanitizeFileName = (name: string): string => {
  return name.replace(/[/\\?%*:|"<>]/g, '-').trim()
}

export async function saveNoteToFile(content: string, id: number, title: string) {
  try {
    // Ensure the notes directory exists
    const notesDir = resolve("./notes")
    if (!existsSync(notesDir)) {
      mkdirSync(notesDir, { recursive: true })
    }

    // Create a file name from the title or fall back to the ID
    const fileName = title ? sanitizeFileName(title) : `note-${id}`
    const filePath = resolve(notesDir, `${fileName}.md`) // Changed to .md

    // Save the content to the file
    writeFileSync(filePath, content)

    return {
      success: true,
      message: "Note saved successfully",
      filePath: filePath,
    }
  } catch (error: any) {
    console.error("Error saving note to file:", error)
    return {
      success: false,
      message: error.message || "Failed to save note",
    }
  }
}

export async function createEmptyNoteFile(title: string) {
  try {
    // Ensure the notes directory exists
    const notesDir = resolve("./notes")
    if (!existsSync(notesDir)) {
      mkdirSync(notesDir, { recursive: true })
    }

    // Create a file name from the title
    const fileName = sanitizeFileName(title)
    const filePath = resolve(notesDir, `${fileName}.md`) // Changed to .md

    // Create an empty file
    writeFileSync(filePath, "")

    return {
      success: true,
      message: "Empty note file created",
      filePath: filePath,
    }
  } catch (error: any) {
    console.error("Error creating empty note file:", error)
    return {
      success: false,
      message: error.message || "Failed to create note file",
    }
  }
}
