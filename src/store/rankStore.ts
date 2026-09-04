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

/** Coins awarded for winning a ladder match. */
export const COINS_PER_LADDER_WIN = 50

// ─── Store ────────────────────────────────────────────────────────────────────

export interface MatchRecord {
  result:    'win' | 'loss'
  xpGained:  number
  turns:     number
  timestamp: number
}

interface RankStore {
  xp:       number
  coins:    number
  diamonds: number
  wins:     number
  losses:   number
  history:  MatchRecord[]
  /** Only ladder matches should call this — it grants XP/rank progress and, on a win, coins. */
  addMatch: (result: 'win' | 'loss', turns: number, survivingAllies: number) => { xp: number; coins: number }
  /** Placeholder for real-money diamond purchases — payment integration TBD. */
  buyDiamonds: (amount: number) => void
  reset:       () => void
}

export const useRankStore = create<RankStore>()(
  persist(
    (set) => ({
      xp:       0,
      coins:    0,
      diamonds: 0,
      wins:     0,
      losses:   0,
      history:  [],

      addMatch: (result, turns, survivingAllies) => {
        const gained = calcXp(result, turns, survivingAllies)
        const coinsGained = result === 'win' ? COINS_PER_LADDER_WIN : 0
        set(s => ({
          xp:      s.xp + gained,
          coins:   s.coins + coinsGained,
          wins:    result === 'win' ? s.wins + 1 : s.wins,
          losses:  result === 'loss' ? s.losses + 1 : s.losses,
          history: [{ result, xpGained: gained, turns, timestamp: Date.now() },
                    ...s.history].slice(0, 30),
        }))
        return { xp: gained, coins: coinsGained }
      },

      buyDiamonds: (amount) => set(s => ({ diamonds: s.diamonds + amount })),

      reset: () => set({ xp: 0, coins: 0, diamonds: 0, wins: 0, losses: 0, history: [] }),
    }),
    { name: 'slam-arena-rank' }
  )
)
