import { useEffect, useState } from 'react'
import { API } from '../../store/authStore'

export interface LeaderboardEntry {
  username: string
  wins: number
  losses: number
  matchesPlayed: number
  currentWinStreak: number
  bestWinStreak: number
}

interface LeaderboardData {
  wins: LeaderboardEntry[]
  winStreak: LeaderboardEntry[]
  matchesPlayed: LeaderboardEntry[]
  leastLosses: LeaderboardEntry[]
}

const BOARDS: Array<{
  key: keyof LeaderboardData
  title: string
  subtitle: string
  accent: string
  value: (entry: LeaderboardEntry) => number
  suffix: string
}> = [
  { key: 'wins', title: 'Most Wins', subtitle: 'Career victories', accent: '#ffd166', value: entry => entry.wins, suffix: 'W' },
  { key: 'winStreak', title: 'Best Win Streak', subtitle: 'Longest unbeaten run', accent: '#f45e3f', value: entry => entry.bestWinStreak, suffix: 'STREAK' },
  { key: 'matchesPlayed', title: 'Most Matches', subtitle: 'Total matches played', accent: '#6b9ff5', value: entry => entry.matchesPlayed, suffix: 'MATCHES' },
  { key: 'leastLosses', title: 'Fewest Losses', subtitle: 'Minimum career defeats', accent: '#38d9a9', value: entry => entry.losses, suffix: 'L' },
]

export function LeaderboardGrid({ limit }: { limit: 3 | 10 }) {
  const [data, setData] = useState<LeaderboardData | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    fetch(`${API}/leaderboards`, { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error('Leaderboard request failed')
        return response.json() as Promise<LeaderboardData>
      })
      .then(setData)
      .catch(requestError => {
        if (requestError instanceof Error && requestError.name !== 'AbortError') setError(true)
      })
    return () => controller.abort()
  }, [])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {BOARDS.map(board => {
        const entries = data?.[board.key].slice(0, limit) ?? []
        return (
          <section className="arena-board" key={board.key} style={{ background: '#141726', border: '2px solid #2e3755', borderTop: `4px solid ${board.accent}` }}>
            <header className="px-4 py-3 flex items-end justify-between gap-3"
                    style={{ background: '#0f1120', borderBottom: '2px solid #2e3755' }}>
              <div>
                <h2 className="font-bold uppercase tracking-widest text-sm" style={{ color: board.accent }}>
                  {board.title}
                </h2>
                <p className="text-px-dim mt-1" style={{ fontFamily: 'monospace', fontSize: 9 }}>
                  {board.subtitle}
                </p>
              </div>
              <span style={{ color: '#4a5578', fontFamily: "'Press Start 2P', monospace", fontSize: 8 }}>
                TOP {limit}
              </span>
            </header>

            <div style={{ minHeight: limit === 3 ? 144 : 430 }}>
              {!data && !error && (
                <p className="px-4 py-8 text-center uppercase tracking-widest"
                   style={{ color: '#4a5578', fontFamily: 'monospace', fontSize: 9 }}>Loading...</p>
              )}
              {error && (
                <p className="px-4 py-8 text-center" style={{ color: '#f45e3f', fontFamily: 'monospace', fontSize: 10 }}>
                  Leaderboard server unavailable.
                </p>
              )}
              {data && entries.length === 0 && (
                <p className="px-4 py-8 text-center" style={{ color: '#4a5578', fontFamily: 'monospace', fontSize: 10 }}>
                  Complete a match to enter this board.
                </p>
              )}
              {entries.map((entry, index) => (
                <div key={entry.username} className="flex items-center gap-3 px-4"
                     style={{ minHeight: 46, borderBottom: '1px solid #1d2235', background: index === 0 ? `${board.accent}0a` : 'transparent' }}>
                  <span className="shrink-0 flex items-center justify-center font-bold"
                        style={{ width: 26, height: 26, background: index < 3 ? `${board.accent}22` : '#1d2235', border: `1px solid ${index < 3 ? `${board.accent}66` : '#2e3755'}`, color: index < 3 ? board.accent : '#6a7a9c', fontFamily: "'Press Start 2P', monospace", fontSize: 8 }}>
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-sm">{entry.username}</p>
                    <p style={{ color: '#4a5578', fontFamily: 'monospace', fontSize: 8 }}>
                      {entry.wins}W - {entry.losses}L | Current streak {entry.currentWinStreak}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold" style={{ color: board.accent, fontFamily: "'Press Start 2P', monospace", fontSize: 11 }}>
                      {board.value(entry)}
                    </p>
                    <p style={{ color: '#4a5578', fontFamily: 'monospace', fontSize: 7 }}>{board.suffix}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}