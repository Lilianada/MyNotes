import { Note } from '@/types';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import { exportToDoc, exportMultipleToDoc } from './doc-export';

type ExportFormat = 'markdown' | 'txt' | 'pdf' | 'doc';

/**
 * Helper function to safely handle date conversions
 */
function safeDate(date: any): Date {
  if (date instanceof Date && !isNaN(date.getTime())) {
    return date;
  }
  // If it's a timestamp or string that can be parsed
  if (typeof date === 'number' || (typeof date === 'string' && !isNaN(Date.parse(date)))) {
    const parsedDate = new Date(date);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate;
    }
  }
  // Default to current date if invalid
  return new Date();
}

/**
 * Generate frontmatter for markdown export
 */
function generateFrontMatter(note: Note): string {
  const frontMatter = [
    '---',
    `id: note-${note.id.toString().padStart(3, '0')}`,
    `title: ${note.noteTitle || 'Untitled Note'}`,
    `slug: "${note.slug || ''}"`,
  ];

  // Add category if it exists
  if (note.category) {
    frontMatter.push(`category: ${note.category.name}`);
  }

  // Add tags if they exist
  if (note.tags && note.tags.length > 0) {
    frontMatter.push('tags:');
    note.tags.forEach(tag => {
      frontMatter.push(`  - ${tag}`);
    });
  }

  // Add parent ID if it exists
  frontMatter.push(`parentId: ${note.parentId !== undefined ? String(note.parentId) : 'null'}`);

  // Add linked note IDs if they exist
  if (note.linkedNoteIds && note.linkedNoteIds.length > 0) {
    frontMatter.push('linkedNoteIds:');
    note.linkedNoteIds.forEach(id => {
      frontMatter.push(`  - note-${id.toString().padStart(3, '0')}`);
    });
  }

  // Add dates with safe date conversion
  const createdDate = safeDate(note.createdAt).toISOString();
  const updatedDate = note.updatedAt ? safeDate(note.updatedAt).toISOString() : createdDate;
    
  frontMatter.push(`createdAt: ${createdDate}`);
  frontMatter.push(`updatedAt: ${updatedDate}`);
  frontMatter.push('---\n');

  return frontMatter.join('\n');
}

/**
 * Generate linked notes and backlinks sections for markdown
 */
function generateNoteRelationshipsSections(note: Note, allNotes: Note[]): string {
  let sections = '';
  
  // Add linked notes section if there are any linked notes
  if (note.linkedNoteIds && note.linkedNoteIds.length > 0) {
    sections += '\n\n---\n\n## Linked Notes\n';
    note.linkedNoteIds.forEach(id => {
      const linkedNote = allNotes.find(n => n.id === id);
      if (linkedNote) {
        sections += `- [[note-${id.toString().padStart(3, '0')}]] ${linkedNote.noteTitle}\n`;
      }
    });
  }
  
  // Add backlinks section - notes that link to this note
  const backlinks = allNotes.filter(
    n => n.id !== note.id && n.linkedNoteIds?.includes(note.id)
  );
  
  if (backlinks.length > 0) {
    sections += '\n\n## Backlinks\n';
    backlinks.forEach(backlink => {
      sections += `- [[note-${backlink.id.toString().padStart(3, '0')}]] ${backlink.noteTitle}\n`;
    });
  }
  
  return sections;
}

/**
 * Export a single note to the selected format
 */
export async function exportNote(note: Note, format: ExportFormat, allNotes?: Note[]): Promise<void> {
  try {
    const safeTitle = (note.noteTitle || 'note')
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase();
    const filename = `${safeTitle}-${note.id}`;
    const notesForRelations = allNotes || [note];
    
    switch (format) {
      case 'markdown':
        // Create markdown with frontmatter and relationship sections
        const frontMatter = generateFrontMatter(note);
        const relationshipSections = generateNoteRelationshipsSections(note, notesForRelations);
        const mdContent = frontMatter + note.content + relationshipSections;
        
        const mdBlob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
        saveAs(mdBlob, `${filename}.md`);
        break;
        
      case 'txt':
        const txtBlob = new Blob([note.content], { type: 'text/plain;charset=utf-8' });
        saveAs(txtBlob, `${filename}.txt`);
        break;

      case 'doc':
        await exportToDoc(note, notesForRelations);
        break;
        
      case 'pdf':
        await exportToPdf(note);
        break;
    }
  } catch (error) {
    console.error('Error exporting note:', error);
    throw new Error(`Failed to export note: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Export multiple notes to the selected format
 */
export async function exportAllNotes(notes: Note[], format: ExportFormat): Promise<void> {
  try {
    // Handle empty notes array
    if (notes.length === 0) {
      throw new Error("No notes to export");
    }
    
    // For PDF format, use the specialized function
    if (format === 'pdf') {
      await exportMultipleToPdf(notes);
      return;
    }

    // For DOC format, use the specialized function
    if (format === 'doc') {
      await exportMultipleToDoc(notes);
      return;
    }
    
    // For other formats, create a zip file with all notes
    const zip = new JSZip();
    const timestamp = format(new Date(), 'yyyy-MM-dd');
    const zipFilename = `my-notes-${timestamp}.zip`;
    
    // Process each note
    for (const note of notes) {
      const safeTitle = (note.noteTitle || 'note')
        .replace(/[^a-z0-9]/gi, '_')
        .toLowerCase();
      const filename = `${safeTitle}-${note.id}`;
      
      switch (format) {
        case 'markdown':
          // Create markdown with frontmatter and relationship sections
          const frontMatter = generateFrontMatter(note);
          const relationshipSections = generateNoteRelationshipsSections(note, notes);
          const mdContent = frontMatter + note.content + relationshipSections;
          
          zip.file(`${filename}.md`, mdContent);
          break;
          
        case 'txt':
          zip.file(`${filename}.txt`, note.content);
          break;
      }
    }
    
    // Generate and save the zip file
    const content = await zip.generateAsync({ 
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 9 } // Maximum compression
    });
    saveAs(content, zipFilename);
  } catch (error) {
    console.error("Error exporting notes:", error);
    throw error;
  }
}

/**
 * Helper function to export a single note to PDF format
 */
async function exportToPdf(note: Note): Promise<void> {
  try {
    const doc = new jsPDF();
    let y = 20;
    
    // Create a safe filename
    const safeTitle = (note.noteTitle || 'note')
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase();
    
    // Add title
    doc.setFontSize(18);
    const title = note.noteTitle || 'Untitled Note';
    doc.text(title, 20, y);
    y += 10;
    
    // Add metadata
    doc.setFontSize(10);
    
    if (note.category) {
      doc.text(`Category: ${note.category.name}`, 20, y);
      y += 6;
    }
    
    if (note.tags && note.tags.length > 0) {
      doc.text(`Tags: ${note.tags.join(', ')}`, 20, y);
      y += 6;
    }
    
    if (note.createdAt) {
      let dateStr;
      try {
        dateStr = note.createdAt instanceof Date && !isNaN(note.createdAt.getTime())
          ? format(note.createdAt, 'PPP') 
          : format(new Date(), 'PPP');
      } catch (error) {
        console.warn('Invalid date in PDF export, using current date');
        dateStr = format(new Date(), 'PPP');
      }
      doc.text(`Created: ${dateStr}`, 20, y);
      y += 6;
    }
    
    // Add content
    doc.setFontSize(12);
    doc.text('Content:', 20, y);
    y += 8;
    
    // Handle empty content
    const content = note.content || '(No content)';
    
    // Split content into lines that fit the page width
    const lines = doc.splitTextToSize(content, 170);
    
    // Check if content is very long, handle pagination
    if (y + lines.length * 7 > 280) {
      const linesPerPage = Math.floor((280 - y) / 7);
      const firstPageLines = lines.slice(0, linesPerPage);
      doc.text(firstPageLines, 20, y);
      
      // Continue on new pages as needed
      const remainingLines = lines.slice(linesPerPage);
      let currentLine = 0;
      
      while (currentLine < remainingLines.length) {
        doc.addPage();
        const pageLines = remainingLines.slice(currentLine, currentLine + 35); // ~35 lines per page
        doc.text(pageLines, 20, 20);
        currentLine += 35;
      }
    } else {
      doc.text(lines, 20, y);
    }
    
    // Save the PDF with improved filename
    const timestamp = format(new Date(), 'yyyy-MM-dd');
    doc.save(`${safeTitle}-${note.id}-${timestamp}.pdf`);
  } catch (error) {
    console.error(`Error creating PDF for note ${note.id}:`, error);
    throw new Error(`Failed to export PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Helper function to export multiple notes to PDF format
 */
async function exportMultipleToPdf(notes: Note[]): Promise<void> {
  try {
    // Handle empty notes array
    if (notes.length === 0) {
      throw new Error("No notes to export to PDF");
    }
    
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });
    
    for (let i = 0; i < notes.length; i++) {
      const note = notes[i];
      
      // Add a new page if not the first note
      if (i > 0) {
        doc.addPage();
      }
      
      let y = 20;
      
      // Add title and note number
      doc.setFontSize(18);
      doc.text(`${note.noteTitle || 'Untitled Note'} (${i+1}/${notes.length})`, 20, y);
      y += 10;
    
    // Add metadata
    doc.setFontSize(10);
    
    if (note.category) {
      doc.text(`Category: ${note.category.name}`, 20, y);
      y += 6;
    }
    
    if (note.tags && note.tags.length > 0) {
      doc.text(`Tags: ${note.tags.join(', ')}`, 20, y);
      y += 6;
    }
    
    if (note.createdAt) {
      let dateStr;
      try {
        dateStr = note.createdAt instanceof Date && !isNaN(note.createdAt.getTime())
          ? format(note.createdAt, 'PPP') 
          : format(new Date(), 'PPP');
      } catch (error) {
        console.warn('Invalid date in PDF export, using current date');
        dateStr = format(new Date(), 'PPP');
      }
      doc.text(`Created: ${dateStr}`, 20, y);
      y += 6;
    }
    
    // Add relationship info
    if (note.parentId) {
      const parentNote = notes.find(n => n.id === note.parentId);
      if (parentNote) {
        doc.text(`Parent Note: ${parentNote.noteTitle}`, 20, y);
        y += 6;
      }
    }
    
    if (note.linkedNoteIds && note.linkedNoteIds.length > 0) {
      const linkedTitles = note.linkedNoteIds
        .map(id => {
          const linkedNote = notes.find(n => n.id === id);
          return linkedNote ? linkedNote.noteTitle : `Note #${id}`;
        })
        .join(', ');
      
      doc.text(`Linked Notes: ${linkedTitles}`, 20, y);
      y += 6;
    }
    
    // Add content
    doc.setFontSize(12);
    doc.text('Content:', 20, y);
    y += 8;
    
    // Handle empty content
    const content = note.content || '(No content)';
    
    // Split content into lines that fit the page width
    const lines = doc.splitTextToSize(content, 170);
    
    // Check if we need to add a new page for long content
    if (y + lines.length * 7 > 280) {
      const linesPerPage = Math.floor((280 - y) / 7);
      const firstPageLines = lines.slice(0, linesPerPage);
      doc.text(firstPageLines, 20, y);
      
      // Continue on new pages as needed
      const remainingLines = lines.slice(linesPerPage);
      let currentLine = 0;
      
      while (currentLine < remainingLines.length) {
        doc.addPage();
        const pageLines = remainingLines.slice(currentLine, currentLine + 35); // ~35 lines per page
        doc.text(pageLines, 20, 20);
        currentLine += 35;
      }
    } else {
      doc.text(lines, 20, y);
    }
  }
  
  // Save the PDF with timestamp
  const timestamp = format(new Date(), 'yyyy-MM-dd');
  doc.save(`my-notes-collection-${timestamp}.pdf`);
  } catch (error) {
    console.error("Error exporting multiple notes to PDF:", error);
    throw new Error(`Failed to export notes to PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
