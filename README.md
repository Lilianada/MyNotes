# NoteItDown

<div align="center">

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-blue)

*A powerful, minimalist note-taking application built with Next.js and TypeScript*

[Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

---

## 🚀 Overview

NoteItDown is a modern, feature-rich note-taking application that combines the simplicity of markdown with powerful organizational tools. Built with Next.js 15 and TypeScript, it offers a clean interface for creating, organizing, and connecting your thoughts.

### Why NoteItDown?

- **📝 Markdown-First**: Native markdown support with live preview
- **🔗 Smart Linking**: Wiki-style note linking with bidirectional connections
- **🏷️ Advanced Tagging**: Multi-select tagging system with visual feedback
- **📁 Hierarchical Organization**: Parent-child note relationships
- **🔍 Powerful Search**: Real-time search across all notes
- **🎨 Customizable**: Themes, categories, and color-coded organization
- **💾 Flexible Storage**: File system or cloud storage options

---

## ✨ Features

### Core Functionality
- **Rich Markdown Editor** with syntax highlighting and live preview
- **Real-time Auto-save** to prevent data loss
- **Advanced Search** with content indexing and highlighting
- **Dark/Light Mode** with system preference detection
- **Keyboard Shortcuts** for power users

### Organization & Structure
- **📁 Categories** with custom colors and organization
- **🏷️ Advanced Tagging System**
  - Create unlimited custom tags with colors
  - Multi-select mode for batch operations
  - Visual feedback with checkmarks
  - Support for up to 5 tags per note
- **🔗 Note Relationships**
  - Wiki-style linking with `[[Note Title]]` syntax
  - Parent-child hierarchies
  - Bidirectional link tracking
  - Visual relationship indicators

### Content Features
- **Code Block Support** with syntax highlighting
- **Checkbox Lists** for todo items
- **Internal Linking** with auto-completion
- **Export Options** for sharing and backup
- **Edit History** tracking and recovery

---

## 🏁 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/noteitdown.git
cd noteitdown

# Install dependencies
npm install
# or
yarn install

# Start development server
npm run dev
# or
yarn dev
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

## 📚 Documentation

### Tech Stack
- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Editor**: Monaco Editor with markdown support
- **UI Components**: Radix UI primitives
- **Storage**: File system / Cloud storage adapters
- **Styling**: Tailwind CSS with custom themes

### Markdown Support

NoteItDown supports full Markdown syntax plus additional features:

```markdown
# Headers (H1-H6)
**Bold** and *italic* text
`inline code` and code blocks
- Lists and numbered lists
- [ ] Todo items
- [x] Completed items
[[Internal Links]] to other notes
```

### Advanced Tagging System

#### Tag Modes
- **Immediate Mode**: Tags apply instantly when clicked
- **Multi-Select Mode**: Select multiple tags before applying

#### Using Tags
1. Open note details panel (⋮ button)
2. Go to "Tags" tab
3. Create new tags with custom colors
4. Toggle multi-select for batch operations
5. Apply changes or cancel to revert

#### Visual Indicators
- **Selected Tags**: Blue background with white checkmark
- **Unselected Tags**: Subtle border with empty circle
- **Hover Effects**: Visual feedback when hovering over tags
- **Color Coding**: Each tag displays its assigned color

### Note Linking & Hierarchies

#### Wiki-Style Links
```markdown
[[Note Title]]              # Basic link
[[Note Title|Display Text]] # Custom display text
```

#### Relationships
- **Parent-Child**: Create hierarchical note structures
- **Bidirectional Links**: Links work both ways automatically
- **Visual Indicators**: Icons show relationship types in sidebar

### Storage Options

#### File System (Default)
- Notes saved as `.md` files on server
- Perfect for self-hosted deployments
- Requires file system access

#### Cloud Storage (Optional)
- Integration with cloud providers
- Serverless deployment friendly
- Collaborative features support

---

## 🛠️ Development

### Build for Production

```bash
# Build the application
npm run build
# or
yarn build

# Start production server
npm start
# or
yarn start
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

## 🎯 Roadmap

### Version 2.1.0 ✅
- [x] Multi-select tagging system
- [x] Enhanced visual feedback
- [x] Batch tag operations
- [x] Improved UI transitions

### Version 2.2.0 🔄
- [ ] User preference persistence
- [ ] Tag search and filtering
- [ ] Keyboard shortcuts for tagging
- [ ] Tag usage analytics
- [ ] Export/import functionality

### Version 2.3.0 📋
- [ ] Collaborative editing
- [ ] Plugin system
- [ ] Advanced markdown features
- [ ] Mobile app companion

---

## 🐛 Known Issues

| Issue | Description | Status |
|-------|-------------|--------|
| Font Rendering | Inconsistent across browsers | Investigating |
| Mobile Safari | Scrolling issues in editor | In Progress |
| Large Images | Scaling on small screens | Planned Fix |
| Tag Storage | User preferences not persisted | Next Release |
| Code Blocks | Horizontal scrolling issues | Investigating |
| Responsiveness | Mobile screen compatibility | In Progress |

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** and add tests if applicable
4. **Commit your changes**: `git commit -m 'Add amazing feature'`
5. **Push to branch**: `git push origin feature/amazing-feature`
6. **Open a Pull Request**

### Development Guidelines
- Follow TypeScript best practices
- Add JSDoc comments for public APIs
- Write tests for new features
- Follow the existing code style
- Update documentation as needed

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **[Next.js](https://nextjs.org/)** - The React framework for production
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Monaco Editor](https://microsoft.github.io/monaco-editor/)** - Code editor powering VS Code
- **[Radix UI](https://www.radix-ui.com/)** - Low-level UI primitives

---

<div align="center">

**Built with ❤️ by the NoteItDown team**

[Website](https://noteitdown.dev) • [Documentation](https://docs.noteitdown.dev) • [Support](mailto:support@noteitdown.dev)

</div>
