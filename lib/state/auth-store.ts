import { create } from 'zustand'

interface User {
  uid: string
  email: string
  displayName?: string
  photoURL?: string
}

interface AuthState {
  user: User | null
  isAdmin: boolean
  isAuthenticated: boolean
  authLoading: boolean
  
  signIn: (email: string, password: string) => Promise<User>
  signOut: () => Promise<void>
  createAccount: (email: string, password: string, displayName?: string) => Promise<User>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAdmin: false,
  isAuthenticated: false,
  authLoading: true,
  
  signIn: async (email, password) => {
    try {
      set({ authLoading: true })
      // This would typically call Firebase auth
      // For now, just simulate a successful login
      const user = { uid: '123', email }
      set({ 
        user, 
        isAuthenticated: true, 
        isAdmin: email.includes('admin'),
        authLoading: false 
      })
      return user
    } catch (error) {
      set({ authLoading: false })
      throw error
    }
  },
  
  signOut: async () => {
    try {
      set({ authLoading: true })
      // This would typically call Firebase auth signOut
      set({ 
        user: null, 
        isAuthenticated: false, 
        isAdmin: false,
        authLoading: false 
      })
    } catch (error) {
      set({ authLoading: false })
      throw error
    }
  },
  
  createAccount: async (email, password, displayName) => {
    try {
      set({ authLoading: true })
      // This would typically call Firebase auth createUser
      const user = { 
        uid: Math.random().toString(36).substring(2, 15), 
        email,
        displayName
      }
      set({ 
        user, 
        isAuthenticated: true, 
        isAdmin: false,
        authLoading: false 
      })
      return user
    } catch (error) {
      set({ authLoading: false })
      throw error
    }
  }
}))
