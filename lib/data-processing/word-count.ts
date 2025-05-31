/**
 * Count words in a string, handling markdown formatting and special characters
 */
export function countWords(text: string): number {
  if (!text) return 0;
  
  // Remove Markdown formatting
  const cleanText = text
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, '')
    // Remove inline code
    .replace(/`[^`]*`/g, '')
    // Remove headers
    .replace(/#{1,6}\s+/g, '')
    // Remove bold and italic markers
    .replace(/(\*\*|\*|__|\w+__|\w+\*\*|\w+\*)/g, '')
    // Remove links
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove images
    .replace(/!\[([^\]]+)\]\([^)]+\)/g, '')
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Replace multiple spaces with a single space
    .replace(/\s+/g, ' ')
    .trim();
  
  // Split by spaces and count non-empty parts
  return cleanText.split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Format word count with appropriate suffix
 */
export function formatWordCount(count: number): string {
  if (count === 1) return '1 word';
  return `${count} words`;
}
