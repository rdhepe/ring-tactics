import { create } from 'zustand'

export const API = import.meta.env.VITE_API_URL ?? ''

interface AuthStore {
  username: string | null
  email: string | null
  emailVerified: boolean
  isLoggedIn: boolean
  isLoading: boolean
  initialize: () => Promise<void>
  login: (username: string, email?: string | null, emailVerified?: boolean) => void
  setEmail: (email: string | null) => void
  setEmailVerified: (verified: boolean) => void
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set) => ({
  username: null,
  email: null,
  emailVerified: false,
  isLoggedIn: false,
  isLoading: true,

  initialize: async () => {
    localStorage.removeItem('slam-arena-auth')
    try {
      const response = await fetch(`${API}/auth/me`, { credentials: 'include' })
      if (!response.ok) throw new Error('No active session')
      const data = await response.json() as { username: string; email: string | null; emailVerified: boolean }
      set({ username: data.username, email: data.email, emailVerified: data.emailVerified, isLoggedIn: true, isLoading: false })
    } catch {
      set({ username: null, email: null, emailVerified: false, isLoggedIn: false, isLoading: false })
    }
  },

  login: (username, email = null, emailVerified = false) => set({ username, email, emailVerified, isLoggedIn: true, isLoading: false }),

  setEmail: (email) => set({ email }),

  setEmailVerified: (verified) => set({ emailVerified: verified }),

  logout: async () => {
    try {
      await fetch(`${API}/auth/logout`, { method: 'POST', credentials: 'include' })
    } finally {
      set({ username: null, email: null, emailVerified: false, isLoggedIn: false, isLoading: false })
    }
  },
}))
