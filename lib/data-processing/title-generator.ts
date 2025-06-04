/**
 * Generates a unique title for a new note
 * This utility helps create default titles that don't conflict with existing notes
 */
export function generateUniqueTitle(existingTitles: string[]): string {
  const baseTitle = 'New Note';
  let title = baseTitle;
  let counter = 1;
  
  // Check if the title already exists
  while (existingTitles.includes(title)) {
    title = `${baseTitle} ${counter}`;
    counter++;
  }
  
  return title;
}

/**
 * Counts words in a string
 * @param text The text to count words in
 * @returns The number of words
 */
export function countWords(text: string): number {
  if (!text || text.trim() === '') {
    return 0;
  }
  
  // Split by whitespace and filter out empty strings
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.length;
}
