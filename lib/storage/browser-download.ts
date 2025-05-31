"use client";

import { Note } from "@/types";

/**
 * Client-side file saving using the browser's capabilities
 */
export async function downloadNoteAsFile(note: Note): Promise<void> {
  try {
    // Create a slug from the note title
    const slug = slugify(note.noteTitle);

    // Create a Blob containing the note content
    const blob = new Blob([note.content], { type: "text/markdown" });

    // Create a download link
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${slug}.md`;

    // Trigger the download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the URL object
    URL.revokeObjectURL(link.href);

    // Return success
    return Promise.resolve();
  } catch (error) {
    console.error("Failed to save note:", error);
    return Promise.reject(error);
  }
}

/**
 * Helper function to slugify note titles
 */
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, ""); // Trim - from end of text
}
