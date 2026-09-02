import type { EnergyType, EnergyCost } from '../../types'

// Wrestling energy: Power / Technical / Stamina / Speed
const META: Record<EnergyType, { label: string; bg: string; color: string; full: string }> = {
  strength: { label: 'P', bg: '#f45e3f', color: '#fff',    full: 'Power'     },
  magic:    { label: 'T', bg: '#6b9ff5', color: '#fff',    full: 'Technical' },
  spirit:   { label: 'S', bg: '#38d9a9', color: '#0c0e1a', full: 'Stamina'   },
  agility:  { label: 'Q', bg: '#ffd166', color: '#0c0e1a', full: 'Quickness' },
  random:   { label: '?', bg: '#445180', color: '#c8cfe8', full: 'Any'       },
}

interface EnergyOrbProps { type: EnergyType; size?: 'sm' | 'md' }

export function EnergyOrb({ type, size = 'md' }: EnergyOrbProps) {
  const { label, bg, color, full } = META[type]
  const dim = size === 'sm' ? 18 : 22
  return (
    <span
      title={full}
      className="inline-flex items-center justify-center font-bold shrink-0"
      style={{
        width: dim, height: dim, background: bg, color,
        fontSize: size === 'sm' ? 9 : 11,
        fontFamily: "'Press Start 2P', monospace",
        border: `2px solid ${bg}`,
        outline: '1px solid rgba(0,0,0,.4)',
        lineHeight: 1,
      }}
    >
      {label}
    </span>
  )
}

interface EnergyCostDisplayProps { cost: EnergyCost; size?: 'sm' | 'md' }

export function EnergyCostDisplay({ cost, size = 'sm' }: EnergyCostDisplayProps) {
  if (!cost) return <span className="text-px-dim text-xs font-bold uppercase tracking-wider">Free</span>
  const entries = (Object.entries(cost) as [EnergyType, number][]).filter(([, v]) => v > 0)
  if (!entries.length) return <span className="text-px-dim text-xs font-bold uppercase tracking-wider">Free</span>
  return (
    <span className="inline-flex gap-1 flex-wrap items-center">
      {entries.flatMap(([type, count]) =>
        Array.from({ length: count }, (_, i) => (
          <EnergyOrb key={`${type}-${i}`} type={type} size={size} />
        ))
      )}
    </span>
  )
}
