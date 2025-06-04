import { create } from 'zustand'
import { FilterOptions, SortField, SortOrder } from './app-state'

interface SidebarState {
  // Sidebar visibility
  isSidebarOpen: boolean
  setSidebarOpen: (isOpen: boolean) => void
  toggleSidebar: () => void
  
  // Note creation state
  isCreatingNote: boolean
  setCreatingNote: (isCreating: boolean) => void
  
  // Selected note
  selectedNoteId: number | null
  setSelectedNoteId: (id: number | null) => void
  
  // Filter options
  filterOptions: FilterOptions
  setFilterOptions: (options: FilterOptions) => void
  
  // Sort options
  sortBy: SortField
  setSortBy: (field: SortField) => void
  sortOrder: SortOrder
  setSortOrder: (order: SortOrder) => void
  
  // Search
  searchQuery: string
  setSearchQuery: (query: string) => void
}

export const useSidebarStore = create<SidebarState>((set) => ({
  // Default sidebar is closed
  isSidebarOpen: false,
  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  
  // Note creation state
  isCreatingNote: false,
  setCreatingNote: (isCreating) => set({ isCreatingNote: isCreating }),
  
  // No note selected by default
  selectedNoteId: null,
  setSelectedNoteId: (id) => set({ selectedNoteId: id }),
  
  // Default filter options
  filterOptions: {
    archived: false,
  },
  setFilterOptions: (options) => set({ filterOptions: options }),
  
  // Default sort options - newest first
  sortBy: 'updatedAt',
  setSortBy: (field) => set({ sortBy: field }),
  sortOrder: 'desc',
  setSortOrder: (order) => set({ sortOrder: order }),
  
  // Default empty search
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
}))
