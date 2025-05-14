"use client";

import { createContext, useState, useContext, useEffect, ReactNode } from "react";
import { Note } from "@/types";
import { loadNotesFromFiles } from "@/lib/note-loader";
import { saveNoteToFile, createEmptyNoteFile } from "@/app/actions";
import { firebaseNotesService } from "@/lib/firebase-notes";
import { localStorageNotesService } from "@/lib/local-storage-notes";
import { useAuth } from "@/contexts/auth-context";
import { get } from "http";

interface NoteContextType {
  notes: Note[];
  selectedNoteId: number | null;
  setNotes: (notes: Note[]) => void;
  addNote: (noteTitle: string) => Promise<Note>;
  updateNote: (id: number, content: string) => void;
  updateNoteTitle: (id: number, title: string) => void;
  deleteNote: (id: number) => void;
  selectNote: (id: number | null) => void;
}

const NoteContext = createContext<NoteContextType | undefined>(undefined);



// Function to create a welcome note content
const getWelcomeContent = () => {
  return `# Welcome to NoteItDown! 🚀

**Transform your thoughts into beautifully organized notes.**

## Getting Started in 30 Seconds

1. **Create** a new note with the "+" button in the sidebar
2. **Write** using intuitive Markdown formatting
3. **Toggle** between edit and preview modes with the "View" button
4. **Find** notes instantly with the search feature

## Markdown Basics

- **Headers:** Use # for headers (# H1, ## H2, ### H3)
- **Formatting:** **bold**, *italic*, ~~strikethrough~~
- **Lists:** 
  - Bullet points like this one
  - Numbered lists (1. 2. 3.)
- **Code:** \`inline code\` or code blocks with \`\`\`
- **Links:** [text](url)
- **Tasks:** 
  - [ ] Unchecked task
  - [x] Checked task

## Pro Tips

> 💡 Type -> to automatically convert to → arrow
> 
> Use Ctrl+S or Cmd+S to save notes
>
> Your notes are saved in localStorage so do not clear site data to preserve them or export them using the export button in the \`...\` menu.
>
> You can change the note's title by clicking the title on the editor to edit it

## Firebase Integration (Optional)

If you want to enable cloud storage:

1. Fork the repository at github.com/mynotes
2. Clone and install the app locally
3. Create a Firebase project and enable Google authentication
4. Add your email to the "admins" collection
5. Add your Firebase keys to .env.local file
6. Run the app and sign in with Google

Happy note-taking! 📝`;
};


export function NoteProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);
  const { user, isAdmin } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeNotes = async () => {
      setIsLoading(true);
      try {
        let loadedNotes: Note[] = [];
        
        // Determine which storage method to use
        if (isAdmin && user && firebaseNotesService) {
          // Use Firebase for admins
          loadedNotes = await firebaseNotesService.getNotes(user.uid);
        } else if (typeof window !== 'undefined') {
          // Use localStorage for non-admins
          loadedNotes = localStorageNotesService.getNotes();
          
          // If localStorage is empty, try to get notes from the file system (for first-time users)
          if (loadedNotes.length === 0) {
            loadedNotes = await loadNotesFromFiles();
            
            // Save to localStorage if we got notes from the file system
            if (loadedNotes.length > 0) {
              localStorage.setItem('notes', JSON.stringify(loadedNotes));
            }
          }
        }
        
        // If we have notes, set them up
        if (loadedNotes.length > 0) {
          setNotes(loadedNotes);
          // Select the first note if one exists
          setSelectedNoteId(loadedNotes[0].id);
        } else {
          // Create a welcome note
          let welcomeNote: Note;
          const welcomeContent = getWelcomeContent();
          
          if (isAdmin && user && firebaseNotesService) {
            // Create in Firebase for admin
            welcomeNote = await firebaseNotesService.addNote(user.uid, "Welcome");
            await firebaseNotesService.updateNoteContent(welcomeNote.id, welcomeContent);
            welcomeNote.content = welcomeContent;
          } else {
            // Create in localStorage for non-admin
            const result = await createEmptyNoteFile("Welcome");
            
            if (result.success) {
              // Save the welcome content for file system (fallback)
              await saveNoteToFile(welcomeContent, 1, "Welcome", "welcome-note");
              
              // Also create it in localStorage
              welcomeNote = localStorageNotesService.addNote("Welcome");
              localStorageNotesService.updateNoteContent(welcomeNote.id, welcomeContent);
              welcomeNote.content = welcomeContent;
              welcomeNote.filePath = result.filePath;
            } else {
              // Fallback if createEmptyNoteFile fails
              welcomeNote = {
                id: 1,
                content: welcomeContent,
                createdAt: new Date(),
                noteTitle: "Welcome",
                filePath: "notes/welcome.md",
                slug: "welcome-note",
              };
            }
          }
          
          setNotes([welcomeNote]);
          setSelectedNoteId(welcomeNote.id);
        }
      } catch (error) {
        console.error("Failed to load notes:", error);
        // Fallback to local storage if Firebase fails
        if (typeof window !== 'undefined') {
          const loadedNotes = localStorageNotesService.getNotes();
          if (loadedNotes.length > 0) {
            setNotes(loadedNotes);
            setSelectedNoteId(loadedNotes[0].id);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeNotes();
  }, [isAdmin, user]);

  const addNote = async (noteTitle: string): Promise<Note> => {
    let newNote: Note;
    
    try {
      if (isAdmin && user) {
        // Use Firebase for admins
        newNote = await firebaseNotesService.addNote(user.uid, noteTitle);
      } else {
        // Use localStorage for non-admins
        newNote = localStorageNotesService.addNote(noteTitle);
        
        // Also create the file for backwards compatibility
        const result = await createEmptyNoteFile(noteTitle);
        if (result.success) {
          newNote.filePath = result.filePath;
        }
      }
      
      // Add to state
      setNotes(prevNotes => [...prevNotes, newNote]);
      setSelectedNoteId(newNote.id);
      
      return newNote;
    } catch (error) {
      console.error("Failed to add note:", error);
      throw new Error("Failed to create note");
    }
  };

  const updateNote = async (id: number, content: string) => {
    // Find the note to update
    const noteToUpdate = notes.find(note => note.id === id);
    
    if (!noteToUpdate) return;
    
    // Update in state first for immediate UI update
    setNotes(prevNotes =>
      prevNotes.map(note => (note.id === id ? { ...note, content } : note))
    );
    
    try {
      if (isAdmin && user) {
        // Use Firebase for admins
        await firebaseNotesService.updateNoteContent(id, content);
      } else {
        // Use localStorage for non-admins
        localStorageNotesService.updateNoteContent(id, content);
        
        // Also update file for backwards compatibility
        await saveNoteToFile(content, id, noteToUpdate.noteTitle, noteToUpdate.slug);
      }
    } catch (error) {
      console.error("Failed to update note content:", error);
    }
  };

  const updateNoteTitle = async (id: number, title: string) => {
    // Find the note to update
    const noteToUpdate = notes.find(note => note.id === id);
    
    if (!noteToUpdate) return;
    
    // Update in state first for immediate UI update
    setNotes(prevNotes =>
      prevNotes.map(note => (note.id === id ? { ...note, noteTitle: title } : note))
    );
    
    try {
      let filePath: string;
      
      if (isAdmin && user) {
        // Use Firebase for admins
        filePath = await firebaseNotesService.updateNoteTitle(id, title);
      } else {
        // Use localStorage for non-admins
        filePath = localStorageNotesService.updateNoteTitle(id, title);
        
        // Also update file for backwards compatibility
        const result = await saveNoteToFile(noteToUpdate.content, id, title, noteToUpdate.slug);
        if (result.success && result.filePath) {
          filePath = result.filePath;
        }
      }
      
      // Update the file path in state
      setNotes(prevNotes =>
        prevNotes.map(note => 
          note.id === id ? { ...note, filePath } : note
        )
      );
    } catch (error) {
      console.error("Failed to update note title:", error);
    }
  };

  const deleteNote = async (id: number) => {
    // First find the note to get its filePath before removing it
    const noteToDelete = notes.find((note) => note.id === id);
    
    if (!noteToDelete) return;

    // Remove from state first for immediate UI update
    setNotes((prevNotes) => prevNotes.filter((note) => note.id !== id));

    if (selectedNoteId === id) {
      // Select the next available note
      const remainingNotes = notes.filter((note) => note.id !== id);
      if (remainingNotes.length > 0) {
        // Find the most recently created note
        const newestNote = [...remainingNotes].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0];
        setSelectedNoteId(newestNote.id);
      } else {
        setSelectedNoteId(null);
      }
    }

    // Delete the note from storage
    try {
      if (isAdmin && user) {
        // Use Firebase for admins
        await firebaseNotesService.deleteNote(id);
      } else {
        // Use localStorage for non-admins
        localStorageNotesService.deleteNote(id);
        
        // Also delete file for backwards compatibility
        if (noteToDelete.filePath) {
          const { deleteNoteFile } = await import("@/app/delete-actions");
          await deleteNoteFile(noteToDelete.filePath);
        }
      }
    } catch (error) {
      console.error("Failed to delete note:", error);
    }
  };

  const selectNote = (id: number | null) => {
    setSelectedNoteId(id);
  };

  return (
    <NoteContext.Provider
      value={{
        notes,
        selectedNoteId,
        setNotes,
        addNote,
        updateNote,
        updateNoteTitle,
        deleteNote,
        selectNote,
      }}
    >
      {children}
    </NoteContext.Provider>
  );
}

export function useNotes() {
  const context = useContext(NoteContext);
  if (context === undefined) {
    throw new Error("useNotes must be used within a NoteProvider");
  }
  return context;
}