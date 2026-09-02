import type { Character } from '../../types'
import { getRarityColor } from '../ui/RarityBadge'

interface CharacterCardProps {
  character: Character
  selected?: boolean
  onClick?: () => void
}

export function CharacterCard({ character, selected, onClick }: CharacterCardProps) {
  const rc = getRarityColor(character.rarity)
  return (
    <button
      onClick={onClick}
      className="arena-roster-card relative flex flex-col text-center transition-all w-full hover:brightness-110"
      style={{
        background: selected ? `${rc}10` : '#141726',
        border: `2px solid ${selected ? rc : '#2e3755'}`,
        boxShadow: selected ? `0 0 0 1px ${rc}55` : 'none',
      }}
    >
      {/* rarity bar */}
      <div className="h-0.5 w-full" style={{ background: rc }} />

      {/* avatar */}
      <div className="pt-5 pb-3 px-3 flex justify-center">
        <div
          className={`w-24 h-24 flex items-center justify-center text-3xl font-bold text-white overflow-hidden ${character.avatarColor}`}
          style={{ border: `2px solid ${rc}55` }}
        >
          {character.avatarUrl
            ? <img src={character.avatarUrl} alt="" className="w-full h-full object-cover" />
            : character.name[0]
          }
        </div>
      </div>

      {/* info */}
      <div className="px-2 pb-3 flex flex-col gap-1 items-center">
        <p className="text-px-text font-bold text-base leading-tight">{character.name}</p>
        {character.title && (
          <p className="text-px-dim text-xs italic leading-tight">{character.title}</p>
        )}
        <div className="flex gap-1 flex-wrap justify-center mt-1">
          {character.classes.map(cls => (
            <span key={cls} className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5"
                  style={{ background: '#1d2235', color: '#8892b8', border: '1px solid #2e3755', fontFamily: 'monospace' }}>
              {cls}
            </span>
          ))}
        </div>
      </div>

      {selected && (
        <div className="absolute top-1.5 right-1.5 w-4 h-4 flex items-center justify-center"
             style={{ background: rc }}>
          <span className="text-px-base font-bold" style={{ fontSize: 8 }}>✓</span>
        </div>
      )}
    </button>
  )
}
