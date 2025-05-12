"use client";

import { createContext, useState, useContext, useEffect, ReactNode } from "react";
import { Note } from "@/types";
import { loadNotesFromFiles } from "@/lib/note-loader";
import { saveNoteToFile, createEmptyNoteFile } from "@/app/actions";

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

export function NoteProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);

  useEffect(() => {
    const initializeNotes = async () => {
      try {
        // Load notes from the file system
        const loadedNotes = await loadNotesFromFiles();
        
        if (loadedNotes.length > 0) {
          setNotes(loadedNotes);
          // Select the first note if one exists
          setSelectedNoteId(loadedNotes[0].id);
        } else {
          // If no notes exist, create a welcome note
          const result = await createEmptyNoteFile("Welcome");
          
          if (result.success) {
            const welcomeContent = "# Welcome to Lily's Notes\n\nStart typing to create your first note.";
            
            // Save the welcome content
            await saveNoteToFile(welcomeContent, 1, "Welcome");
            
            const welcomeNote: Note = {
              id: 1,
              content: welcomeContent,
              createdAt: new Date(),
              noteTitle: "Welcome",
              filePath: result.filePath
            };
            
            setNotes([welcomeNote]);
            setSelectedNoteId(welcomeNote.id);
          }
        }
      } catch (error) {
        console.error("Failed to load notes:", error);
      }
    };

    initializeNotes();
  }, []);

  const addNote = async (noteTitle: string): Promise<Note> => {
    const nextId = notes.length > 0 
      ? Math.max(...notes.map(note => note.id)) + 1
      : 1;
      
    // Create an empty file first
    const result = await createEmptyNoteFile(noteTitle);
    
    if (!result.success) {
      throw new Error("Failed to create note file");
    }
    
    // Create a new note object
    const newNote: Note = {
      id: nextId,
      content: "",
      createdAt: new Date(),
      noteTitle,
      filePath: result.filePath
    };
    
    // Add to state
    setNotes(prevNotes => [...prevNotes, newNote]);
    setSelectedNoteId(newNote.id);
    
    return newNote;
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
      // Then save to the file system
      await saveNoteToFile(content, id, noteToUpdate.noteTitle);
    } catch (error) {
      console.error("Failed to save note to file:", error);
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
      // Then save with the new title to create a new file
      const result = await saveNoteToFile(noteToUpdate.content, id, title);
      
      // Update the file path in state if successful
      if (result.success) {
        setNotes(prevNotes =>
          prevNotes.map(note => 
            note.id === id ? { ...note, filePath: result.filePath } : note
          )
        );
        
        // TODO: Delete the old file if we want to implement that
      }
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

    // Now handle the actual file deletion on the server
    try {
      // Import the deleteNoteFile dynamically to avoid issues with "use server" directive
      const { deleteNoteFile } = await import("@/app/delete-actions");
      if (noteToDelete.filePath) {
        await deleteNoteFile(noteToDelete.filePath);
      }
    } catch (error) {
      console.error("Failed to delete note file:", error);
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