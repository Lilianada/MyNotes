// Server-side actions for file operations

"use server";

import { existsSync, mkdirSync, writeFileSync } from "fs";
import { resolve } from "path";
import { Note } from "@/types";
// We'll use our own sanitizeFileName function below to avoid import conflicts

// Helper to sanitize file names and create a slug
const sanitizeFileName = (name: string): string => {
  // First trim and limit to a reasonable length to prevent extremely long file names
  const trimmedName = name.trim().slice(0, 100);

  return trimmedName
    .toLowerCase()
    .replace(/[/\\?%*:|"<>]/g, "") // Remove prohibited characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/[^\w\-\.]/g, "") // Remove non-word chars except hyphens and dots
    .replace(/\-\-+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, "") // Remove leading/trailing hyphens
    .replace(/\.+$/, "") // Remove trailing dots
    || "untitled"; // Fallback if empty after processing
};

export async function saveNoteToFile(content: string, id: number, title: string) {
  try {
    // Ensure the notes directory exists
    const notesDir = resolve(process.cwd(), "notes");
    if (!existsSync(notesDir)) {
      mkdirSync(notesDir, { recursive: true });
    }

    // Create a file name from the title or fall back to the ID
    const fileName = title ? sanitizeFileName(title) : `note-${id}`;
    const filePath = resolve(notesDir, `${fileName}.md`); // Changed to .md

    // Save the content to the file
    writeFileSync(filePath, content);

    return {
      success: true,
      message: "Note saved successfully",
      filePath: filePath,
    };
  } catch (error: any) {
    console.error("Error saving note to file:", error);
    return {
      success: false,
      message: error.message || "Failed to save note",
    };
  }
}

export async function createEmptyNoteFile(title: string) {
  try {
    // Ensure the notes directory exists
    const notesDir = resolve(process.cwd(), "notes");
    if (!existsSync(notesDir)) {
      mkdirSync(notesDir, { recursive: true });
    }

    // Create a file name from the title
    const fileName = sanitizeFileName(title);
    const filePath = resolve(notesDir, `${fileName}.md`); // Changed to .md

    // Create an empty file
    writeFileSync(filePath, "");

    return {
      success: true,
      message: "Empty note file created",
      filePath: filePath,
    };
  } catch (error: any) {
    console.error("Error creating empty note file:", error);
    return {
      success: false,
      message: error.message || "Failed to create note file",
    };
  }
}

// Client-side download functionality has been removed since we're now using server-side storage
