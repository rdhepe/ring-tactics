import { useState } from 'react'
import { CharacterCard } from '../components/characters/CharacterCard'
import { CharacterDetail } from '../components/characters/CharacterDetail'
import { ALL_CHARACTERS } from '../data/characters'
import type { Character } from '../types'

export function CharactersPage() {
  const [selected, setSelected]       = useState<Character | null>(ALL_CHARACTERS[0])
  const [search, setSearch]           = useState('')

  const filtered = ALL_CHARACTERS.filter(c => {
    const ms = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.title?.toLowerCase().includes(search.toLowerCase())
    return ms
  })

  return (
    <div className="arena-page min-h-screen bg-px-base text-px-text">
      <div className="arena-page-header border-b-2 border-px-border bg-px-panel">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-end gap-4 flex-wrap">
          <div>
            <p className="text-px-dim text-[9px] uppercase tracking-widest font-bold mb-0.5" style={{ fontFamily: 'monospace' }}>Ring Tactics</p>
            <h1 className="text-2xl font-bold uppercase tracking-widest text-px-text leading-none">Roster</h1>
          </div>
          <span className="text-px-muted text-sm ml-auto">{filtered.length} / {ALL_CHARACTERS.length}</span>
        </div>
      </div>

      <div className="arena-toolbar border-b border-px-border bg-px-panel sticky top-12 z-40">
        <div className="max-w-6xl mx-auto px-4 py-2 flex gap-2 flex-wrap">
          <input type="text" placeholder="Search roster…" value={search} onChange={e => setSearch(e.target.value)}
                 className="bg-px-surface text-px-text placeholder-px-dim text-sm px-3 py-1.5 outline-none w-40"
                 style={{ border: '1px solid #2e3755', fontFamily: 'inherit' }} />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col lg:flex-row gap-5">
        <div className="flex-1 min-w-0">
          {filtered.length === 0
            ? <p className="text-px-dim text-center py-16 text-sm">No wrestlers match your filters.</p>
            : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filtered.map(c => (
                  <CharacterCard key={c.id} character={c} selected={selected?.id === c.id}
                                 onClick={() => setSelected(selected?.id === c.id ? null : c)} />
                ))}
              </div>
            )
          }
        </div>

        {selected && (
          <div className="arena-panel w-full lg:w-96 shrink-0 overflow-y-auto lg:sticky self-start"
               style={{ top: 'calc(48px + 44px + 24px)', maxHeight: 'calc(100vh - 160px)', background: '#141726', border: '2px solid #2e3755' }}>
            <CharacterDetail character={selected} />
          </div>
        )}
      </div>
    </div>
  )
}
