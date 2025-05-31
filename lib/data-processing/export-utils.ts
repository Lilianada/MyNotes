import { Note } from '@/types';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import { format } from 'date-fns';

type ExportFormat = 'markdown' | 'txt' | 'pdf';

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

  // Add dates
  const createdDate = note.createdAt instanceof Date 
    ? note.createdAt.toISOString()
    : new Date().toISOString();
    
  const updatedDate = note.updatedAt instanceof Date 
    ? note.updatedAt.toISOString() 
    : createdDate;
    
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
    const filename = `${note.noteTitle || 'note'}-${note.id}`;
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
    if (notes.length === 0) {
      throw new Error('No notes to export');
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    switch (format) {
      case 'markdown':
        // For markdown, create a single file per note with frontmatter
        // or a zip file with all notes
        const markdownContents = notes.map(note => {
          const frontMatter = generateFrontMatter(note);
          const relationshipSections = generateNoteRelationshipsSections(note, notes);
          return frontMatter + note.content + relationshipSections;
        });
        
        // If it's just one note, save directly
        if (notes.length === 1) {
          const filename = `${notes[0].noteTitle || 'note'}-${notes[0].id}`;
          const mdBlob = new Blob([markdownContents[0]], { type: 'text/markdown;charset=utf-8' });
          saveAs(mdBlob, `${filename}.md`);
        } else {
          // For multiple notes, create a single file with separators
          const combinedContent = markdownContents.join('\n\n---\n\n');
          const mdBlob = new Blob([combinedContent], { type: 'text/markdown;charset=utf-8' });
          saveAs(mdBlob, `my-notes-${timestamp}.md`);
        }
        break;
        
      case 'txt':
        // For txt, create a single file with all notes (no frontmatter)
        const content = notes.map(note => {
          return `${note.noteTitle || 'Untitled Note'}\n\n${note.content}`;
        }).join('\n\n==========\n\n');
        
        const txtBlob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        saveAs(txtBlob, `my-notes-${timestamp}.txt`);
        break;
        
      case 'pdf':
        await exportMultipleToPdf(notes);
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
  const doc = new jsPDF();
  let y = 20;
  
  // Add title
  doc.setFontSize(18);
  doc.text(note.noteTitle || 'Untitled Note', 20, y);
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
    const dateStr = note.createdAt instanceof Date 
      ? format(note.createdAt, 'PPP') 
      : format(new Date(), 'PPP');
    doc.text(`Created: ${dateStr}`, 20, y);
    y += 6;
  }
  
  // Add content
  doc.setFontSize(12);
  doc.text('Content:', 20, y);
  y += 8;
  
  // Split content into lines that fit the page width
  const lines = doc.splitTextToSize(note.content, 170);
  doc.text(lines, 20, y);
  
  // Save the PDF
  doc.save(`${note.noteTitle || 'note'}-${note.id}.pdf`);
}

/**
 * Helper function to export multiple notes to PDF format
 */
async function exportMultipleToPdf(notes: Note[]): Promise<void> {
  const doc = new jsPDF();
  
  for (let i = 0; i < notes.length; i++) {
    const note = notes[i];
    
    // Add a new page if not the first note
    if (i > 0) {
      doc.addPage();
    }
    
    let y = 20;
    
    // Add title
    doc.setFontSize(18);
    doc.text(note.noteTitle || 'Untitled Note', 20, y);
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
      const dateStr = note.createdAt instanceof Date 
        ? format(note.createdAt, 'PPP') 
        : format(new Date(), 'PPP');
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
    
    // Split content into lines that fit the page width
    const lines = doc.splitTextToSize(note.content, 170);
    
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
  const timestamp = format(new Date(), 'yyyy-MM-dd-HH-mm-ss');
  doc.save(`my-notes-${timestamp}.pdf`);
}
