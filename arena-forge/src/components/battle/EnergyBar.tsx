import type { EnergyPool } from '../../types'

const E_META = {
  strength: { label: 'P', color: '#f45e3f', full: 'Power'     },
  magic:    { label: 'T', color: '#6b9ff5', full: 'Technical' },
  spirit:   { label: 'S', color: '#38d9a9', full: 'Stamina'   },
  agility:  { label: 'Q', color: '#ffd166', full: 'Quickness' },
} as const

interface EnergyBarProps { pool: EnergyPool; label?: string }

export function EnergyBar({ pool, label = 'ENERGY' }: EnergyBarProps) {
  const total = pool.strength + pool.magic + pool.spirit + pool.agility

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {label && (
        <span className="text-px-dim text-[9px] font-bold uppercase tracking-widest shrink-0"
              style={{ fontFamily: 'monospace' }}>{label}</span>
      )}
      <div className="flex gap-1.5 flex-wrap items-center">
        {total === 0
          ? <span className="text-px-dim text-[10px]" style={{ fontFamily: 'monospace' }}>—</span>
          : (Object.entries(E_META) as [keyof typeof E_META, typeof E_META[keyof typeof E_META]][])
              .filter(([type]) => pool[type] > 0)
              .map(([type, meta]) => (
                <span key={type} title={meta.full}
                      className="inline-flex items-center gap-0.5 font-bold"
                      style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8 }}>
                  <span style={{ width: 18, height: 18, background: meta.color, color: '#0c0e1a',
                                 fontSize: 8, display: 'inline-flex', alignItems: 'center',
                                 justifyContent: 'center', outline: '1px solid rgba(0,0,0,.4)',
                                 flexShrink: 0 }}>
                    {meta.label}
                  </span>
                  {pool[type] > 1 && (
                    <span style={{ color: meta.color, fontSize: 8 }}>×{pool[type]}</span>
                  )}
                </span>
              ))
        }
      </div>
      <span className="text-px-dim text-[9px]" style={{ fontFamily: 'monospace' }}>
        [{total}]
      </span>
    </div>
  )
}
