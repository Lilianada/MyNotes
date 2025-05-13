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
- Powerful search functionality to find notes by title or content
- Light and dark mode support
- Multiple storage options:
  - Server-side file storage using markdown (.md) files
  - Local browser storage for offline use
  - Firebase integration for authenticated admin users
- Google authentication with role-based permissions
- Keyboard shortcuts for efficient use

## Tech Stack

- Next.js 15
- TypeScript
- Tailwind CSS
- Server Actions for file operations
- Firebase (Authentication & Firestore)
- React Context API for state management

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

### Local Storage
- Notes are saved in the browser's local storage
- Works offline and doesn't require server-side storage
- Data persists between sessions until browser cache is cleared

### Firebase Integration (New)
- Google authentication for users
- Role-based permissions (admin vs standard users)
- Cloud Firestore database for secure note storage
- Real-time updates and cross-device synchronization for admin users

To set up Firebase integration:
1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication with Google provider
3. Create a Firestore database
4. Add your Firebase config to `.env.local` (see `.env.local` for format)
5. Create an 'admins' collection in Firestore with a document ID matching your email
6. See the detailed setup guide in `FIREBASE_SETUP.md`

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