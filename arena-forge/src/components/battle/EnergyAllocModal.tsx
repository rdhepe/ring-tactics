import { useState } from 'react'
import type { Skill, EnergyPool } from '../../types'

const ENERGY_KEYS = ['strength', 'magic', 'spirit', 'agility'] as const
type EKey = typeof ENERGY_KEYS[number]

const E_META: Record<EKey, { label: string; color: string; letter: string }> = {
  strength: { label: 'Power',     color: '#f45e3f', letter: 'P' },
  magic:    { label: 'Technical', color: '#6b9ff5', letter: 'T' },
  spirit:   { label: 'Stamina',   color: '#38d9a9', letter: 'S' },
  agility:  { label: 'Quickness', color: '#ffd166', letter: 'Q' },
}

interface Props {
  skill: Skill
  /** pool remaining after this skill's fixed costs and all other queued costs are deducted */
  availablePool: EnergyPool
  onConfirm: (allocation: Partial<EnergyPool>) => void
  onCancel: () => void
}

export function EnergyAllocModal({ skill, availablePool, onConfirm, onCancel }: Props) {
  const needed = skill.cost.random ?? 0
  const [alloc, setAlloc] = useState<Partial<EnergyPool>>({})

  const totalAllocated = ENERGY_KEYS.reduce((s, t) => s + (alloc[t] ?? 0), 0)
  const done = totalAllocated >= needed

  function add(t: EKey) {
    if (done) return
    if ((availablePool[t] - (alloc[t] ?? 0)) <= 0) return
    setAlloc(prev => ({ ...prev, [t]: (prev[t] ?? 0) + 1 }))
  }

  function remove(t: EKey) {
    if ((alloc[t] ?? 0) <= 0) return
    setAlloc(prev => ({ ...prev, [t]: (prev[t] ?? 0) - 1 }))
  }

  // fixed cost slots (non-random) to show as locked
  const fixedSlots = ENERGY_KEYS.flatMap(t =>
    Array<EKey>((skill.cost[t] ?? 0)).fill(t)
  )

  // slot i → which energy type fills it (for the allocated row display)
  function allocatedType(slotIdx: number): EKey | null {
    let seen = 0
    for (const t of ENERGY_KEYS) {
      seen += alloc[t] ?? 0
      if (seen > slotIdx) return t
    }
    return null
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[60]"
      style={{ background: 'rgba(0,0,0,.85)' }}
      onClick={e => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div style={{
        width: 400,
        background: '#0c0e1a',
        border: '2px solid #ffd16666',
        boxShadow: '0 8px 40px rgba(0,0,0,.95)',
      }}>

        {/* ── header ── */}
        <div className="flex items-center gap-3 px-4 py-3"
             style={{ borderBottom: '2px solid #2e3755', background: '#0f1120' }}>
          {skill.iconUrl && (
            <img src={skill.iconUrl} alt=""
                 style={{ width: 40, height: 40, objectFit: 'cover', border: '1px solid #2e3755', flexShrink: 0 }} />
          )}
          <div>
            <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: '#ffd166' }}>
              ALLOCATE ENERGY
            </p>
            <p style={{ fontFamily: 'monospace', fontSize: 11, color: '#c8cfe8', marginTop: 3, fontWeight: 'bold' }}>
              {skill.name.toUpperCase()}
            </p>
          </div>
        </div>

        <div className="px-4 py-4 flex flex-col gap-4">

          {/* ── fixed costs (auto-spent) ── */}
          {fixedSlots.length > 0 && (
            <div>
              <p style={{ fontFamily: 'monospace', fontSize: 8, color: '#4a5578', marginBottom: 8,
                          textTransform: 'uppercase', letterSpacing: 2 }}>
                Fixed cost (auto-spent)
              </p>
              <div className="flex gap-2">
                {fixedSlots.map((t, i) => {
                  const m = E_META[t]
                  return (
                    <div key={i} style={{
                      width: 36, height: 36,
                      background: m.color + '22', border: `2px solid ${m.color}88`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'monospace', fontSize: 14, fontWeight: 'bold', color: m.color,
                    }}>
                      {m.letter}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── wildcard allocation ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p style={{ fontFamily: 'monospace', fontSize: 8, color: '#4a5578',
                          textTransform: 'uppercase', letterSpacing: 2 }}>
                Wildcard ✦ ×{needed}
              </p>
              <p style={{ fontFamily: 'monospace', fontSize: 9, fontWeight: 'bold',
                          color: done ? '#38d9a9' : '#ffd166' }}>
                {totalAllocated}/{needed} filled
              </p>
            </div>

            {/* available energy type buttons */}
            <div className="flex gap-2 mb-4">
              {ENERGY_KEYS.map(t => {
                const avail = availablePool[t] - (alloc[t] ?? 0)
                const m = E_META[t]
                const canAdd = avail > 0 && !done
                return (
                  <button
                    key={t}
                    onClick={() => add(t)}
                    disabled={!canAdd}
                    title={canAdd ? `Add ${m.label}` : undefined}
                    style={{
                      flex: 1, padding: '10px 0',
                      background: canAdd ? m.color + '18' : '#0c0e1a',
                      border: `2px solid ${canAdd ? m.color + '99' : '#1d2235'}`,
                      color: canAdd ? m.color : '#2e3755',
                      cursor: canAdd ? 'pointer' : 'not-allowed',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                      transition: 'filter .1s',
                    }}
                    onMouseEnter={e => { if (canAdd) (e.currentTarget as HTMLElement).style.filter = 'brightness(1.2)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.filter = '' }}
                  >
                    <span style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 'bold' }}>{m.letter}</span>
                    <span style={{ fontFamily: 'monospace', fontSize: 10 }}>×{avail}</span>
                  </button>
                )
              })}
            </div>

            {/* allocated slots row — click to remove */}
            <div>
              <p style={{ fontFamily: 'monospace', fontSize: 8, color: '#4a5578', marginBottom: 6,
                          textTransform: 'uppercase', letterSpacing: 1 }}>
                Allocated:
              </p>
              <div className="flex gap-2 flex-wrap" style={{ minHeight: 40 }}>
                {Array.from({ length: needed }, (_, i) => {
                  const t = allocatedType(i)
                  const m = t ? E_META[t] : null
                  return (
                    <div
                      key={i}
                      onClick={() => t && remove(t)}
                      title={t ? `Remove — click to undo` : 'Empty slot'}
                      style={{
                        width: 36, height: 36,
                        background: m ? m.color + '22' : '#1d2235',
                        border: `2px solid ${m ? m.color + '88' : '#2e3755'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'monospace', fontSize: 14, fontWeight: 'bold',
                        color: m ? m.color : '#2e3755',
                        cursor: t ? 'pointer' : 'default',
                        transition: 'filter .1s',
                      }}
                      onMouseEnter={e => { if (t) (e.currentTarget as HTMLElement).style.filter = 'brightness(1.3)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.filter = '' }}
                    >
                      {m ? m.letter : '?'}
                    </div>
                  )
                })}
              </div>
              {totalAllocated > 0 && (
                <p style={{ fontFamily: 'monospace', fontSize: 8, color: '#4a5578', marginTop: 5 }}>
                  Click a filled slot to remove it
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── footer buttons ── */}
        <div className="flex items-center justify-end gap-3 px-4 py-3"
             style={{ borderTop: '2px solid #2e3755', background: '#0f1120' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '6px 20px', background: '#1d2235', color: '#8892b8',
              border: '1px solid #2e3755', fontFamily: 'monospace', fontSize: 9,
              fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 2, cursor: 'pointer',
            }}
          >
            CANCEL
          </button>
          <button
            onClick={() => done && onConfirm(alloc)}
            disabled={!done}
            style={{
              padding: '6px 24px',
              background: done ? '#ffd166' : '#2e3755',
              color: done ? '#0c0e1a' : '#4a5578',
              border: 'none',
              fontFamily: "'Press Start 2P', monospace", fontSize: 8,
              boxShadow: done ? '3px 3px 0 #7a5b1e' : 'none',
              cursor: done ? 'pointer' : 'not-allowed',
              transition: 'all .1s',
            }}
          >
            ▶ OK
          </button>
        </div>
      </div>
    </div>
  )
}
