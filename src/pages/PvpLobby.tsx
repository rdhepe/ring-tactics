import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePvpStore } from '../store/pvpStore'
import { TeamSelect } from '../components/battle/TeamSelect'
import { PvpBattleArena } from '../components/battle/PvpBattleArena'
import type { Character } from '../types'

// ─── Phase screens ────────────────────────────────────────────────────────────

function LobbyMenu({ onConnect }: { onConnect: (action: 'create' | 'join', code?: string) => void }) {
  const [code, setCode] = useState('')
  const [tab, setTab]   = useState<'create' | 'join'>('create')

  return (
    <div className="arena-page arena-stage min-h-screen bg-px-base text-px-text flex flex-col">
      <div className="arena-page-header" style={{ background: '#141726', borderBottom: '4px solid #c42b2b' }}>
        <div className="max-w-6xl mx-auto px-4 py-5">
          <p className="text-px-dim text-[9px] font-bold uppercase tracking-widest mb-1"
             style={{ fontFamily: 'monospace' }}>Slam Arena · PvP</p>
          <h1 className="text-2xl font-bold uppercase tracking-widest">Online Match</h1>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm flex flex-col gap-4">
          <div className="flex gap-2">
            {(['create', 'join'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                      style={{
                        flex: 1, padding: '10px',
                        background: tab === t ? '#c42b2b' : '#141726',
                        border: `2px solid ${tab === t ? '#c42b2b' : '#2e3755'}`,
                        color: tab === t ? '#fff' : '#8892b8',
                        fontFamily: 'monospace', fontSize: 11, fontWeight: 'bold',
                        textTransform: 'uppercase', letterSpacing: 2, cursor: 'pointer',
                      }}>
                {t === 'create' ? 'Create Room' : 'Join Room'}
              </button>
            ))}
          </div>

          <div className="arena-panel" style={{ background: '#141726', border: '2px solid #2e3755', padding: 24 }}>
            {tab === 'create' ? (
              <div className="flex flex-col gap-4">
                <p style={{ color: '#8892b8', fontSize: 12, lineHeight: 1.6 }}>
                  Create a private room and share the code with your opponent.
                </p>
                <button className="arena-action" onClick={() => onConnect('create')}
                        style={{
                          padding: '12px',
                          background: '#c42b2b', color: '#fff',
                          fontFamily: "'Press Start 2P', monospace", fontSize: 9,
                          boxShadow: '3px 3px 0 #7a1a0a', cursor: 'pointer', border: 'none',
                        }}>
                  ▶ CREATE ROOM
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <p style={{ color: '#8892b8', fontSize: 12, lineHeight: 1.6 }}>
                  Enter the 4-character room code from your opponent.
                </p>
                <input
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase().slice(0, 4))}
                  placeholder="XXXX"
                  maxLength={4}
                  style={{
                    background: '#0c0e1a', border: '2px solid #2e3755',
                    color: '#ffd166', padding: '10px 14px',
                    fontFamily: "'Press Start 2P', monospace", fontSize: 16,
                    textAlign: 'center', letterSpacing: 6, outline: 'none', width: '100%',
                  }}
                />
                <button className="arena-action"
                  disabled={code.length < 4}
                  onClick={() => onConnect('join', code)}
                  style={{
                    padding: '12px',
                    background: code.length === 4 ? '#c42b2b' : '#1d2235',
                    color: code.length === 4 ? '#fff' : '#4a5578',
                    fontFamily: "'Press Start 2P', monospace", fontSize: 9,
                    boxShadow: code.length === 4 ? '3px 3px 0 #7a1a0a' : 'none',
                    cursor: code.length === 4 ? 'pointer' : 'not-allowed', border: 'none',
                  }}>
                  ▶ JOIN ROOM
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function WaitingScreen({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    void navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="arena-page arena-stage arena-center-state min-h-screen bg-px-base text-px-text flex items-center justify-center">
      <div className="arena-panel arena-panel-yellow flex flex-col items-center gap-6 text-center px-8 py-8">
        <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: '#ffd166' }}>
          WAITING FOR OPPONENT
        </p>
        <div style={{ padding: '20px 40px', background: '#141726', border: '2px solid #ffd16644' }}>
          <p style={{ color: '#4a5578', fontFamily: 'monospace', fontSize: 10, marginBottom: 8 }}>ROOM CODE</p>
          <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 28, color: '#ffd166', letterSpacing: 8 }}>
            {code}
          </p>
        </div>
        <button onClick={copy}
                style={{
                  padding: '8px 24px', background: copied ? '#38d9a922' : '#1d2235',
                  border: `1px solid ${copied ? '#38d9a9' : '#2e3755'}`,
                  color: copied ? '#38d9a9' : '#8892b8',
                  fontFamily: 'monospace', fontSize: 10, cursor: 'pointer',
                }}>
          {copied ? '✓ COPIED!' : 'COPY CODE'}
        </button>
        <p style={{ color: '#4a5578', fontSize: 11, fontFamily: 'monospace' }}>
          Share this code with your opponent
        </p>
        <div className="flex gap-1">
          {[0,1,2].map(i => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#c42b2b',
                                  animation: `pulse 1.2s ease-in-out ${i * 0.4}s infinite` }} />
          ))}
        </div>
      </div>
    </div>
  )
}

function ErrorScreen({ message, onReset }: { message: string; onReset: () => void }) {
  return (
    <div className="arena-page arena-stage arena-center-state min-h-screen bg-px-base text-px-text flex items-center justify-center">
      <div className="arena-panel flex flex-col items-center gap-6 text-center px-8 py-8">
        <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: '#f45e3f' }}>CONNECTION ERROR</p>
        <p style={{ color: '#8892b8', fontFamily: 'monospace', fontSize: 12 }}>{message}</p>
        <button className="arena-action" onClick={onReset}
                style={{
                  padding: '10px 28px', background: '#c42b2b', color: '#fff',
                  fontFamily: "'Press Start 2P', monospace", fontSize: 8,
                  boxShadow: '3px 3px 0 #7a1a0a', cursor: 'pointer', border: 'none',
                }}>
          ← BACK TO LOBBY
        </button>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function PvpLobbyPage() {
  const navigate = useNavigate()
  const { pvpPhase, roomCode, errorMsg, opponentReady, battleState,
    connect, createRoom, joinRoom, submitTeam, reset } = usePvpStore()
  const [teamSubmitted, setTeamSubmitted] = useState(false)

  // Ensure socket is connected when the lobby mounts
  useEffect(() => { connect() }, [])

  function handleConnect(action: 'create' | 'join', code?: string) {
    if (action === 'create') createRoom()
    else if (code)           joinRoom(code)
  }

  function handleTeamReady(team: Character[]) {
    submitTeam(team)
    setTeamSubmitted(true)
  }

  function handleReset() { reset(); navigate('/battle') }

  if (pvpPhase === 'error') return <ErrorScreen message={errorMsg ?? 'Unknown error'} onReset={handleReset} />

  if (pvpPhase === 'idle') return <LobbyMenu onConnect={handleConnect} />

  if (pvpPhase === 'waiting_for_opponent') return <WaitingScreen code={roomCode!} />

  // Battle is live — show the arena
  if ((pvpPhase === 'battle' || pvpPhase === 'game_over') && battleState) {
    return <PvpBattleArena onReset={handleReset} />
  }

  // Team select (both players)
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
            ⚔ PvP · ROOM {roomCode} · SELECT YOUR TEAM
          </p>
        </div>
        <TeamSelect onStart={handleTeamReady} />
      </div>
    )
  }

  return null
}
