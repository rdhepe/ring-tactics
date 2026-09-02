import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface MissionProgress {
  matchesPlayed: number
  wins: number
  quickWins: number
  cleanSweeps: number
  crusherVsPhantomWins: number
  phantomVsSnakeWinStreak: number
  phantomVsSnakeCurrentStreak: number
  beastVsMindWins: number
}

export interface MissionDefinition {
  id: keyof MissionProgress
  name: string
  description: string
  target: number
  badge: string
  category: 'career' | 'rivalry'
}

export const MISSIONS: MissionDefinition[] = [
  { id: 'matchesPlayed', name: 'Opening Bell', description: 'Complete your first match.', target: 1, badge: '01', category: 'career' },
  { id: 'wins', name: 'Number One Contender', description: 'Win 3 matches.', target: 3, badge: '02', category: 'career' },
  { id: 'quickWins', name: 'Squash Match', description: 'Win a match in 5 turns or fewer.', target: 1, badge: '03', category: 'career' },
  { id: 'cleanSweeps', name: 'Untouchable Trio', description: 'Win with all 3 allies still standing.', target: 1, badge: '04', category: 'career' },
  { id: 'matchesPlayed', name: 'Ring Veteran', description: 'Complete 10 matches.', target: 10, badge: '05', category: 'career' },
  { id: 'wins', name: 'Main Event Streak', description: 'Win 10 matches.', target: 10, badge: '06', category: 'career' },
  { id: 'crusherVsPhantomWins', name: 'Crush the Phantom', description: 'Win 5 matches with Big Crusher against Phantom X.', target: 5, badge: 'R1', category: 'rivalry' },
  { id: 'phantomVsSnakeWinStreak', name: 'Outrun the Viper', description: 'Win 3 consecutive matches with Phantom X against Snake Eyes.', target: 3, badge: 'R2', category: 'rivalry' },
  { id: 'beastVsMindWins', name: 'Mind Over Monster', description: 'Win 5 matches with The Beast against The Mind.', target: 5, badge: 'R3', category: 'rivalry' },
]

const EMPTY_PROGRESS: MissionProgress = {
  matchesPlayed: 0,
  wins: 0,
  quickWins: 0,
  cleanSweeps: 0,
  crusherVsPhantomWins: 0,
  phantomVsSnakeWinStreak: 0,
  phantomVsSnakeCurrentStreak: 0,
  beastVsMindWins: 0,
}

interface MissionStore {
  progressByUser: Record<string, MissionProgress>
  recordMatch: (
    username: string,
    result: 'win' | 'loss',
    turns: number,
    survivingAllies: number,
    playerCharacterIds: string[],
    opponentCharacterIds: string[],
  ) => void
}

export const useMissionStore = create<MissionStore>()(
  persist(
    (set) => ({
      progressByUser: {},
      recordMatch: (username, result, turns, survivingAllies, playerCharacterIds, opponentCharacterIds) => set(state => {
        const key = username.toLocaleLowerCase()
        const current = state.progressByUser[key] ?? EMPTY_PROGRESS
        const won = result === 'win'
        const isCrusherVsPhantom = playerCharacterIds.includes('crusher') && opponentCharacterIds.includes('phantom')
        const isPhantomVsSnake = playerCharacterIds.includes('phantom') && opponentCharacterIds.includes('snake')
        const isBeastVsMind = playerCharacterIds.includes('beast') && opponentCharacterIds.includes('themind')
        const nextPhantomVsSnakeStreak = isPhantomVsSnake
          ? (won ? (current.phantomVsSnakeCurrentStreak ?? 0) + 1 : 0)
          : (current.phantomVsSnakeCurrentStreak ?? 0)

        return {
          progressByUser: {
            ...state.progressByUser,
            [key]: {
              matchesPlayed: (current.matchesPlayed ?? 0) + 1,
              wins: (current.wins ?? 0) + (won ? 1 : 0),
              quickWins: (current.quickWins ?? 0) + (won && turns <= 5 ? 1 : 0),
              cleanSweeps: (current.cleanSweeps ?? 0) + (won && survivingAllies === 3 ? 1 : 0),
              crusherVsPhantomWins: (current.crusherVsPhantomWins ?? 0) + (won && isCrusherVsPhantom ? 1 : 0),
              phantomVsSnakeWinStreak: Math.max(current.phantomVsSnakeWinStreak ?? 0, nextPhantomVsSnakeStreak),
              phantomVsSnakeCurrentStreak: nextPhantomVsSnakeStreak,
              beastVsMindWins: (current.beastVsMindWins ?? 0) + (won && isBeastVsMind ? 1 : 0),
            },
          },
        }
      }),
    }),
    { name: 'slam-arena-missions' },
  ),
)

export function getMissionProgress(
  progressByUser: Record<string, MissionProgress>,
  username: string,
): MissionProgress {
  return { ...EMPTY_PROGRESS, ...progressByUser[username.toLocaleLowerCase()] }
}
