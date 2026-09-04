import { create } from 'zustand'
import { API } from './authStore'

interface LaunchStore {
  live: boolean | null
  fetchConfig: () => Promise<void>
}

export const useLaunchStore = create<LaunchStore>((set) => ({
  live: null,

  fetchConfig: async () => {
    try {
      const res = await fetch(`${API}/config`)
      if (!res.ok) throw new Error('config fetch failed')
      const data = await res.json() as { live: boolean }
      set({ live: data.live })
    } catch {
      // If we can't reach the server, default to live so the app degrades to its normal
      // "cannot reach server" error states instead of getting stuck on a blank screen.
      set({ live: true })
    }
  },
}))
