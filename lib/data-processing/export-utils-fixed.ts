import { Note } from '@/types';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';

type ExportFormat = 'markdown' | 'txt' | 'pdf';

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
 * Format date to standard string
 */
function formatDate(date: any): string {
  const validDate = safeDate(date);
  try {
    return validDate.toLocaleDateString();
  } catch (error) {
    return new Date().toLocaleDateString();
  }
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
    if (!Array.isArray(notes) || notes.length === 0) {
      throw new Error('No notes to export');
    }
    
    // Check for any invalid notes
    const validNotes = notes.filter(note => 
      note && typeof note === 'object' && 
      typeof note.id === 'number' && 
      (typeof note.content === 'string' || note.content === null || note.content === undefined)
    );
    
    if (validNotes.length === 0) {
      throw new Error('No valid notes to export');
    }
    
    if (validNotes.length !== notes.length) {
      console.warn(`Filtered out ${notes.length - validNotes.length} invalid notes from export`);
    }
    
    switch (format) {
      case 'markdown':
        // For markdown, create a single file per note with frontmatter
        // or a zip file with all notes
        const markdownContents = validNotes.map(note => {
          const frontMatter = generateFrontMatter(note);
          const relationshipSections = generateNoteRelationshipsSections(note, validNotes);
          return frontMatter + (note.content || '') + relationshipSections;
        });
        
        // If it's just one note, save directly
        if (validNotes.length === 1) {
          const note = validNotes[0];
          const safeTitle = (note.noteTitle || 'note')
            .replace(/[^a-z0-9]/gi, '_')
            .toLowerCase();
          const filename = `${safeTitle}-${note.id}`;
          const mdBlob = new Blob([markdownContents[0]], { type: 'text/markdown;charset=utf-8' });
          saveAs(mdBlob, `${filename}.md`);
        } else {
          // For multiple notes, create a zip file containing individual md files
          const zip = new JSZip();
          
          // Create a folder for the notes and a readme file
          const notesFolder = zip.folder("notes");
          
          if (!notesFolder) {
            throw new Error("Failed to create notes folder in zip file");
          }
          
          // Add readme file with export information
          const readmeContent = `# Exported Notes\n\nDate: ${new Date().toLocaleDateString()}\nNumber of notes: ${validNotes.length}\n\n## Contents\n\n${
            validNotes.map((note, i) => `${i+1}. ${note.noteTitle || 'Untitled Note'} (ID: ${note.id})`).join('\n')
          }`;
          
          zip.file("README.md", readmeContent);
          
          // Add each note as a separate file
          validNotes.forEach((note, index) => {
            const safeTitle = (note.noteTitle || 'untitled')
              .replace(/[^a-z0-9]/gi, '_')
              .toLowerCase();
            const filename = `${safeTitle}-${note.id}.md`;
            notesFolder.file(filename, markdownContents[index]);
          });
          
          // Generate the zip file and save it
          zip.generateAsync({ type: "blob" })
            .then(function(content) {
              saveAs(content, `my-notes-collection.zip`);
            });
        }
        break;
        
      case 'txt':
        if (validNotes.length === 1) {
          // For a single note, create a simple text file
          const note = validNotes[0];
          const txtContent = `${note.noteTitle || 'Untitled Note'}\n\n${note.content || ''}`;
          const txtBlob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
          
          const safeTitle = (note.noteTitle || 'note')
            .replace(/[^a-z0-9]/gi, '_')
            .toLowerCase();
          saveAs(txtBlob, `${safeTitle}-${note.id}.txt`);
        } else {
          // For multiple notes, create a single file with clear separators
          const content = validNotes.map((note, index) => {
            const header = `NOTE ${index + 1}: ${note.noteTitle || 'Untitled Note'} (ID: ${note.id})`;
            const separator = '='.repeat(header.length);
            return `${separator}\n${header}\n${separator}\n\n${note.content || ''}\n`;
          }).join('\n\n');
          
          const txtBlob = new Blob([content], { type: 'text/plain;charset=utf-8' });
          saveAs(txtBlob, `my-notes-collection.txt`);
        }
        break;
        
      case 'pdf':
        await exportMultipleToPdf(validNotes);
        break;
    }
  } catch (error) {
    console.error('Error exporting all notes:', error);
    throw new Error(`Failed to export notes: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      const dateStr = formatDate(note.createdAt);
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
    
    // Save the PDF
    doc.save(`${safeTitle}-${note.id}.pdf`);
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
    
    const doc = new jsPDF();
    
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
        const dateStr = formatDate(note.createdAt);
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
  
    // Save the PDF
    doc.save(`my-notes-collection.pdf`);
  } catch (error) {
    console.error("Error exporting multiple notes to PDF:", error);
    throw new Error(`Failed to export notes to PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
