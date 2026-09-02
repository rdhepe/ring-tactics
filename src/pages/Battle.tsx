import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TeamSelect } from '../components/battle/TeamSelect'
import { BattleArena } from '../components/battle/BattleArena'
import { useBattleStore } from '../store/battleStore'
import type { Character } from '../types'
import { ALL_CHARACTERS } from '../data/characters'

type GameMode = 'vs_ai' | 'vs_player' | 'ladder'

const MODES: { id: GameMode; label: string; sub: string; available: boolean }[] = [
  { id: 'vs_ai',     label: 'VS AI',     sub: 'Fight a computer opponent',        available: true },
  { id: 'vs_player', label: 'VS Player', sub: 'Private room — play with a friend', available: true },
  { id: 'ladder',    label: 'Ladder',    sub: 'Auto-match with a random opponent', available: true },
]

function MatchMenu({ onSelect }: { onSelect: (mode: GameMode) => void }) {
  return (
    <div className="arena-page arena-stage min-h-screen bg-px-base text-px-text flex flex-col">
      {/* header */}
      <div className="arena-page-header" style={{ background: '#141726', borderBottom: '4px solid #c42b2b' }}>
        <div className="max-w-6xl mx-auto px-4 py-5">
          <p className="text-px-dim text-[9px] font-bold uppercase tracking-widest mb-1"
             style={{ fontFamily: 'monospace' }}>Slam Arena</p>
          <h1 className="text-2xl font-bold uppercase tracking-widest">Select Match Type</h1>
        </div>
      </div>

      {/* mode cards */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="flex flex-col gap-4 w-full max-w-sm">
          {MODES.map(mode => (
            <button
              key={mode.id}
              disabled={!mode.available}
              onClick={() => mode.available && onSelect(mode.id)}
              className="arena-ticket flex items-center gap-5 px-6 py-5 text-left transition-all hover:brightness-110"
              style={{
                background: mode.available ? '#141726' : '#0f1120',
                border: `2px solid ${mode.available ? '#c42b2b' : '#2e3755'}`,
                borderLeft: `5px solid ${mode.available ? '#c42b2b' : '#2e3755'}`,
                boxShadow: mode.available ? '4px 4px 0 #7a1a0a' : 'none',
                cursor: mode.available ? 'pointer' : 'not-allowed',
                opacity: mode.available ? 1 : 0.45,
              }}
            >
              <div className="flex-1">
                <p className="font-bold text-lg uppercase tracking-widest leading-tight"
                   style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 12,
                            color: mode.available ? '#e2e8ff' : '#4a5578' }}>
                  {mode.label}
                </p>
                <p className="mt-1.5 text-sm" style={{ color: '#6a7a9c' }}>{mode.sub}</p>
              </div>
              <span style={{ fontSize: 20, color: mode.available ? '#c42b2b' : '#2e3755' }}>
                {mode.available ? '▶' : '🔒'}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export function BattlePage() {
  const navigate = useNavigate()
  const { battleState, startBattle, reset } = useBattleStore()
  const [mode, setMode] = useState<GameMode | null>(null)

  function handleSelect(m: GameMode) {
    if (m === 'vs_player') { navigate('/pvp');    return }
    if (m === 'ladder')    { navigate('/ladder'); return }
    setMode(m)
  }

  function handleStart(playerTeam: Character[]) {
    const aiRoster = ALL_CHARACTERS.filter(c => !playerTeam.find(p => p.id === c.id)).slice(0, 3)
    startBattle(playerTeam, aiRoster)
  }

  function handleBack() {
    reset()
    setMode(null)
  }

  if (!mode) return <MatchMenu onSelect={handleSelect} />
  if (!battleState) return <TeamSelect onStart={handleStart} onBack={handleBack} />
  return <BattleArena />
}

