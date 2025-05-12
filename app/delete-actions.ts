"use server"

import { existsSync, unlinkSync } from "fs"
import { resolve } from "path"

/**
 * Deletes a note file from the file system
 */
export async function deleteNoteFile(filePath: string) {
  try {
    // Ensure the file exists
    const resolvedPath = resolve(filePath)
    if (!existsSync(resolvedPath)) {
      return {
        success: false,
        message: "File not found",
      }
    }

    // Delete the file
    unlinkSync(resolvedPath)

    return {
      success: true,
      message: "Note deleted successfully",
    }
  } catch (error: any) {
    console.error("Error deleting note file:", error)
    return {
      success: false,
      message: error.message || "Failed to delete note",
    }
  }
}
