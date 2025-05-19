import { Note } from '@/types';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';

type ExportFormat = 'markdown' | 'txt' | 'pdf';

/**
 * Export a single note to the selected format
 */
export async function exportNote(note: Note, format: ExportFormat): Promise<void> {
  try {
    const filename = `${note.noteTitle || 'note'}-${note.id}`;
    
    switch (format) {
      case 'markdown':
        const mdBlob = new Blob([note.content], { type: 'text/markdown;charset=utf-8' });
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
      case 'txt':
        // For markdown and txt, create a single file with all notes
        const separator = format === 'markdown' ? '\n\n---\n\n' : '\n\n==========\n\n';
        const content = notes.map(note => {
          const header = format === 'markdown' ? `# ${note.noteTitle || 'Untitled Note'}\n\n` : `${note.noteTitle || 'Untitled Note'}\n\n`;
          return header + note.content;
        }).join(separator);
        
        const blob = new Blob([content], { 
          type: format === 'markdown' ? 'text/markdown;charset=utf-8' : 'text/plain;charset=utf-8' 
        });
        saveAs(blob, `my-notes-${timestamp}.${format === 'markdown' ? 'md' : 'txt'}`);
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
  
  // Add title
  doc.setFontSize(18);
  doc.text(note.noteTitle || 'Untitled Note', 20, 20);
  
  // Add content
  doc.setFontSize(12);
  
  // Split content into lines that fit the page width
  const lines = doc.splitTextToSize(note.content, 170);
  doc.text(lines, 20, 30);
  
  // Save the PDF
  doc.save(`${note.noteTitle || 'note'}-${note.id}.pdf`);
}

/**
 * Helper function to export multiple notes to PDF format
 */
async function exportMultipleToPdf(notes: Note[]): Promise<void> {
  const doc = new jsPDF();
  let y = 20;
  
  for (let i = 0; i < notes.length; i++) {
    const note = notes[i];
    
    // Add a new page if not the first note
    if (i > 0) {
      doc.addPage();
      y = 20;
    }
    
    // Add title
    doc.setFontSize(18);
    doc.text(note.noteTitle || 'Untitled Note', 20, y);
    y += 10;
    
    // Add content
    doc.setFontSize(12);
    
    // Split content into lines that fit the page width
    const lines = doc.splitTextToSize(note.content, 170);
    
    // Check if we need to add a new page for long content
    if (y + lines.length * 7 > 280) {
      const linesPerPage = Math.floor((280 - y) / 7);
      const firstPageLines = lines.slice(0, linesPerPage);
      doc.text(firstPageLines, 20, y);
      
      // Continue on new pages as needed
      const remainingLines = lines.slice(linesPerPage);
      let currentPage = 1;
      let currentLine = 0;
      
      while (currentLine < remainingLines.length) {
        doc.addPage();
        const pageLines = remainingLines.slice(currentLine, currentLine + 35); // ~35 lines per page
        doc.text(pageLines, 20, 20);
        currentLine += 35;
        currentPage++;
      }
    } else {
      doc.text(lines, 20, y);
    }
  }
  
  // Save the PDF
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  doc.save(`my-notes-${timestamp}.pdf`);
}
