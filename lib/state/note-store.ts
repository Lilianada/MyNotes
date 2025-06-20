import { create } from 'zustand'
import { Note, NoteCategory, NoteEditHistory } from '@/types'
import { localStorageNotesService } from '@/lib/storage/local-storage-notes'
import { firebaseNotesService } from '@/lib/firebase/firebase-notes'
import { countWords } from '@/lib/data-processing/title-generator'
import { ConflictResolutionStrategy, ConflictedNote } from '@/components/modals/sync-modal'

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
  setUser: (user: { uid: string } | null | undefined) => void
  
  // Loading state
  isLoading: boolean
  setIsLoading: (isLoading: boolean) => void
  
  // Load notes
  loadNotesFromFirebase: (user: { uid: string }, isAdmin?: boolean) => Promise<void>
  
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
  findSyncConflicts: (user: { uid: string } | null | undefined) => Promise<{ localNoteCount: number, cloudNoteCount: number, conflictedNotes: ConflictedNote[] }>
  resolveNoteConflicts: (user: { uid: string } | null | undefined, isAdmin: boolean, globalStrategy: ConflictResolutionStrategy, manualResolutions?: Record<string, ConflictResolutionStrategy>) => Promise<void>
  
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
  setUser: (user) => {
    const currentUser = get().user;
    const newUser = user;
    
    // User is signing out
    if (currentUser && !newUser) {
      console.log('User signed out, clearing notes');
      set({ 
        user: null, 
        notes: [], // Clear notes from state
        selectedNoteId: null // Clear selected note
      });
      return;
    }
    
    // User is signing in or changing
    if ((currentUser?.uid !== newUser?.uid) && newUser?.uid) {
      console.log('User changed, loading notes from Firebase');
      set({ user: newUser, isLoading: true });
      
      // Load notes from Firebase when user logs in
      get().loadNotesFromFirebase(newUser)
        .then(() => {
          console.log('Successfully loaded notes from Firebase');
        })
        .catch((error) => {
          console.error('Failed to load notes from Firebase:', error);
        });
    } else {
      // Just update the user state without reloading
      set({ user: newUser });
    }
  },
  
  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading }),
  
  // Load notes from Firebase
  loadNotesFromFirebase: async (user, isAdmin = false) => {
    try {
      if (!user || !user.uid) {
        console.error('Cannot load notes: No authenticated user');
        return;
      }
      
      set({ isLoading: true });
      
      // Get notes from Firebase
      const cloudNotes = await firebaseNotesService.getNotes(user.uid, isAdmin);
      
      // Get local notes that don't exist in Firebase
      const localNotes = localStorageNotesService.getNotes();
      const cloudNoteIds = new Set(cloudNotes.map(note => note.id));
      const localOnlyNotes = localNotes.filter(note => !cloudNoteIds.has(note.id));
      
      // Combine cloud and local-only notes
      const combinedNotes = [...cloudNotes, ...localOnlyNotes];
      
      // Update state
      set({ notes: combinedNotes, isLoading: false });
      
      console.log(`Loaded ${cloudNotes.length} notes from Firebase and ${localOnlyNotes.length} local-only notes`);
    } catch (error) {
      console.error('Failed to load notes from Firebase:', error);
      set({ isLoading: false });
    }
  },
  
  // CRUD operations
  addNote: async (noteTitle, user, isAdmin) => {
    try {
      let newNote: Note;
      
      if (user) {
        // For authenticated users, save to Firebase only
        newNote = await firebaseNotesService.addNote(user.uid, noteTitle, isAdmin);
        
        // Don't save to local storage for authenticated users
        // This prevents duplication and ensures data consistency
        // Notes will be loaded from Firebase when needed
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

      // Generate new slug and filePath based on the new title
      const { createSlugFromTitle } = await import('@/lib/firebase/firebase-helpers');
      const newSlug = createSlugFromTitle(title);
      const newFilePath = `notes/${newSlug}`;
      
      if (user) {
        await firebaseNotesService.updateNoteTitle(id, title, user.uid, isAdmin);
      } else {
        localStorageNotesService.updateNoteTitle(id, title);
      }
      
      // Update local state with all the changed properties
      set({
        notes: notes.map(note => 
          note.id === id 
            ? { 
                ...note, 
                noteTitle: title, 
                slug: newSlug,
                filePath: newFilePath,
                updatedAt: new Date() 
              } 
            : note
        )
      });
    } catch (error) {
      console.error("Failed to update note title:", error);
      throw error;
    }
  },
  
  // Main deleteNote implementation
  deleteNote: async (id, user, isAdmin) => {
    // Set loading state
    set({ isLoading: true });
    
    try {
      const { notes } = get();
      const noteToDelete = notes.find(note => note.id === id);
      
      if (!noteToDelete) {
        throw new Error(`Note with ID ${id} not found`);
      }
      
      // If user is authenticated, delete from Firebase
      if (user) {
        // First attempt Firebase deletion
        const deleteResult = await firebaseNotesService.deleteNote(id, user.uid, isAdmin);
        
        if (!deleteResult.success) {
          throw new Error(deleteResult.error || 'Failed to delete note from cloud storage');
        }
        
        // Also delete from local storage to ensure consistency
        localStorageNotesService.deleteNote(id);
      } else {
        // If user is not authenticated, only delete from local storage
        localStorageNotesService.deleteNote(id);
      }
      
      // Update local state only after successful deletion
      set({ notes: notes.filter(note => note.id !== id) });
    } catch (error) {
      console.error("Failed to delete note:", error);
      throw error;
    } finally {
      // Reset loading state
      set({ isLoading: false });
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
  bulkDeleteNotes: async (ids, user, isAdmin) => {
    // Set loading state
    set({ isLoading: true });
    
    const successful: number[] = [];
    const failed: { id: number, error: string }[] = [];
    
    try {
      const { notes } = get();
      
      // Process each note ID
      for (const id of ids) {
        try {
          const noteToDelete = notes.find(note => note.id === id);
          
          if (!noteToDelete) {
            failed.push({ id, error: `Note with ID ${id} not found` });
            continue;
          }
          
          // If user is authenticated, delete from Firebase
          if (user) {
            // First attempt Firebase deletion
            const deleteResult = await firebaseNotesService.deleteNote(id, user.uid, isAdmin);
            
            if (!deleteResult.success) {
              failed.push({ id, error: deleteResult.error || 'Failed to delete note from cloud storage' });
              continue;
            }
            
            // Also delete from local storage to ensure consistency
            localStorageNotesService.deleteNote(id);
          } else {
            // If user is not authenticated, only delete from local storage
            localStorageNotesService.deleteNote(id);
          }
          
          successful.push(id);
        } catch (error) {
          console.error(`Failed to delete note ${id}:`, error);
          failed.push({ 
            id, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }
      
      // Update local state to remove successfully deleted notes
      if (successful.length > 0) {
        const successfulSet = new Set(successful);
        set({ notes: notes.filter(note => !successfulSet.has(note.id)) });
      }
      
      return { successful, failed };
    } catch (error) {
      console.error("Failed during bulk delete operation:", error);
      return { successful, failed: [...failed, ...ids.filter(id => !successful.includes(id)).map(id => ({ 
        id, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }))] };
    } finally {
      // Reset loading state
      set({ isLoading: false });
    }
  },
  getNoteHistory: async () => [],
  // Find conflicts between local and cloud notes
  findSyncConflicts: async (user) => {
    try {
      if (!user || !user.uid) {
        console.error('Cannot find conflicts: No authenticated user');
        return { localNoteCount: 0, cloudNoteCount: 0, conflictedNotes: [] };
      }
      
      console.log('Finding sync conflicts for user:', user.uid);
      
      // Get local notes
      const localNotes = localStorageNotesService.getNotes();
      console.log('Local notes found:', localNotes.length);
      
      // Get cloud notes
      const cloudNotes = await firebaseNotesService.getNotes(user.uid);
      console.log('Cloud notes found:', cloudNotes.length);
      
      // Initialize result
      const conflictedNotes: ConflictedNote[] = [];
      
      // Map cloud notes by ID for faster lookup
      const cloudNotesMap = new Map<number, Note>();
      cloudNotes.forEach(note => {
        cloudNotesMap.set(note.id, note);
      });
      
      // Find local-only notes (not in cloud)
      const localOnlyNotes = localNotes.filter(localNote => !cloudNotesMap.has(localNote.id));
      const localOnlyCount = localOnlyNotes.length;
      
      console.log('Local-only notes that need syncing:', localOnlyCount);
      
      // Find conflicts by comparing local and cloud notes
      for (const localNote of localNotes) {
        const cloudNote = cloudNotesMap.get(localNote.id);
        
        // If note exists in both places, check for conflicts
        if (cloudNote) {
          // Compare updated timestamps to determine which is newer
          const localUpdatedAt = localNote.updatedAt || new Date(0).toISOString();
          const cloudUpdatedAt = cloudNote.updatedAt || new Date(0).toISOString();
          const localIsNewer = new Date(localUpdatedAt) > new Date(cloudUpdatedAt);
          
          // If the timestamps are different, we have a potential conflict
          // We also check content to avoid flagging identical notes
          if (
            localIsNewer && 
            new Date(localUpdatedAt).getTime() !== new Date(cloudUpdatedAt).getTime() && 
            (localNote.content !== cloudNote.content || localNote.noteTitle !== cloudNote.noteTitle)
          ) {
            conflictedNotes.push({
              localNote,
              cloudNote,
              resolution: 'merge' // Default resolution
            });
          }
        }
      }
      
      console.log('Conflicted notes found:', conflictedNotes.length);
      
      // Always return at least 1 for localNoteCount if there are any local notes
      // This ensures the sync modal appears even if there are no direct conflicts
      const result = { 
        localNoteCount: localOnlyCount > 0 ? localOnlyCount : (localNotes.length > 0 ? 1 : 0), 
        cloudNoteCount: cloudNotes.length, 
        conflictedNotes 
      };
      
      console.log('Sync conflict check result:', result);
      return result;
    } catch (error) {
      console.error('Failed to find sync conflicts:', error);
      return { localNoteCount: 0, cloudNoteCount: 0, conflictedNotes: [] };
    }
  },
  
  // Resolve conflicts and sync notes based on user's chosen strategy
  resolveNoteConflicts: async (user, isAdmin, globalStrategy, manualResolutions = {}) => {
    try {
      if (!user || !user.uid) {
        console.error('Cannot resolve conflicts: No authenticated user');
        return;
      }
      
      // Get conflict data
      const { conflictedNotes } = await get().findSyncConflicts(user);
      
      // Process each conflicted note
      for (const conflict of conflictedNotes) {
        const noteId = conflict.localNote.uniqueId || String(conflict.localNote.id);
        const resolution = manualResolutions[noteId] || globalStrategy;
        
        try {
          switch (resolution) {
            case 'local':
              // Keep local version - update cloud note
              await firebaseNotesService.updateNoteData(
                conflict.cloudNote.id,
                {
                  content: conflict.localNote.content,
                  noteTitle: conflict.localNote.noteTitle,
                  tags: conflict.localNote.tags,
                  category: conflict.localNote.category,
                  updatedAt: new Date()
                },
                user.uid,
                isAdmin
              );
              break;
              
            case 'cloud':
              // Keep cloud version - update local note
              localStorageNotesService.updateNoteData(conflict.localNote.id, {
                content: conflict.cloudNote.content,
                noteTitle: conflict.cloudNote.noteTitle,
                tags: conflict.cloudNote.tags,
                category: conflict.cloudNote.category,
                updatedAt: new Date()
              });
              break;
              
            case 'merge':
              // Merge both versions
              const mergedNote = {
                // Prefer the more recent title
                noteTitle: (conflict.localNote.updatedAt || '') > (conflict.cloudNote.updatedAt || '') 
                  ? conflict.localNote.noteTitle 
                  : conflict.cloudNote.noteTitle,
                  
                // Combine content with a separator
                content: `${conflict.localNote.content}\n\n---\n\n${conflict.cloudNote.content}`,
                
                // Combine tags without duplicates
                tags: Array.from(new Set([...(conflict.localNote.tags || []), ...(conflict.cloudNote.tags || [])])),
                
                // Prefer local category if it exists
                category: conflict.localNote.category || conflict.cloudNote.category,
                
                // Use current timestamp
                updatedAt: new Date()
              };
              
              // Update both local and cloud
              await firebaseNotesService.updateNoteData(
                conflict.cloudNote.id,
                mergedNote,
                user.uid,
                isAdmin
              );
              
              localStorageNotesService.updateNoteData(conflict.localNote.id, mergedNote);
              break;
              
            default:
              console.warn(`Unknown resolution strategy: ${resolution}`);
          }
          
          console.log(`Resolved conflict for note "${conflict.localNote.noteTitle}" using ${resolution} strategy`);
        } catch (error) {
          console.error(`Failed to resolve conflict for note "${conflict.localNote.noteTitle}":`, error);
        }
      }
      
      // After resolving conflicts, sync remaining local-only notes
      // Get local notes that don't exist in Firebase
      const localNotes = localStorageNotesService.getNotes();
      const cloudNotes = await firebaseNotesService.getNotes(user.uid);
      
      // Create a map of cloud note IDs for faster lookup
      const cloudNoteIds = new Set<number | string>();
      cloudNotes.forEach(note => cloudNoteIds.add(note.id));
      
      // Find local notes that don't exist in the cloud
      const localOnlyNotes = localNotes.filter(note => !cloudNoteIds.has(note.id));
      
      console.log(`Found ${localOnlyNotes.length} local-only notes to sync`);
      
      // Track successful syncs to update local state
      const syncedNotes: Note[] = [];
      
      // Process each local-only note
      for (const note of localOnlyNotes) {
        try {
          // Create a new note in Firebase
          const firebaseNote = await firebaseNotesService.addNote(user.uid, note.noteTitle, isAdmin);
          
          // Update with full content and metadata
          await firebaseNotesService.updateNoteContent(firebaseNote.id, note.content || '', user.uid, isAdmin);
          
          // Update other properties
          const noteData = {
            tags: note.tags || [],
            category: note.category,
            archived: note.archived || false,
            updatedAt: note.updatedAt || new Date(),
            wordCount: note.wordCount || countWords(note.content || '')
          };
          
          await firebaseNotesService.updateNoteData(firebaseNote.id, noteData, user.uid, isAdmin);
          
          // Add to synced notes list with combined data
          syncedNotes.push({
            ...firebaseNote,
            ...noteData,
            content: note.content || ''
          });
          
          // Remove the local-only note since it's now in Firebase
          localStorageNotesService.deleteNote(note.id);
          
          console.log(`Successfully synced note "${note.noteTitle}" to Firebase`);
        } catch (error) {
          console.error(`Failed to sync note "${note.noteTitle}":`, error);
        }
      }
      
      // Reload all notes from Firebase to ensure we have the latest data
      await get().loadNotesFromFirebase(user, isAdmin);
      
      // Log completion
      console.log('Note synchronization completed successfully');
      
    } catch (error) {
      console.error('Failed to resolve note conflicts:', error);
    }
  },
  
  // Sync function to ensure all local notes are synced to Firebase
  syncLocalNotesToFirebase: async (user, isAdmin) => {
    try {
      if (!user || !user.uid) {
        console.error('Cannot sync notes: No authenticated user');
        return;
      }
      
      const localNotes = localStorageNotesService.getNotes();
      
      // Get existing Firebase notes to avoid duplicates
      const firebaseNotes = await firebaseNotesService.getNotes(user.uid, isAdmin);
      const firebaseNoteIds = new Set(firebaseNotes.map(note => note.id));
      
      // Identify notes that need to be synced (not already in Firebase)
      const notesToSync = localNotes.filter(note => !firebaseNoteIds.has(note.id));
      
      if (notesToSync.length === 0) {
        console.log('No notes to sync to Firebase');
        return;
      }
      
      console.log(`Syncing ${notesToSync.length} notes to Firebase...`);
      
      // Track successful syncs to update local state
      const syncedNotes: Note[] = [];
      
      // Process each note that needs syncing
      for (const note of notesToSync) {
        try {
          // Create a new note in Firebase
          const firebaseNote = await firebaseNotesService.addNote(user.uid, note.noteTitle, isAdmin);
          
          // Update with full content and metadata
          await firebaseNotesService.updateNoteContent(firebaseNote.id, note.content || '', user.uid, isAdmin);
          
          // Update other properties
          const noteData = {
            tags: note.tags || [],
            category: note.category,
            archived: note.archived || false,
            updatedAt: note.updatedAt || new Date(),
            wordCount: note.wordCount || countWords(note.content || '')
          };
          
          await firebaseNotesService.updateNoteData(firebaseNote.id, noteData, user.uid, isAdmin);
          
          // Add to synced notes list with combined data
          syncedNotes.push({
            ...firebaseNote,
            ...noteData,
            content: note.content || ''
          });
          
          // Remove the local-only note since it's now in Firebase
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
          .filter(note => !notesToSync.some(localNote => localNote.id === note.id))
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
  updateNoteTags: async (id, tags, user, isAdmin = false) => {
    try {
      const state = get();
      const noteToUpdate = state.notes.find(note => note.id === id);
      
      if (!noteToUpdate) {
        console.error(`Note with id ${id} not found`);
        return [];
      }
      
      // Limit to 5 tags
      const limitedTags = tags.slice(0, 5);
      
      // Update note in state
      const updatedNotes = state.notes.map(note => 
        note.id === id ? { ...note, tags: limitedTags } : note
      );
      
      set({ notes: updatedNotes });
      
      // Save to appropriate storage
      if (user && user.uid) {
        // Save to Firebase for logged-in users
        await firebaseNotesService.updateNoteData(id, { tags: limitedTags }, user.uid, isAdmin);
      } else {
        // Save to local storage for offline use
        localStorageNotesService.updateNoteData(id, { tags: limitedTags });
      }
      
      return limitedTags;
    } catch (error) {
      console.error('Failed to update note tags:', error);
      return [];
    }
  },
  
  updateTagAcrossNotes: async (oldTag, newTag, user, isAdmin = false) => {
    try {
      const state = get();
      let updatedNotes = [...state.notes];
      
      // Find all notes with the old tag
      const notesToUpdate = state.notes.filter(note => 
        note.tags && note.tags.includes(oldTag)
      );
      
      if (notesToUpdate.length === 0) {
        return;
      }
      
      // Update each note
      for (const note of notesToUpdate) {
        const updatedTags = note.tags?.map(tag => 
          tag === oldTag ? newTag : tag
        ) || [];
        
        // Update note in state
        updatedNotes = updatedNotes.map(n => 
          n.id === note.id ? { ...n, tags: updatedTags } : n
        );
        
        // Save to appropriate storage
        if (user && user.uid) {
          // Save to Firebase for logged-in users
          await firebaseNotesService.updateNoteData(note.id, { tags: updatedTags }, user.uid, isAdmin);
        } else {
          // Save to local storage for offline use
          localStorageNotesService.updateNoteData(note.id, { tags: updatedTags });
        }
      }
      
      set({ notes: updatedNotes });
    } catch (error) {
      console.error('Failed to update tag across notes:', error);
    }
  },
  
  deleteTagFromAllNotes: async (tag, user, isAdmin = false) => {
    try {
      const state = get();
      let updatedNotes = [...state.notes];
      
      // Find all notes with the tag
      const notesToUpdate = state.notes.filter(note => 
        note.tags && note.tags.includes(tag)
      );
      
      if (notesToUpdate.length === 0) {
        return;
      }
      
      // Update each note
      for (const note of notesToUpdate) {
        const updatedTags = note.tags?.filter(t => t !== tag) || [];
        
        // Update note in state
        updatedNotes = updatedNotes.map(n => 
          n.id === note.id ? { ...n, tags: updatedTags } : n
        );
        
        // Save to appropriate storage
        if (user && user.uid) {
          // Save to Firebase for logged-in users
          await firebaseNotesService.updateNoteData(note.id, { tags: updatedTags }, user.uid, isAdmin);
        } else {
          // Save to local storage for offline use
          localStorageNotesService.updateNoteData(note.id, { tags: updatedTags });
        }
      }
      
      set({ notes: updatedNotes });
    } catch (error) {
      console.error('Failed to delete tag from all notes:', error);
    }
  },
  updateNoteData: async (id, updatedNote, user, isAdmin = false) => {
    try {
      // Find the note to update
      const state = get();
      const noteToUpdate = state.notes.find(note => note.id === id);
      
      if (!noteToUpdate) {
        console.error(`Note with id ${id} not found`);
        return;
      }
      
      // Update note in state
      const updatedNotes = state.notes.map(note => 
        note.id === id ? { ...note, ...updatedNote } : note
      );
      
      set({ notes: updatedNotes });
      
      // Save to appropriate storage
      if (user && user.uid) {
        // Save to Firebase for logged-in users
        await firebaseNotesService.updateNoteData(id, updatedNote, user.uid, isAdmin);
      } else {
        // Save to local storage for offline use
        localStorageNotesService.updateNoteData(id, updatedNote);
      }
      
      console.log(`Note ${id} metadata updated successfully`, updatedNote);
    } catch (error) {
      console.error('Failed to update note metadata:', error);
      throw error; // Re-throw to allow handling in UI
    }
  },
}))
