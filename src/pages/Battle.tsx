import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { TeamSelect } from '../components/battle/TeamSelect'
import { BattleArena } from '../components/battle/BattleArena'
import { useBattleStore } from '../store/battleStore'
import { useAuthStore } from '../store/authStore'
import { useGuestTrialStore } from '../store/guestTrialStore'
import type { Character } from '../types'
import { ALL_CHARACTERS } from '../data/characters'

type GameMode = 'vs_ai' | 'vs_player' | 'ladder'

const MODES: { id: GameMode; label: string; sub: string; available: boolean }[] = [
  { id: 'vs_ai',     label: 'VS AI',     sub: 'Fight a computer opponent',        available: true },
  { id: 'vs_player', label: 'VS Player', sub: 'Private room — play with a friend', available: true },
  { id: 'ladder',    label: 'Ranked Match', sub: 'Auto-match with a random opponent', available: true },
]

function SaveProgressPrompt({ compact = false }: { compact?: boolean }) {
  return (
    <div className="arena-panel arena-panel-yellow flex flex-col items-center gap-4 text-center px-7 py-7"
         style={{ width: compact ? '100%' : 390, maxWidth: '100%', background: '#141726', border: '2px solid #ffd16666', boxShadow: '0 8px 40px rgba(0,0,0,.75)' }}>
      <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: '#ffd166' }}>SAVE YOUR PROGRESS</p>
      <p style={{ fontFamily: 'monospace', fontSize: 12, color: '#c8cfe8', lineHeight: 1.6 }}>
        Guests get one VS AI match. Create an account now to keep this result and unlock the full arena.
      </p>
      <Link to="/login" state={{ from: { pathname: '/battle' }, mode: 'register', saveGuestProgress: true }}
            className="px-5 py-2 font-bold text-xs uppercase tracking-widest hover:brightness-110"
            style={{ background: '#c42b2b', color: '#fff', boxShadow: '3px 3px 0 #7a1a0a', fontFamily: "'Press Start 2P', monospace", fontSize: 8 }}>
        Create Account
      </Link>
      <Link to="/login" state={{ from: { pathname: '/battle' }, saveGuestProgress: true }}
            style={{ color: '#8892b8', fontFamily: 'monospace', fontSize: 10, textDecoration: 'underline' }}>
        I already have an account
      </Link>
    </div>
  )
}

function GuestTrialUsed() {
  return (
    <div className="arena-page arena-stage min-h-screen bg-px-base text-px-text flex items-center justify-center px-4">
      <SaveProgressPrompt />
    </div>
  )
}

function MatchMenu({ onSelect, isGuest, guestMatchUsed }: { onSelect: (mode: GameMode) => void; isGuest: boolean; guestMatchUsed: boolean }) {
  return (
    <div className="arena-page arena-stage min-h-screen bg-px-base text-px-text flex flex-col">
      {/* header */}
      <div className="arena-page-header" style={{ background: '#141726', borderBottom: '4px solid #c42b2b' }}>
        <div className="max-w-6xl mx-auto px-4 py-5">
          <p className="text-px-dim text-[9px] font-bold uppercase tracking-widest mb-1"
             style={{ fontFamily: 'monospace' }}>Ring Tactics</p>
          <h1 className="text-2xl font-bold uppercase tracking-widest">Select Match Type</h1>
        </div>
      </div>

      {/* mode cards */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="flex flex-col gap-4 w-full max-w-sm">
          {MODES.map(mode => (
            <button
              key={mode.id}
              disabled={!mode.available || (isGuest && mode.id !== 'vs_ai') || (isGuest && guestMatchUsed)}
              onClick={() => mode.available && onSelect(mode.id)}
              className="arena-ticket flex items-center gap-5 px-6 py-5 text-left transition-all hover:brightness-110"
              style={{
                background: mode.available && (!isGuest || mode.id === 'vs_ai') && !guestMatchUsed ? '#141726' : '#0f1120',
                border: `2px solid ${mode.available && (!isGuest || mode.id === 'vs_ai') && !guestMatchUsed ? '#c42b2b' : '#2e3755'}`,
                borderLeft: `5px solid ${mode.available && (!isGuest || mode.id === 'vs_ai') && !guestMatchUsed ? '#c42b2b' : '#2e3755'}`,
                boxShadow: mode.available && (!isGuest || mode.id === 'vs_ai') && !guestMatchUsed ? '4px 4px 0 #7a1a0a' : 'none',
                cursor: mode.available && (!isGuest || mode.id === 'vs_ai') && !guestMatchUsed ? 'pointer' : 'not-allowed',
                opacity: mode.available && (!isGuest || mode.id === 'vs_ai') && !guestMatchUsed ? 1 : 0.45,
              }}
            >
              <div className="flex-1">
                <p className="font-bold text-lg uppercase tracking-widest leading-tight"
                   style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 12,
                            color: mode.available ? '#e2e8ff' : '#4a5578' }}>
                  {mode.label}
                </p>
                <p className="mt-1.5 text-sm" style={{ color: '#6a7a9c' }}>
                  {isGuest && guestMatchUsed ? 'Create an account to keep playing'
                    : isGuest && mode.id !== 'vs_ai' ? 'Create an account to enter this mode'
                    : isGuest && mode.id === 'vs_ai' ? 'Your free guest match'
                    : mode.sub}
                </p>
              </div>
              <span style={{ fontSize: 20, color: mode.available ? '#c42b2b' : '#2e3755' }}>
                {mode.available && (!isGuest || mode.id === 'vs_ai') && !guestMatchUsed ? '▶' : '🔒'}
              </span>
            </button>
          ))}
          {isGuest && guestMatchUsed && <SaveProgressPrompt compact />}
        </div>
      </div>
    </div>
  )
}

export function BattlePage() {
  const navigate = useNavigate()
  const { battleState, startBattle, reset } = useBattleStore()
  const isLoggedIn = useAuthStore(s => s.isLoggedIn)
  const isLoading = useAuthStore(s => s.isLoading)
  const completeGuestMatch = useGuestTrialStore(s => s.completeMatch)
  const guestMatchUsed = useGuestTrialStore(s => s.usedMatch)
  const [mode, setMode] = useState<GameMode | null>(null)
  const [guestFinished, setGuestFinished] = useState(false)

  function handleSelect(m: GameMode) {
    if (!isLoggedIn && (guestMatchUsed || m !== 'vs_ai')) return
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
    setGuestFinished(false)
    setMode(null)
  }

  if (isLoading) return <div className="min-h-screen bg-px-base" />
  if (!isLoggedIn && guestMatchUsed && !guestFinished) return <GuestTrialUsed />
  if (!mode) return <MatchMenu onSelect={handleSelect} isGuest={!isLoggedIn} guestMatchUsed={guestMatchUsed} />
  if (!battleState) return <TeamSelect onStart={handleStart} onBack={handleBack} />
  return <BattleArena
    onMatchComplete={!isLoggedIn ? progress => {
      completeGuestMatch(progress)
      setGuestFinished(true)
    } : undefined}
    afterMatchContent={!isLoggedIn && guestFinished ? <SaveProgressPrompt compact /> : undefined}
  />
}

