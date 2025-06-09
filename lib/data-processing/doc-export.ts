import { Note } from '@/types';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';

// Helper function to safely handle date conversions
const formatDate = (date: Date | string): string => {
  try {
    if (date instanceof Date && !isNaN(date.getTime())) {
      return format(date, 'PPP');
    } else if (typeof date === 'string') {
      return format(new Date(date), 'PPP');
    }
    return format(new Date(), 'PPP');
  } catch (error) {
    console.warn('Invalid date in export, using current date');
    return format(new Date(), 'PPP');
  }
};

/**
 * Helper function to export a single note to DOC format
 */
export async function exportToDoc(note: Note, allNotes: Note[]): Promise<void> {
  try {
    // Create a new Document
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            // Title
            new Paragraph({
              text: note.noteTitle || 'Untitled Note',
              heading: HeadingLevel.HEADING_1,
            }),
            
            // Metadata
            new Paragraph({
              children: [
                new TextRun({ text: `ID: ${note.id}`, size: 20 }),
              ],
            }),
            
            // Created date
            new Paragraph({
              children: [
                new TextRun({ 
                  text: `Created: ${note.createdAt ? formatDate(note.createdAt) : 'Unknown'}`, 
                  size: 20 
                }),
              ],
            }),
            
            // Updated date
            new Paragraph({
              children: [
                new TextRun({ 
                  text: `Updated: ${note.updatedAt ? formatDate(note.updatedAt) : 'Unknown'}`, 
                  size: 20 
                }),
              ],
            }),
            
            // Tags
            ...(note.tags && note.tags.length > 0 ? [
              new Paragraph({
                children: [
                  new TextRun({ text: `Tags: ${note.tags.join(', ')}`, size: 20 }),
                ],
              })
            ] : []),
            
            // Word count
            new Paragraph({
              children: [
                new TextRun({ text: `Word count: ${note.wordCount || 0}`, size: 20 }),
              ],
              spacing: { after: 400 },
            }),
            
            // Content
            ...note.content.split('\n').map(line => 
              new Paragraph({
                children: [new TextRun({ text: line || ' ' })],
              })
            ),
          ],
        },
      ],
    });
    
    // Generate the document
    const buffer = await Packer.toBuffer(doc);
    
    // Create a safe filename
    const safeTitle = (note.noteTitle || 'note')
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase();
    const timestamp = format(new Date(), 'yyyy-MM-dd');
    
    // Save the document
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    saveAs(blob, `${safeTitle}-${note.id}-${timestamp}.docx`);
  } catch (error) {
    console.error(`Error creating DOC for note ${note.id}:`, error);
    throw new Error(`Failed to export DOC: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Helper function to export multiple notes to DOC format
 */
export async function exportMultipleToDoc(notes: Note[]): Promise<void> {
  try {
    // Create a new Document
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            // Title
            new Paragraph({
              text: 'Exported Notes',
              heading: HeadingLevel.HEADING_1,
              spacing: { after: 400 },
            }),
            
            // Process each note
            ...notes.flatMap((note, index) => [
              // Add a page break after the first note
              ...(index > 0 ? [
                new Paragraph({
                  text: '',
                  pageBreakBefore: true,
                }),
              ] : []),
              
              // Note title
              new Paragraph({
                text: note.noteTitle || 'Untitled Note',
                heading: HeadingLevel.HEADING_2,
              }),
              
              // Metadata
              new Paragraph({
                children: [
                  new TextRun({ text: `ID: ${note.id}`, size: 20 }),
                ],
              }),
              
              // Created date
              new Paragraph({
                children: [
                  new TextRun({ 
                    text: `Created: ${note.createdAt ? formatDate(note.createdAt) : 'Unknown'}`, 
                    size: 20 
                  }),
                ],
              }),
              
              // Updated date
              new Paragraph({
                children: [
                  new TextRun({ 
                    text: `Updated: ${note.updatedAt ? formatDate(note.updatedAt) : 'Unknown'}`, 
                    size: 20 
                  }),
                ],
              }),
              
              // Tags
              ...(note.tags && note.tags.length > 0 ? [
                new Paragraph({
                  children: [
                    new TextRun({ text: `Tags: ${note.tags.join(', ')}`, size: 20 }),
                  ],
                })
              ] : []),
              
              // Word count
              new Paragraph({
                children: [
                  new TextRun({ text: `Word count: ${note.wordCount || 0}`, size: 20 }),
                ],
                spacing: { after: 400 },
              }),
              
              // Content
              ...note.content.split('\n').map(line => 
                new Paragraph({
                  children: [new TextRun({ text: line || ' ' })],
                })
              ),
            ]),
          ],
        },
      ],
    });
    
    // Generate the document
    const buffer = await Packer.toBuffer(doc);
    
    // Save the document
    const timestamp = format(new Date(), 'yyyy-MM-dd');
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    saveAs(blob, `my-notes-${timestamp}.docx`);
  } catch (error) {
    console.error('Error creating multi-note DOC:', error);
    throw new Error(`Failed to export DOC: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
