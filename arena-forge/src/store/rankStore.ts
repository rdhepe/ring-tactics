import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ─── Rank definitions ─────────────────────────────────────────────────────────

export const RANKS = [
  { name: 'Green Horn',      minXp: 0,    color: '#6a7a9c', badge: '①' },
  { name: 'Jobber',          minXp: 150,  color: '#8892b8', badge: '②' },
  { name: 'Enhancement',     minXp: 400,  color: '#38d9a9', badge: '③' },
  { name: 'Mid-Carder',      minXp: 800,  color: '#6b9ff5', badge: '④' },
  { name: 'Main Eventer',    minXp: 1400, color: '#ffd166', badge: '⑤' },
  { name: 'Title Contender', minXp: 2200, color: '#f4a83f', badge: '⑥' },
  { name: 'Champion',        minXp: 3200, color: '#f45e3f', badge: '⑦' },
  { name: 'World Champ',     minXp: 4500, color: '#c42b2b', badge: '⑧' },
  { name: 'Hall of Famer',   minXp: 6000, color: '#ffd166', badge: '⑨' },
  { name: 'Legend',          minXp: 8000, color: '#fff',    badge: '★' },
] as const

export type RankName = typeof RANKS[number]['name']

export function getRankInfo(xp: number) {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (xp >= RANKS[i].minXp) {
      const next = RANKS[i + 1] ?? null
      const xpInRank  = xp - RANKS[i].minXp
      const xpNeeded  = next ? next.minXp - RANKS[i].minXp : 0
      const pct       = next ? Math.min(100, (xpInRank / xpNeeded) * 100) : 100
      return { rank: RANKS[i], index: i, next, xpInRank, xpNeeded, pct }
    }
  }
  return { rank: RANKS[0], index: 0, next: RANKS[1], xpInRank: 0, xpNeeded: RANKS[1].minXp, pct: 0 }
}

/** XP formula: base + per-surviving-ally bonus + speed bonus */
export function calcXp(result: 'win' | 'loss', turns: number, survivingAllies: number): number {
  let xp = result === 'win' ? 75 : 15
  xp += survivingAllies * 10
  if (result === 'win' && turns <= 5) xp += 25   // dominant win
  return xp
}

// ─── Store ────────────────────────────────────────────────────────────────────

export interface MatchRecord {
  result:    'win' | 'loss'
  xpGained:  number
  turns:     number
  timestamp: number
}

interface RankStore {
  xp:      number
  wins:    number
  losses:  number
  history: MatchRecord[]
  addMatch: (result: 'win' | 'loss', turns: number, survivingAllies: number) => number
  reset:    () => void
}

export const useRankStore = create<RankStore>()(
  persist(
    (set) => ({
      xp:      0,
      wins:    0,
      losses:  0,
      history: [],

      addMatch: (result, turns, survivingAllies) => {
        const gained = calcXp(result, turns, survivingAllies)
        set(s => ({
          xp:      s.xp + gained,
          wins:    result === 'win' ? s.wins + 1 : s.wins,
          losses:  result === 'loss' ? s.losses + 1 : s.losses,
          history: [{ result, xpGained: gained, turns, timestamp: Date.now() },
                    ...s.history].slice(0, 30),
        }))
        return gained
      },

      reset: () => set({ xp: 0, wins: 0, losses: 0, history: [] }),
    }),
    { name: 'slam-arena-rank' }
  )
)
