# NoteIt-down

<div align="center">

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-blue)

*A powerful, minimalist note-taking application built with Next.js and TypeScript*

</div>

---

## Overview

NoteIt-down is a distraction-free Markdown-based writing app that supports focused note-taking and rich formatting. Built with Next.js 14 and TypeScript, it offers a clean interface for creating, organizing, and connecting your thoughts.

### Key Features

- **Markdown-First**: Native markdown support with live preview
- **Smart Linking**: Wiki-style note linking with bidirectional connections
- **Advanced Tagging**: Multi-select tagging system with visual feedback
- **Hierarchical Organization**: Parent-child note relationships
- **Powerful Search**: Real-time search across all notes
- **Customizable**: Fonts, categories, and color-coded organization
- **Flexible Storage**: Local and cloud storage options

---

## Features

### Core Functionality
- Rich Markdown Editor with syntax highlighting and live preview
- Real-time Auto-save to prevent data loss
- Advanced Search with content indexing and highlighting
- Dark/Light Mode with system preference detection
- Keyboard Shortcuts for power users

### Organization & Structure
- **Categories** with custom colors and organization
- **Advanced Tagging System**
  - Create unlimited custom tags with colors
  - Multi-select mode for batch operations
  - Visual feedback with checkmarks
  - Support for up to 5 tags per note
- **Note Relationships**
  - Wiki-style linking with `[[Note Title]]` syntax
  - Parent-child hierarchies
  - Bidirectional link tracking
  - Visual relationship indicators

### Content Features
- Code Block Support with syntax highlighting
- Checkbox Lists for todo items
- Internal Linking with auto-completion
- Export Options for sharing and backup
- Edit History tracking and recovery

---

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/Lilianada/NoteIt-down.git
cd NoteIt-down

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your application.

### First Steps

1. **Create Your First Note**
   - Click the "+" button in the sidebar
   - Give your note a title and start writing in Markdown
   - Your changes are automatically saved

2. **Organize with Tags**
   - Open note details (⋮ button)
   - Navigate to the "Tags" tab
   - Create custom tags or apply existing ones

3. **Link Notes Together**
   - Type `[[` to start linking to another note
   - Select from existing notes or create new ones
   - Build your knowledge network

---

## Development

### Tech Stack
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Editor**: Monaco Editor with markdown support
- **UI Components**: Radix UI primitives
- **Storage**: File system / Cloud storage adapters
- **Styling**: Tailwind CSS with custom fonts

### Build for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Project Structure

```
├── app/                 # Next.js app directory
├── components/          # React components
│   ├── editor/         # Markdown editor components
│   ├── tags/           # Tagging system
│   ├── notes/          # Note management
│   └── ui/             # Reusable UI components
├── lib/                # Utility functions and services
├── types/              # TypeScript type definitions
└── public/             # Static assets
```

---

## Markdown Support

NoteIt-down supports full Markdown syntax plus additional features:

```markdown
# Headers (H1-H6)
**Bold** and *italic* text
`inline code` and code blocks
- Lists and numbered lists
- [ ] Todo items
- [x] Completed items
[[Internal Links]] to other notes
```

---

## Contributing

We welcome contributions! Here's how to get started:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes and add tests if applicable
4. Commit your changes: `git commit -m 'Add your feature'`
5. Push to branch: `git push origin feature/your-feature`
6. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Add JSDoc comments for public APIs
- Write tests for new features
- Follow the existing code style
- Update documentation as needed

---

## License

This project is open source and available under the MIT License.

---

<div align="center">

**Built by Lily-Lilianada**

[Contact](mailto:hello.lilysgarden@gmail.com)

</div>
