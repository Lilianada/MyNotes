# NoteItDown

A minimalist notes application built with Next.js and TypeScript that saves notes as markdown files on the server.

## Features

- Clean, minimalist interface focused on simple note-taking
- Markdown support for rich text formatting including:
  - Headers (# H1, ## H2, ### H3)
  - Text formatting (**bold**, *italic*)
  - Code blocks (```code```)
  - Inline code (`code`)
  - Lists (- item, 1. item)
  - Checkboxes ([ ] todo, [x] done)
  - Wiki-style internal links ([[Note Title]]) for connecting notes
- Note linking and hierarchies:
  - Create parent-child relationships between notes
  - Link notes bidirectionally
  - Visual indicators for linked and hierarchical notes
  - Navigate between related notes easily
- Powerful search functionality to find notes by title or content
- Light and dark mode support
- Server-side file storage using markdown (.md) files
- Keyboard shortcuts for efficient use

## Tech Stack

- Next.js 15
- TypeScript
- Tailwind CSS
- Server Actions for file operations

## Getting Started

### Prerequisites

- Node.js (v18 or newer)
- npm or yarn

### Installation

1. Clone the repository or download the source code
2. Install dependencies:
   ```bash
   yarn install
   # or
   npm install
   ```
3. Run the development server:
   ```bash
   yarn dev
   # or
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Building for Production

```bash
yarn build
# or
npm run build
```

## Search Functionality

The application includes a powerful search feature that allows users to:
- Search notes by title or content
- See previews of matching notes with highlighted matches
- Quickly navigate to search results
- Real-time search as you type

## Code Block Support

NoteItDown provides excellent support for code blocks in your notes:
- Syntax highlighting for multiple languages
- Monospace formatting for code sections
- Support for both inline code using backticks (`code`) 
- Multi-line code blocks using triple backticks:
  ```
  function example() {
    return "This is a code block";
  }
  ```

## Storage Options

NoteItDown offers flexible storage options to meet different needs:

### File System Storage (Default)
- Notes are saved as Markdown (.md) files on the server
- Perfect for self-hosted deployments
- Requires file system access on the server

### Notion Integration (Optional)
NoteItDown can be configured to use Notion as a database backend:
- Store notes in Notion databases instead of the filesystem
- Perfect for serverless deployments on platforms like Vercel
- Enables collaboration features through Notion
- Requires a Notion API key and database ID

To enable Notion integration:
1. Add your Notion API key and Database ID to `.env.local`
2. Follow the setup guide in the `.env.local` file
3. Restart the application

## License

MIT

## Acknowledgements

Built with [Next.js](https://nextjs.org/) and [Tailwind CSS](https://tailwindcss.com/).

## Note Linking and Hierarchies

The MyNotes app supports powerful note linking and hierarchy features:

### Wiki-style Links
- Use double brackets to create links between notes: `[[Note Title]]`
- Add custom display text with a pipe: `[[Note Title|Display Text]]`
- Auto-completion suggests existing note titles as you type
- Clicking on links navigates directly to the linked note

### Parent-Child Relationships
- Set any note as a parent or child of another note
- Create hierarchical structures for organizing related content
- Visual indicators in the sidebar show parent/child relationships
- Parent notes show a blue folder icon
- Child notes show a green upward folder icon

### Bidirectional Linking
- Links between notes are automatically bidirectional
- When you link Note A to Note B, Note B is also linked to Note A
- Linked notes are indicated with a purple link icon in the sidebar
- All relationships are preserved when moving notes

### Managing Relationships
1. Open the note details panel by clicking the vertical dots icon
2. Navigate to the "Links" tab
3. Use "Set Parent" to establish a parent-child relationship
4. Use "Manage Links" to create connections between notes