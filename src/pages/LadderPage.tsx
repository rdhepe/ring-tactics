import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePvpStore } from '../store/pvpStore'
import { TeamSelect } from '../components/battle/TeamSelect'
import { PvpBattleArena } from '../components/battle/PvpBattleArena'
import type { Character } from '../types'

// ─── Screens ──────────────────────────────────────────────────────────────────

function SearchingScreen({ status, onCancel }: { status: string; onCancel: () => void }) {
  const [dots, setDots] = useState('')
  useEffect(() => {
    const id = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 500)
    return () => clearInterval(id)
  }, [])
  return (
    <div className="arena-page arena-stage arena-center-state min-h-screen bg-px-base text-px-text flex items-center justify-center">
      <div className="arena-panel arena-panel-yellow flex flex-col items-center gap-8 text-center px-8 py-8">
        <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 12, color: '#ffd166' }}>
          LADDER MATCH
        </p>
        <div style={{ padding: '24px 48px', background: '#141726', border: '2px solid #ffd16644' }}>
          <p style={{ fontFamily: 'monospace', fontSize: 12, color: '#8892b8', minWidth: 220 }}>
            {status}{dots}
          </p>
        </div>
        <div className="flex gap-2">
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: '50%', background: '#ffd166',
              animation: `pulse 1.2s ease-in-out ${i * 0.4}s infinite`,
            }} />
          ))}
        </div>
        {onCancel && (
          <button className="arena-secondary" onClick={onCancel}
                  style={{ padding: '8px 24px', background: '#1d2235', color: '#f45e3f',
                           border: '1px solid #f45e3f44', fontFamily: 'monospace', fontSize: 10, cursor: 'pointer' }}>
            CANCEL
          </button>
        )}
      </div>
    </div>
  )
}

function ErrorScreen({ message, onReset }: { message: string; onReset: () => void }) {
  return (
    <div className="arena-page arena-stage arena-center-state min-h-screen bg-px-base text-px-text flex items-center justify-center">
      <div className="arena-panel flex flex-col items-center gap-6 text-center px-8 py-8">
        <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: '#f45e3f' }}>ERROR</p>
        <p style={{ color: '#8892b8', fontFamily: 'monospace', fontSize: 12 }}>{message}</p>
        <button className="arena-action" onClick={onReset}
                style={{ padding: '10px 28px', background: '#c42b2b', color: '#fff',
                         fontFamily: "'Press Start 2P', monospace", fontSize: 8,
                         boxShadow: '3px 3px 0 #7a1a0a', cursor: 'pointer', border: 'none' }}>
          ← BACK
        </button>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function LadderPage() {
  const navigate = useNavigate()
  const pvpPhase       = usePvpStore(s => s.pvpPhase)
  const errorMsg       = usePvpStore(s => s.errorMsg)
  const opponentReady  = usePvpStore(s => s.opponentReady)
  const battleState    = usePvpStore(s => s.battleState)
  const { cancelSearch, submitTeam, reset } = usePvpStore()

  const [teamSubmitted, setTeamSubmitted] = useState(false)

  // Reset → connect → findMatch (findMatch waits for TCP handshake internally)
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>
    usePvpStore.getState().reset()
    t = setTimeout(() => {
      usePvpStore.getState().connect()
      usePvpStore.getState().findMatch()
    }, 150)
    return () => clearTimeout(t)
  }, [])

  function handleReset() { reset(); navigate('/battle') }

  if (pvpPhase === 'error')
    return <ErrorScreen message={errorMsg ?? 'Connection failed.'} onReset={handleReset} />

  if (pvpPhase === 'battle' || pvpPhase === 'game_over')
    return battleState ? <PvpBattleArena onReset={handleReset} /> : null

  if (pvpPhase === 'team_select') {
    if (teamSubmitted) {
      return (
        <div className="arena-page arena-stage arena-center-state min-h-screen bg-px-base text-px-text flex items-center justify-center">
          <div className="arena-panel arena-panel-yellow flex flex-col items-center gap-4 text-center px-8 py-8">
            <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: '#38d9a9' }}>
              ✓ TEAM READY
            </p>
            <p style={{ color: opponentReady ? '#38d9a9' : '#8892b8', fontFamily: 'monospace', fontSize: 12 }}>
              {opponentReady ? 'Opponent ready — starting match...' : 'Waiting for opponent to pick their team...'}
            </p>
          </div>
        </div>
      )
    }
    return (
      <div>
        <div style={{ background: '#0f1120', borderBottom: '2px solid #ffd16644', padding: '8px 16px' }}>
          <p style={{ fontFamily: 'monospace', fontSize: 9, color: '#ffd166', textAlign: 'center' }}>
            ⚔ LADDER MATCH — SELECT YOUR TEAM
          </p>
        </div>
        <TeamSelect onStart={(team: Character[]) => { submitTeam(team); setTeamSubmitted(true) }} />
      </div>
    )
  }

  // idle / searching / connecting — all show spinner
  const statusText = pvpPhase === 'searching' ? 'Searching for opponent' : 'Connecting'
  return (
    <SearchingScreen
      status={statusText}
      onCancel={pvpPhase === 'searching' ? () => { cancelSearch(); navigate('/battle') } : () => navigate('/battle')}
    />
  )
}
