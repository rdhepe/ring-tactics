import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface GuestMatchProgress {
  result: 'win' | 'loss'
  turns: number
  survivingAllies: number
  playerCharacterIds: string[]
  opponentCharacterIds: string[]
}

interface GuestTrialStore {
  usedMatch: boolean
  pendingProgress: GuestMatchProgress | null
  completeMatch: (progress: GuestMatchProgress) => void
  clearPendingProgress: () => void
  resetGuestTrial: () => void
}

export const useGuestTrialStore = create<GuestTrialStore>()(
  persist(
    (set) => ({
      usedMatch: false,
      pendingProgress: null,
      completeMatch: (progress) => set({ usedMatch: true, pendingProgress: progress }),
      clearPendingProgress: () => set({ pendingProgress: null }),
      resetGuestTrial: () => set({ usedMatch: false, pendingProgress: null }),
    }),
    { name: 'slam-arena-guest-trial' },
  ),
)