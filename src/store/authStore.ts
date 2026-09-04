import { create } from 'zustand'

export const API = import.meta.env.VITE_API_URL ?? ''

interface AuthStore {
  username: string | null
  email: string | null
  isLoggedIn: boolean
  isLoading: boolean
  initialize: () => Promise<void>
  login: (username: string, email?: string | null) => void
  setEmail: (email: string | null) => void
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set) => ({
  username: null,
  email: null,
  isLoggedIn: false,
  isLoading: true,

  initialize: async () => {
    localStorage.removeItem('slam-arena-auth')
    try {
      const response = await fetch(`${API}/auth/me`, { credentials: 'include' })
      if (!response.ok) throw new Error('No active session')
      const data = await response.json() as { username: string; email: string | null }
      set({ username: data.username, email: data.email, isLoggedIn: true, isLoading: false })
    } catch {
      set({ username: null, email: null, isLoggedIn: false, isLoading: false })
    }
  },

  login: (username, email = null) => set({ username, email, isLoggedIn: true, isLoading: false }),

  setEmail: (email) => set({ email }),

  logout: async () => {
    try {
      await fetch(`${API}/auth/logout`, { method: 'POST', credentials: 'include' })
    } finally {
      set({ username: null, email: null, isLoggedIn: false, isLoading: false })
    }
  },
}))
