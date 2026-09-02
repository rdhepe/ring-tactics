import { useState } from 'react'
import { CharacterCard } from '../components/characters/CharacterCard'
import { CharacterDetail } from '../components/characters/CharacterDetail'
import { ALL_CHARACTERS } from '../data/characters'
import type { Character, CharacterClass, CharacterRarity } from '../types'

const RARITY_ORDER: CharacterRarity[] = ['common', 'uncommon', 'rare', 'legendary']
const RARITY_LABELS: Record<CharacterRarity, string> = { common: 'Rookie', uncommon: 'Veteran', rare: 'Champion', legendary: 'Legend' }
const ALL_CLASSES: CharacterClass[] = ['brawler', 'high-flyer', 'submission', 'cornerman', 'monster', 'technician']

export function CharactersPage() {
  const [selected, setSelected]       = useState<Character | null>(ALL_CHARACTERS[0])
  const [filterClass, setFilterClass] = useState<CharacterClass | 'all'>('all')
  const [filterRarity, setFilterRarity] = useState<CharacterRarity | 'all'>('all')
  const [search, setSearch]           = useState('')

  const filtered = ALL_CHARACTERS.filter(c => {
    const mc = filterClass  === 'all' || c.classes.includes(filterClass)
    const mr = filterRarity === 'all' || c.rarity === filterRarity
    const ms = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.title?.toLowerCase().includes(search.toLowerCase())
    return mc && mr && ms
  }).sort((a, b) => RARITY_ORDER.indexOf(b.rarity) - RARITY_ORDER.indexOf(a.rarity))

  return (
    <div className="arena-page min-h-screen bg-px-base text-px-text">
      <div className="arena-page-header border-b-2 border-px-border bg-px-panel">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-end gap-4 flex-wrap">
          <div>
            <p className="text-px-dim text-[9px] uppercase tracking-widest font-bold mb-0.5" style={{ fontFamily: 'monospace' }}>Slam Arena</p>
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
          <select value={filterClass} onChange={e => setFilterClass(e.target.value as CharacterClass | 'all')}
                  className="bg-px-surface text-px-text text-sm px-3 py-1.5 outline-none capitalize"
                  style={{ border: '1px solid #2e3755', fontFamily: 'inherit' }}>
            <option value="all">All Styles</option>
            {ALL_CLASSES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
          </select>
          <select value={filterRarity} onChange={e => setFilterRarity(e.target.value as CharacterRarity | 'all')}
                  className="bg-px-surface text-px-text text-sm px-3 py-1.5 outline-none capitalize"
                  style={{ border: '1px solid #2e3755', fontFamily: 'inherit' }}>
            <option value="all">All Ranks</option>
            {RARITY_ORDER.map(r => <option key={r} value={r}>{RARITY_LABELS[r]}</option>)}
          </select>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 flex gap-5">
        <div className="flex-1 min-w-0">
          {filtered.length === 0
            ? <p className="text-px-dim text-center py-16 text-sm">No wrestlers match your filters.</p>
            : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2">
                {filtered.map(c => (
                  <CharacterCard key={c.id} character={c} selected={selected?.id === c.id}
                                 onClick={() => setSelected(selected?.id === c.id ? null : c)} />
                ))}
              </div>
            )
          }
        </div>

        {selected && (
          <div className="arena-panel w-72 shrink-0 overflow-y-auto sticky self-start"
               style={{ top: 'calc(48px + 44px + 24px)', maxHeight: 'calc(100vh - 160px)', background: '#141726', border: '2px solid #2e3755' }}>
            <CharacterDetail character={selected} />
          </div>
        )}
      </div>
    </div>
  )
}
