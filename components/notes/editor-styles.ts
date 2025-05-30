// Editor-related CSS styles
export const editorStyles = `
  .note-editor-textarea {
    letter-spacing: 0.025em !important;
    line-height: 2 !important;
    padding: 1rem;
    width: 100%;
    height: 100%;
    resize: none;
    outline: none;
    border: none;
    overflow-y: auto;
  }
`;

// Generate dynamic CSS based on font and spacing preferences
export function generateEditorStyles(
  font?: string,
  fontSize?: string,
  lineSpacing?: string
): string {
  return `
    .note-editor-textarea {
      font-family: ${font || 'var(--font-sans)'};
      font-size: ${fontSize || '1rem'};
      line-height: ${lineSpacing || '2'} !important;
    }
  `;
}
