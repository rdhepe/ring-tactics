import { create } from 'zustand'

export const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

interface AuthStore {
  username: string | null
  isLoggedIn: boolean
  isLoading: boolean
  initialize: () => Promise<void>
  login: (username: string) => void
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set) => ({
  username: null,
  isLoggedIn: false,
  isLoading: true,

  initialize: async () => {
    localStorage.removeItem('slam-arena-auth')
    try {
      const response = await fetch(`${API}/auth/me`, { credentials: 'include' })
      if (!response.ok) throw new Error('No active session')
      const data = await response.json() as { username: string }
      set({ username: data.username, isLoggedIn: true, isLoading: false })
    } catch {
      set({ username: null, isLoggedIn: false, isLoading: false })
    }
  },

  login: (username) => set({ username, isLoggedIn: true, isLoading: false }),

  logout: async () => {
    try {
      await fetch(`${API}/auth/logout`, { method: 'POST', credentials: 'include' })
    } finally {
      set({ username: null, isLoggedIn: false, isLoading: false })
    }
  },
}))
