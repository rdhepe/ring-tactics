import type { Character } from '../../types'
import { getRarityColor } from '../ui/RarityBadge'
import { UNLOCK_COST, FREE_RARITIES } from '../../data/economy'
import { useRankStore } from '../../store/rankStore'

interface CharacterCardProps {
  character: Character
  selected?: boolean
  onClick?: () => void
}

export function CharacterCard({ character, selected, onClick }: CharacterCardProps) {
  const rc = getRarityColor(character.rarity)
  const unlockedCharacters = useRankStore(s => s.unlockedCharacters)
  const isLocked = !FREE_RARITIES.includes(character.rarity) && !unlockedCharacters.includes(character.id)
  const cost = UNLOCK_COST[character.rarity]

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
      <div className="pt-5 pb-4 px-4 flex justify-center relative">
        <div
          className={`w-32 h-32 flex items-center justify-center text-4xl font-bold text-white overflow-hidden ${character.avatarColor}`}
          style={{ border: `2px solid ${rc}55`, filter: isLocked ? 'grayscale(1) brightness(.5)' : 'none' }}
        >
          {character.avatarUrl
            ? <img src={character.avatarUrl} alt="" className="w-full h-full object-cover" />
            : character.name[0]
          }
        </div>
        {isLocked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <span style={{ fontSize: 28 }}>🔒</span>
            <span className="text-px-gold text-[10px] font-bold" style={{ fontFamily: 'monospace' }}>
              {cost.coins ? `${cost.coins} 🪙` : `${cost.diamonds} 💎`}
            </span>
          </div>
        )}
      </div>

      {/* info */}
      <div className="px-3 pb-4 flex flex-col gap-1.5 items-center">
        <p className="text-px-text font-bold text-lg leading-tight">{character.name}</p>
        {character.title && (
          <p className="text-px-dim text-sm italic leading-tight">{character.title}</p>
        )}
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
