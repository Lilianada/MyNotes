import { create } from 'zustand'
import { Note, NoteCategory, NoteEditHistory } from '@/types'
import { localStorageNotesService } from '@/lib/storage/local-storage-notes'
import { firebaseNotesService } from '@/lib/firebase/firebase-notes'
import { countWords } from '@/lib/data-processing/title-generator'

// Filter options type definition
type FilterOptions = {
  tag?: string;
  category?: string;
  archived?: boolean;
  published?: boolean;
  search?: string;
};

// Sort options type definition
type SortField = 'createdAt' | 'updatedAt' | 'noteTitle' | 'wordCount';
type SortOrder = 'asc' | 'desc';

interface NoteState {
  // Note data
  notes: Note[]
  setNotes: (notes: Note[]) => void
  
  // Selected note
  selectedNoteId: number | string | null
  
  // User data
  user: { uid: string } | null | undefined
  
  // Loading state
  isLoading: boolean
  setIsLoading: (isLoading: boolean) => void
  
  // CRUD operations
  addNote: (noteTitle: string, user?: { uid: string } | null, isAdmin?: boolean) => Promise<Note>
  updateNote: (id: number, content: string, user?: { uid: string } | null, isAdmin?: boolean) => Promise<void>
  updateNoteTitle: (id: number, title: string, user?: { uid: string } | null, isAdmin?: boolean) => Promise<void>
  deleteNote: (id: number, user?: { uid: string } | null, isAdmin?: boolean) => Promise<void>
  
  // Filtering and sorting
  filterNotes: (notes: Note[], options: FilterOptions) => Note[]
  sortNotes: (notes: Note[], sortBy: SortField, sortOrder: SortOrder) => Note[]
  searchNotes: (query: string) => Note[]
  selectNote: (id: number | string) => void
  
  // Category operations
  updateNoteCategory: (id: number, category: NoteCategory | null, user: { uid: string } | null | undefined, isAdmin: boolean) => Promise<void>
  updateCategory: (category: NoteCategory, user: { uid: string } | null | undefined, isAdmin: boolean) => Promise<void>
  deleteCategory: (categoryId: string, user: { uid: string } | null | undefined, isAdmin: boolean) => Promise<void>
  
  // Archiving
  archiveNote: (id: number, archived: boolean, user: { uid: string } | null | undefined, isAdmin: boolean) => Promise<void>
  
  // Bulk operations
  bulkDeleteNotes: (ids: number[], user: { uid: string } | null | undefined, isAdmin: boolean) => Promise<{ successful: number[], failed: { id: number, error: string }[] }>
  
  // History
  getNoteHistory: (id: number, user: { uid: string } | null | undefined, isAdmin: boolean) => Promise<NoteEditHistory[]>
  
  // Sync
  syncLocalNotesToFirebase: (user: { uid: string } | null | undefined, isAdmin: boolean) => Promise<void>
  
  // Relationships
  getChildNotes: (parentId: number) => Note[]
  getLinkedNotes: (noteId: number) => Note[]
  updateNoteParent: (id: number, parentId: number | null, user: { uid: string } | null | undefined, isAdmin: boolean) => Promise<void>
  updateNoteLinks: (id: number, linkedNoteIds: number[], user: { uid: string } | null | undefined, isAdmin: boolean) => Promise<void>
  
  // Tags
  updateNoteTags: (id: number, tags: string[], user: { uid: string } | null | undefined, isAdmin: boolean) => Promise<string[]>
  updateTagAcrossNotes: (oldTag: string, newTag: string, user: { uid: string } | null | undefined, isAdmin: boolean) => Promise<void>
  deleteTagFromAllNotes: (tag: string, user: { uid: string } | null | undefined, isAdmin: boolean) => Promise<void>
  
  // General note data updates
  updateNoteData: (id: number, updatedNote: Partial<Note>, user: { uid: string } | null | undefined, isAdmin: boolean) => Promise<void>
}

// Function to initialize notes from local storage
const initializeNotesFromStorage = () => {
  try {
    if (typeof window !== 'undefined') {
      // Load notes from local storage
      const localNotes = localStorageNotesService.getNotes();
      return localNotes;
    }
  } catch (error) {
    console.error('Failed to initialize notes from local storage:', error);
  }
  return [];
};

export const useNoteStore = create<NoteState>((set, get) => ({
  notes: initializeNotesFromStorage(),
  setNotes: (notes) => set({ notes }),
  
  // Initialize required properties
  selectedNoteId: null,
  user: null,
  
  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading }),
  
  // CRUD operations
  addNote: async (noteTitle, user, isAdmin) => {
    try {
      let newNote: Note;
      
      if (user) {
        // For authenticated users, save to Firebase
        newNote = await firebaseNotesService.addNote(user.uid, noteTitle, isAdmin);
        
        // Also save to local storage as a backup/cache
        try {
          // Just save the note data directly to local storage as a cache
          const localNotes = localStorageNotesService.getNotes();
          localNotes.push(newNote);
          window.localStorage.setItem('notes', JSON.stringify(localNotes));
        } catch (localError) {
          console.warn("Failed to cache note in local storage:", localError);
        }
      } else {
        // For offline users, save to local storage
        newNote = localStorageNotesService.addNote(noteTitle);
        
        // Verify the note was actually saved to local storage
        const savedNotes = localStorageNotesService.getNotes();
        const savedNote = savedNotes.find(note => note.id === newNote.id);
        
        if (!savedNote) {
          console.error("Note was not properly saved to local storage");
          // Force save again
          localStorageNotesService.updateNoteData(newNote.id, newNote);
        }
      }
      
      // Update the state with the new note
      set((state) => ({ notes: [...state.notes, newNote] }));
      return newNote;
    } catch (error) {
      console.error("Failed to add note:", error);
      throw error;
    }
  },
  
  updateNote: async (id, content, user, isAdmin) => {
    try {
      // Update note in state first for immediate UI feedback
      const { notes } = get();
      
      // Find the note to update
      const noteToUpdate = notes.find(note => note.id === id);
      if (!noteToUpdate) {
        throw new Error(`Note with id ${id} not found`);
      }
      
      // Create updated note with new timestamp
      const updatedNote = { 
        ...noteToUpdate, 
        content, 
        updatedAt: new Date() 
      };
      
      // Remove the note from the array and add it to the beginning
      const filteredNotes = notes.filter(note => note.id !== id);
      const updatedNotes = [updatedNote, ...filteredNotes];
      
      set({ notes: updatedNotes });
      
      // Then persist to storage
      if (user?.uid) {
        // User is authenticated, save to Firebase
        await firebaseNotesService.updateNoteContent(id, content, user.uid, isAdmin);
      } else {
        // User is not authenticated, save to local storage
        localStorageNotesService.updateNoteContent(id, content);
      }
    } catch (error) {
      console.error('Failed to update note:', error);
      // Revert state on error
      const { notes } = get();
      set({ notes: [...notes] });
      throw error;
    }
  },
  
  updateNoteTitle: async (id, title, user, isAdmin) => {
    try {
      const { notes } = get();
      const noteToUpdate = notes.find(note => note.id === id);
      
      if (!noteToUpdate) {
        throw new Error(`Note with ID ${id} not found`);
      }
      
      if (user) {
        await firebaseNotesService.updateNoteTitle(id, title, user.uid, isAdmin);
      } else {
        localStorageNotesService.updateNoteTitle(id, title);
      }
      
      // Update local state
      set({
        notes: notes.map(note => 
          note.id === id 
            ? { ...note, noteTitle: title, updatedAt: new Date() } 
            : note
        )
      });
    } catch (error) {
      console.error("Failed to update note title:", error);
      throw error;
    }
  },
  
  deleteNote: async (id, user, isAdmin) => {
    try {
      const { notes } = get();
      const noteToDelete = notes.find(note => note.id === id);
      
      if (!noteToDelete) {
        throw new Error(`Note with ID ${id} not found`);
      }
      
      if (user) {
        await firebaseNotesService.deleteNote(id, user.uid, isAdmin);
      } else {
        localStorageNotesService.deleteNote(id);
      }
      
      // Update local state
      set({ notes: notes.filter(note => note.id !== id) });
    } catch (error) {
      console.error("Failed to delete note:", error);
      throw error;
    }
  },
  
  // Filtering and sorting functions
  filterNotes: (notesToFilter, options) => {
    let filteredNotes = [...notesToFilter];
    
    // Filter by tag
    if (options.tag) {
      filteredNotes = filteredNotes.filter(note => 
        note.tags && note.tags.includes(options.tag!)
      );
    }
    
    // Filter by category
    if (options.category) {
      filteredNotes = filteredNotes.filter(note => 
        note.category && note.category.id === options.category
      );
    }
    
    // Filter by archive status
    if (options.archived !== undefined) {
      filteredNotes = filteredNotes.filter(note => 
        note.archived === options.archived
      );
    }
    
    // Filter by published status
    if (options.published !== undefined) {
      filteredNotes = filteredNotes.filter(note => 
        (note as any).published === options.published
      );
    }
    
    // Filter by search term
    if (options.search) {
      const searchTerm = options.search.toLowerCase();
      filteredNotes = filteredNotes.filter(note => 
        note.noteTitle.toLowerCase().includes(searchTerm) ||
        note.content.toLowerCase().includes(searchTerm)
      );
    }
    
    return filteredNotes;
  },
  
  sortNotes: (notesToSort, sortBy, sortOrder) => {
    return [...notesToSort].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'noteTitle':
          comparison = a.noteTitle.localeCompare(b.noteTitle);
          break;
        case 'createdAt':
          comparison = (new Date(a.createdAt || new Date())).getTime() - (new Date(b.createdAt || new Date())).getTime();
          break;
        case 'updatedAt':
          comparison = (new Date(a.updatedAt || new Date())).getTime() - (new Date(b.updatedAt || new Date())).getTime();
          break;
        case 'wordCount':
          comparison = (a.wordCount || 0) - (b.wordCount || 0);
          break;
        default:
          comparison = (new Date(b.updatedAt || new Date())).getTime() - (new Date(a.updatedAt || new Date())).getTime();
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  },
  
  searchNotes: (query) => {
    const { notes } = get();
    if (!query.trim()) return notes;
    
    const searchTerm = query.toLowerCase();
    return notes.filter(note => 
      note.noteTitle.toLowerCase().includes(searchTerm) ||
      note.content.toLowerCase().includes(searchTerm)
    );
  },
  
  // Select a note by ID with optimized loading
  selectNote: (id: number | string) => {
    // First update the selected note ID immediately for UI responsiveness
    set({ selectedNoteId: id })
    
    // Then ensure the note content is fully loaded
    const state = get()
    const selectedNote = state.notes.find(note => note.id === id)
    
    if (selectedNote) {
      // If the note content is empty or minimal, try to fetch full content
      // This helps with notes that might have been partially loaded
      if (!selectedNote.content || selectedNote.content.length < 100) {
        try {
          // For Firebase notes
          if (state.user) {
            firebaseNotesService.getNotes(state.user.uid)
              .then((notes: Note[]) => {
                const fullNote = notes.find(note => note.id === id)
                if (fullNote && fullNote.content !== selectedNote.content) {
                  // Update the note in the store with full content
                  const updatedNotes = state.notes.map(note => 
                    note.id === id ? { ...note, content: fullNote.content } : note
                  )
                  set({ notes: updatedNotes })
                }
              })
              .catch((err: Error) => {
                console.error('Error pre-fetching full note content from Firebase:', err)
              })
          } 
          // For local storage notes
          else {
            const localNotes = localStorageNotesService.getNotes()
            const fullNote = localNotes.find(note => note.id === id)
            if (fullNote && fullNote.content !== selectedNote.content) {
              // Update the note in the store with full content
              const updatedNotes = state.notes.map(note => 
                note.id === id ? { ...note, content: fullNote.content } : note
              )
              set({ notes: updatedNotes })
            }
          }
        } catch (err) {
          console.error('Error pre-fetching full note content:', err)
        }
      }
    }
  },
  
  // Relationships
  getChildNotes: (parentId) => {
    const { notes } = get();
    return notes.filter(note => note.parentId === parentId);
  },
  
  getLinkedNotes: (noteId) => {
    const { notes } = get();
    return notes.filter(note => note.linkedNoteIds?.includes(noteId));
  },
  
  // Placeholder implementations for remaining methods
  // Category operations
  updateNoteCategory: async (id, category, user, isAdmin = false) => {
    try {
      // Update note in state first for immediate UI feedback
      const { notes } = get();
      const updatedNotes = notes.map(note => {
        if (note.id === id) {
          return { ...note, category, updatedAt: new Date() };
        }
        return note;
      });
      
      // Move the updated note to the top
      const updatedNote = updatedNotes.find(note => note.id === id);
      if (updatedNote) {
        const filteredNotes = updatedNotes.filter(note => note.id !== id);
        set({ notes: [updatedNote, ...filteredNotes] });
      } else {
        set({ notes: updatedNotes });
      }
      
      // Then persist to storage
      if (user?.uid) {
        // User is authenticated, save to Firebase
        await firebaseNotesService.updateNoteCategory(id, category, user.uid, isAdmin);
      } else {
        // User is not authenticated, save to local storage
        localStorageNotesService.updateNoteCategory(id, category);
      }
    } catch (error) {
      console.error('Failed to update note category:', error);
      throw error;
    }
  },
  
  updateCategory: async (category, user, isAdmin = false) => {
    try {
      // Update category in all notes that use it
      const { notes } = get();
      const updatedNotes = notes.map(note => {
        if (note.category?.id === category.id) {
          return { ...note, category, updatedAt: new Date() };
        }
        return note;
      });
      
      set({ notes: updatedNotes });
      
      // Then persist to storage
      if (user?.uid) {
        // User is authenticated, save to Firebase
        await firebaseNotesService.updateCategory(category, user.uid, isAdmin);
      } else {
        // User is not authenticated, save to local storage
        localStorageNotesService.updateCategory(category);
      }
    } catch (error) {
      console.error('Failed to update category:', error);
      throw error;
    }
  },
  
  deleteCategory: async (categoryId, user, isAdmin = false) => {
    try {
      // Remove category from all notes that use it
      const { notes } = get();
      const updatedNotes = notes.map(note => {
        if (note.category?.id === categoryId) {
          return { ...note, category: null, updatedAt: new Date() };
        }
        return note;
      });
      
      set({ notes: updatedNotes });
      
      // Then delete the category from storage
      if (user?.uid) {
        // User is authenticated, delete from Firebase
        await firebaseNotesService.deleteCategory(categoryId, user.uid, isAdmin);
      } else {
        // User is not authenticated, delete from local storage
        localStorageNotesService.deleteCategory(categoryId);
      }
    } catch (error) {
      console.error('Failed to delete category:', error);
      throw error;
    }
  },
  archiveNote: async (id, archived = true, user, isAdmin = false) => {
    try {
      // Update note in state first for immediate UI feedback
      const { notes } = get();
      const updatedNotes = notes.map(note => {
        if (note.id === id) {
          return { ...note, archived, updatedAt: new Date() };
        }
        return note;
      });
      
      set({ notes: updatedNotes });
      
      // Then persist to storage
      if (user?.uid) {
        // User is authenticated, save to Firebase
        await firebaseNotesService.updateNoteData(id, { archived }, user.uid, isAdmin);
      } else {
        // User is not authenticated, save to local storage
        localStorageNotesService.updateNoteData(id, { archived });
      }
    } catch (error) {
      console.error('Failed to archive note:', error);
      throw error;
    }
  },
  bulkDeleteNotes: async () => ({ successful: [], failed: [] }),
  getNoteHistory: async () => [],
  syncLocalNotesToFirebase: async (user, isAdmin) => {
    try {
      if (!user || !user.uid) {
        console.error('Cannot sync notes: No authenticated user');
        return;
      }
      
      const { notes } = get();
      const localNotes = localStorageNotesService.getNotes();
      
      // Identify offline notes by checking if they were created locally
      // We'll use a simple heuristic: if a note doesn't have a Firebase ID format
      // or has a numeric ID (local storage uses numeric IDs), it's likely an offline note
      const offlineNotes = localNotes.filter(note => {
        // Local notes typically have numeric IDs
        return typeof note.id === 'number' && 
               // And they don't have any Firebase-specific properties
               !note.hasOwnProperty('firebaseId');
      });
      
      if (offlineNotes.length === 0) {
        console.log('No offline notes to sync');
        return;
      }
      
      console.log(`Syncing ${offlineNotes.length} offline notes to Firebase...`);
      
      // Track successful syncs to update local state
      const syncedNotes: Note[] = [];
      
      // Process each offline note
      for (const note of offlineNotes) {
        try {
          // First, add the note to Firebase
          const firebaseNote = await firebaseNotesService.addNote(user.uid, note.noteTitle, isAdmin);
          
          // Then update its content if needed
          if (note.content) {
            await firebaseNotesService.updateNoteContent(firebaseNote.id, note.content, user.uid, isAdmin);
          }
          
          // Update other properties if needed
          if (note.tags?.length || note.category || note.archived) {
            await firebaseNotesService.updateNoteData(firebaseNote.id, {
              tags: note.tags || [],
              category: note.category,
              archived: note.archived
            }, user.uid, isAdmin);
          }
          
          // Add to synced notes list
          syncedNotes.push({
            ...firebaseNote,
            content: note.content,
            tags: note.tags,
            category: note.category,
            archived: note.archived
          });
          
          // Remove the local note
          localStorageNotesService.deleteNote(note.id);
          
          console.log(`Successfully synced note "${note.noteTitle}" to Firebase`);
        } catch (error) {
          console.error(`Failed to sync note "${note.noteTitle}":`, error);
        }
      }
      
      // Update the notes state with the synced notes
      if (syncedNotes.length > 0) {
        const currentNotes = get().notes;
        const updatedNotes = currentNotes
          .filter(note => !offlineNotes.some(offlineNote => offlineNote.id === note.id))
          .concat(syncedNotes);
          
        set({ notes: updatedNotes });
        console.log(`Synced ${syncedNotes.length} notes to Firebase`);
      }
    } catch (error) {
      console.error('Failed to sync notes to Firebase:', error);
    }
  },
  updateNoteParent: async () => {},
  updateNoteLinks: async () => {},
  updateNoteTags: async () => [],
  updateTagAcrossNotes: async () => {},
  deleteTagFromAllNotes: async () => {},
  updateNoteData: async () => {},
}))
