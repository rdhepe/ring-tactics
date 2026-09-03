import { useState } from 'react'
import { ALL_CHARACTERS } from '../../data/characters'
import { CharacterCard } from '../characters/CharacterCard'
import { CharacterDetail } from '../characters/CharacterDetail'
import type { Character } from '../../types'

const MAX_TEAM = 3

interface TeamSelectProps { onStart: (team: Character[]) => void; onBack?: () => void }

export function TeamSelect({ onStart, onBack }: TeamSelectProps) {
  const [team,    setTeam]    = useState<Character[]>([])
  const [preview, setPreview] = useState<Character | null>(ALL_CHARACTERS[0])

  function toggleChar(c: Character) {
    setTeam(prev => {
      if (prev.find(x => x.id === c.id)) return prev.filter(x => x.id !== c.id)
      if (prev.length >= MAX_TEAM) return prev
      return [...prev, c]
    })
  }

  return (
    <div className="arena-page min-h-screen bg-px-base text-px-text flex flex-col">
      <div className="arena-page-header" style={{ background: '#141726', borderBottom: '4px solid #c42b2b' }}>
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p className="text-px-dim text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ fontFamily: 'monospace' }}>Match Setup · VS AI</p>
            <h1 className="text-2xl font-bold uppercase tracking-widest leading-none">Pick Your Stable</h1>
          </div>
          <div className="flex items-center gap-3">
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
