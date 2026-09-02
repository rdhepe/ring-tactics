import { Link, useParams } from 'react-router-dom'
import { CharacterDetail } from '../components/characters/CharacterDetail'
import { CHARACTER_MAP } from '../data/characters'

export function CharacterPage() {
  const { id } = useParams<{ id: string }>()
  const character = id ? CHARACTER_MAP[id] : null

  if (!character) {
    return (
      <div className="arena-page arena-stage min-h-screen bg-px-base text-px-text flex items-center justify-center">
        <div className="text-center">
          <p className="text-px-muted mb-4 text-sm">Character not found.</p>
          <Link to="/characters" className="text-px-gold hover:brightness-110 text-sm font-bold uppercase tracking-widest">← Roster</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="arena-page min-h-screen bg-px-base text-px-text">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link to="/characters" className="text-px-muted hover:text-px-gold text-xs font-bold uppercase tracking-widest mb-6 inline-block">
          ← Back to Roster
        </Link>
        <div className="arena-panel" style={{ border: '2px solid #2e3755' }}>
          <CharacterDetail character={character} />
        </div>
      </div>
    </div>
  )
}
