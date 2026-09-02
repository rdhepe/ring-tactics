import type { CharacterRarity } from '../../types'

const RARITY: Record<CharacterRarity, { color: string; bg: string; label: string }> = {
  common:    { color: '#8892b8', bg: 'rgba(136,146,184,.12)', label: 'Rookie'     },
  uncommon:  { color: '#38d9a9', bg: 'rgba(56,217,169,.12)',  label: 'Veteran'    },
  rare:      { color: '#6b9ff5', bg: 'rgba(107,159,245,.12)', label: 'Champion'   },
  legendary: { color: '#ffd166', bg: 'rgba(255,209,102,.12)', label: 'Legend'     },
}

interface RarityBadgeProps { rarity: CharacterRarity }

export function RarityBadge({ rarity }: RarityBadgeProps) {
  const { color, bg, label } = RARITY[rarity]
  return (
    <span
      className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5"
      style={{ color, background: bg, border: `1px solid ${color}44`, fontFamily: 'monospace' }}
    >
      {label}
    </span>
  )
}

export function getRarityColor(rarity: CharacterRarity) { return RARITY[rarity].color }
export function getRarityRingClass(_rarity: CharacterRarity) { return '' }
