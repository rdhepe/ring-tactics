import { useEffect, useRef, useState } from 'react'
import { ALL_CHARACTERS } from '../../data/characters'
import { CharacterCard } from '../characters/CharacterCard'
import { CharacterDetail } from '../characters/CharacterDetail'
import { FREE_RARITIES } from '../../data/economy'
import { useRankStore } from '../../store/rankStore'
import type { Character } from '../../types'

const MAX_TEAM = 3

interface TeamSelectProps {
  onStart: (team: Character[]) => void
  onBack?: () => void
  /** If set, shows a countdown and auto-fills/submits a team of unlocked wrestlers when time runs out (e.g. ranked ladder matches). */
  autoSubmitSecs?: number
  /** Overrides the small header line above "Pick Your Stable" (defaults to "Match Setup · VS AI"). */
  subtitle?: string
}

export function TeamSelect({ onStart, onBack, autoSubmitSecs, subtitle = 'Match Setup · VS AI' }: TeamSelectProps) {
  const [team,    setTeam]    = useState<Character[]>([])
  const [preview, setPreview] = useState<Character | null>(ALL_CHARACTERS[0])
  const unlockedCharacters = useRankStore(s => s.unlockedCharacters)

  const teamRef = useRef(team)
  useEffect(() => { teamRef.current = team }, [team])
  const unlockedRef = useRef(unlockedCharacters)
  useEffect(() => { unlockedRef.current = unlockedCharacters }, [unlockedCharacters])
  const onStartRef = useRef(onStart)
  useEffect(() => { onStartRef.current = onStart }, [onStart])

  const [timeLeft, setTimeLeft] = useState(autoSubmitSecs ?? 0)

  useEffect(() => {
    if (!autoSubmitSecs) return
    setTimeLeft(autoSubmitSecs)
    let autoSubmitted = false

    function autoPickAndSubmit() {
      if (autoSubmitted) return
      autoSubmitted = true
      const isAvailable = (c: Character) => FREE_RARITIES.includes(c.rarity) || unlockedRef.current.includes(c.id)
      const filled = [...teamRef.current]
      for (const c of ALL_CHARACTERS) {
        if (filled.length >= MAX_TEAM) break
        if (filled.some(x => x.id === c.id)) continue
        if (!isAvailable(c)) continue
        filled.push(c)
      }
      onStartRef.current(filled.slice(0, MAX_TEAM))
    }

    const id = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(id)
          autoPickAndSubmit()
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [autoSubmitSecs])

  function toggleChar(c: Character) {
    const isLocked = !FREE_RARITIES.includes(c.rarity) && !unlockedCharacters.includes(c.id)
    if (isLocked) return
    setTeam(prev => {
      if (prev.find(x => x.id === c.id)) return prev.filter(x => x.id !== c.id)
      if (prev.length >= MAX_TEAM) return prev
      return [...prev, c]
    })
  }

  return (
    <div className="arena-page min-h-screen bg-px-base text-px-text flex flex-col">
      <div className="sticky top-0 z-30">
      <div className="arena-page-header" style={{ background: '#141726', borderBottom: '4px solid #c42b2b' }}>
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p className="text-px-dim text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ fontFamily: 'monospace' }}>{subtitle}</p>
            <h1 className="text-2xl font-bold uppercase tracking-widest leading-none">Pick Your Stable</h1>
          </div>
          <div className="flex items-center gap-3">
            {autoSubmitSecs != null && (
              <span className="font-bold text-sm px-3 py-1.5"
                    style={{ fontFamily: 'monospace', color: timeLeft <= 10 ? '#f45e3f' : '#ffd166',
                             background: timeLeft <= 10 ? '#f45e3f11' : '#ffd16611',
                             border: `1px solid ${timeLeft <= 10 ? '#f45e3f44' : '#ffd16644'}` }}
                    title="Auto-picks your team if time runs out">
                ⏱ 0:{String(timeLeft).padStart(2, '0')}
              </span>
            )}
            {onBack && (
              <button onClick={onBack}
                      className="px-4 py-2 text-xs font-bold uppercase tracking-widest hover:brightness-110 transition-all"
                      style={{ background: '#1d2235', color: '#8892b8', border: '1px solid #2e3755', fontFamily: 'monospace' }}>
                ← Back
              </button>
            )}
            <span className="font-bold text-sm" style={{ fontFamily: 'monospace' }}>
              <span className="text-[#c42b2b]">{team.length}</span>
              <span className="text-px-dim">/{MAX_TEAM}</span>
            </span>
            <button
              disabled={team.length < MAX_TEAM}
              onClick={() => onStart(team)}
              className="px-6 py-2 font-bold text-sm uppercase tracking-widest transition-all"
              style={team.length === MAX_TEAM
                ? { background: '#c42b2b', color: '#fff', boxShadow: '3px 3px 0 #7a1a0a', fontFamily: "'Press Start 2P', monospace", fontSize: 8 }
                : { background: '#1d2235', color: '#4a5578', border: '1px solid #2e3755', cursor: 'not-allowed', fontFamily: 'monospace', fontSize: 11 }
              }>
              ▶ Enter the Ring!
            </button>
          </div>
        </div>
      </div>

      {team.length > 0 && (
        <div style={{ background: '#0f1120', borderBottom: '1px solid #2e3755' }}>
          <div className="max-w-6xl mx-auto px-4 py-2 flex gap-2 items-center">
            <span className="text-px-dim text-[9px] uppercase tracking-widest font-bold mr-1 shrink-0" style={{ fontFamily: 'monospace' }}>STABLE</span>
            {team.map(c => (
              <button key={c.id} onClick={() => toggleChar(c)}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm font-bold hover:brightness-110 transition-all"
                      style={{ background: '#1d2235', border: '1px solid #445180' }} title="Click to remove">
                <span>{c.name}</span><span className="text-px-dim text-xs">✕</span>
              </button>
            ))}
            {Array.from({ length: MAX_TEAM - team.length }).map((_, i) => (
              <div key={i} className="px-8 py-1.5"
                   style={{ border: '1px dashed #2e3755', color: '#4a5578', fontSize: 10, fontFamily: 'monospace' }}>EMPTY</div>
            ))}
          </div>
        </div>
      )}
      </div>

      <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-6 flex flex-col lg:flex-row gap-5">
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 content-start">
          {ALL_CHARACTERS.map(c => (
            <CharacterCard key={c.id} character={c} selected={team.some(x => x.id === c.id)}
                           onClick={() => { toggleChar(c); setPreview(c) }} />
          ))}
        </div>
        {preview && (
          <div className="arena-panel w-full lg:w-96 shrink-0 overflow-y-auto self-start"
               style={{ border: '2px solid #2e3755', background: '#141726', maxHeight: 'calc(100vh - 200px)', position: 'sticky', top: '120px' }}>
            <CharacterDetail character={preview} selected={team.some(x => x.id === preview.id)}
                             onSelect={() => toggleChar(preview)}
                             selectLabel={team.some(x => x.id === preview.id) ? 'Remove from Stable' : team.length >= MAX_TEAM ? 'Stable Full' : 'Add to Stable'} />
          </div>
        )}
      </div>
    </div>
  )
}
