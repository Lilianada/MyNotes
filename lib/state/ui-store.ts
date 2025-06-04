import { create } from 'zustand'

/**
 * UI Store - Manages UI-related state across the application
 * This replaces custom DOM events with a centralized state management approach
 */
interface UIState {
  // Sidebar state
  isSidebarOpen: boolean
  setSidebarOpen: (isOpen: boolean) => void
  toggleSidebar: () => void
  
  // Note creation modal state
  isCreatingNote: boolean
  setCreatingNote: (isCreating: boolean) => void
  
  // No shortcuts modal state needed
  
  // Note selection state
  selectedNoteId: number | null
  selectNote: (id: number | null) => void
}

export const useUIStore = create<UIState>((set) => ({
  // Sidebar state
  isSidebarOpen: false,
  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  
  // Note creation modal state
  isCreatingNote: false,
  setCreatingNote: (isCreating) => set({ isCreatingNote: isCreating }),
  
  // No shortcuts modal state needed
  
  // Note selection state
  selectedNoteId: null,
  selectNote: (id) => set({ selectedNoteId: id }),
}))
