import { useState } from 'react'
import type { BattleCharacter, EnergyPool, Skill } from '../../types'
import { HPBar } from '../ui/HPBar'
import { getRarityColor } from '../ui/RarityBadge'
import { isStunned, isInvulnerable, getSkillStreakInfo } from '../../engine/battle'
import { SkillBox, AISkillBox } from './SkillBox'
import { CHARACTER_MAP } from '../../data/characters'

const EFFECT_BADGE: Record<string, { icon: string; color: string }> = {
  stun:                { icon: '⚡', color: '#ffd166' },
  invulnerable:        { icon: '🛡', color: '#38d9a9' },
  damage_reduction:    { icon: '🔰', color: '#6b9ff5' },
  destructible_defense:{ icon: '🧱', color: '#8892b8' },
  damage_boost:        { icon: '🔥', color: '#f45e3f' },
  affliction:          { icon: '☠', color: '#a855f7' },
}

const CLASS_COLOR: Record<string, string> = {
  physical:  '#f45e3f',
  magic:     '#6b9ff5',
  strategic: '#38d9a9',
}

// ─── Queued-skill badge + hover tooltip ───────────────────────────────────────

export interface IncomingQueued { skill: Skill; sourceName: string; casterIdx: number; bonus?: number }

interface QueuedSkillBadgeProps {
  item:     IncomingQueued
  index:    number
  side:     'player' | 'ai'
  onRemove: () => void
}

function QueuedSkillBadge({ item: { skill, sourceName, bonus }, index, side, onRemove }: QueuedSkillBadgeProps) {
  const [hovered, setHovered] = useState(false)
  const accent = CLASS_COLOR[skill.mainClass] ?? '#8892b8'

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={e => e.stopPropagation()}
      style={{
        position: 'absolute',
        top: 2 + index * 22,
        right: 2,
        zIndex: 50,
      }}
    >
      {/* tiny badge icon — skill image if available, letter fallback */}
      <div
        className="flex items-center justify-center font-bold cursor-default select-none overflow-hidden"
        style={{
          width: 20, height: 20,
          background: skill.iconUrl ? 'transparent' : accent,
          color: '#0c0e1a',
          fontSize: 9,
          fontFamily: "'Press Start 2P', monospace",
          outline: '2px solid rgba(0,0,0,.6)',
          boxShadow: '0 2px 4px rgba(0,0,0,.6)',
        }}
        title={skill.name}
      >
        {skill.iconUrl
          ? <img src={skill.iconUrl} alt={skill.name} style={{ width: 20, height: 20, objectFit: 'cover' }} />
          : skill.name[0]
        }
      </div>

      {/* stack-bonus strip at bottom of badge — e.g. "+10" for Haymaker */}
      {bonus && bonus > 0 && (
        <div
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: '#f45e3f', color: '#fff',
            fontSize: 6, fontFamily: "'Press Start 2P', monospace",
            textAlign: 'center', lineHeight: '10px', height: 10,
          }}
        >
          +{bonus}
        </div>
      )}

      {/* tooltip on hover */}
      {hovered && (
        <div
          style={{
            position: 'absolute',
            ...(side === 'ai'
              ? { top: -2, right: 24 }          // AI: floats left toward battle center
              : { bottom: '110%', right: -2 }    // player: floats above the badge
            ),
            width: 200,
            background: '#0c0e1a',
            border: `1px solid ${accent}66`,
            borderLeft: `3px solid ${accent}`,
            boxShadow: '0 4px 16px rgba(0,0,0,.8)',
            zIndex: 50,
            pointerEvents: 'auto',
          }}
        >
          {/* header */}
          <div
            className="flex items-center justify-between gap-1 px-2 py-1.5"
            style={{ background: accent + '22', borderBottom: `1px solid ${accent}33` }}
          >
            <span
              className="font-bold truncate leading-tight"
              style={{ color: accent, fontFamily: "'Press Start 2P', monospace", fontSize: 8 }}
            >
              {skill.name.toUpperCase()}
            </span>
            <button
              onClick={e => { e.stopPropagation(); onRemove() }}
              className="shrink-0 flex items-center justify-center font-bold"
              style={{
                width: 16, height: 16,
                background: '#1d2235', color: '#8892b8',
                fontSize: 13, lineHeight: 1,
                border: '1px solid #2e3755',
              }}
            >
              ×
            </button>
          </div>

          {/* description */}
          <div className="px-2 pt-2">
            <p
              className="text-px-muted leading-snug"
              style={{
                fontSize: 10,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {skill.description}
            </p>
          </div>

          {/* effects list — shows every buff/debuff with value and duration */}
          {skill.effects.length > 0 && (
            <div className="px-2 py-1.5 flex flex-col gap-1"
                 style={{ borderTop: '1px solid #1d2235', marginTop: 4 }}>
              {skill.effects.map((e, i) => {
                const typeLabel = e.type.replace(/_/g, ' ')
                const valueStr = ['damage', 'pierce_damage', 'affliction', 'heal'].includes(e.type)
                  ? `${e.value} dmg`
                  : ['damage_reduction', 'destructible_defense', 'damage_boost'].includes(e.type)
                  ? `${e.value} pts`
                  : e.type === 'energy_gain' || e.type === 'energy_drain'
                  ? `${e.value} energy`
                  : null
                const durStr = e.duration > 1 ? ` · ${e.duration}t` : ''
                return (
                  <div key={i} className="flex items-center gap-1.5">
                    <span style={{ fontSize: 8, color: accent, fontFamily: 'monospace',
                                   textTransform: 'uppercase', minWidth: 0, flexShrink: 0 }}>
                      ▸
                    </span>
                    <span style={{ fontSize: 9, color: '#c8cfe8' }}>
                      <span style={{ textTransform: 'capitalize' }}>{typeLabel}</span>
                      {valueStr && <span style={{ color: accent }}> {valueStr}</span>}
                      {durStr  && <span style={{ color: '#6a7a9c' }}>{durStr}</span>}
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          {/* meta footer */}
          <div
            className="flex items-center gap-2 px-2 py-1 flex-wrap"
            style={{ borderTop: '1px solid #1d2235' }}
          >
            <span style={{ fontSize: 8, color: '#8892b8', fontFamily: 'monospace' }}>
              from <span style={{ color: '#e2e8ff' }}>{sourceName}</span>
            </span>
            <span style={{ fontSize: 8, color: '#4a5578', fontFamily: 'monospace' }}>·</span>
            <span style={{ fontSize: 8, color: accent, fontFamily: 'monospace', textTransform: 'uppercase' }}>
              {skill.mainClass}
            </span>
            {skill.cooldown > 0 && (
              <>
                <span style={{ fontSize: 8, color: '#4a5578', fontFamily: 'monospace' }}>·</span>
                <span style={{ fontSize: 8, color: '#ffd166', fontFamily: 'monospace' }}>
                  CD:{skill.cooldown}
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Player self/ally queued-skill badge — larger, image-first, no × clutter ──

function PlayerQueueBadge({ item: { skill, bonus }, index, onRemove: _onRemove }: {
  item: IncomingQueued; index: number; onRemove: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const accent = CLASS_COLOR[skill.mainClass] ?? '#8892b8'

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={e => e.stopPropagation()}
      style={{
        position: 'absolute',
        top: 2 + index * 46,
        right: 2,
        zIndex: 50,
        filter: 'drop-shadow(0 2px 6px rgba(0,0,0,.9))',
        cursor: 'default',
      }}
    >
      {/* skill image — 40×40 matching skill-box proportions */}
      <div style={{
        width: 40, height: 40,
        overflow: 'hidden',
        border: `2px solid ${accent}`,
        outline: `1px solid rgba(0,0,0,.7)`,
        position: 'relative',
      }}>
        {skill.iconUrl
          ? <img src={skill.iconUrl} alt={skill.name}
                 style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', background: accent + '33',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: accent, fontSize: 18, fontWeight: 'bold' }}>
              {skill.name[0]}
            </div>
        }
        {/* ★ queued indicator */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: accent + 'cc', textAlign: 'center',
          fontSize: 6, fontFamily: "'Press Start 2P', monospace",
          color: '#0c0e1a', lineHeight: '10px', padding: '1px 0',
        }}>
          {bonus ? `+${bonus}` : '★'}
        </div>
      </div>

      {/* tooltip */}
      {hovered && (
        <div style={{
          position: 'absolute',
          top: -2,
          left: 44,
          width: 200,
          background: '#0c0e1a',
          border: `1px solid ${accent}66`,
          borderLeft: `3px solid ${accent}`,
          boxShadow: '0 4px 16px rgba(0,0,0,.9)',
          zIndex: 60,
          pointerEvents: 'none',
        }}>
          {/* header */}
          <div style={{ background: accent + '22', borderBottom: `1px solid ${accent}33`,
                        padding: '6px 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
            {skill.iconUrl && (
              <img src={skill.iconUrl} alt="" style={{ width: 24, height: 24, objectFit: 'cover', flexShrink: 0 }} />
            )}
            <span style={{ color: accent, fontFamily: "'Press Start 2P', monospace",
                           fontSize: 8, fontWeight: 'bold' }}>
              {skill.name.toUpperCase()}
            </span>
          </div>
          {/* description */}
          <div style={{ padding: '6px 8px' }}>
            <p style={{ fontSize: 10, color: '#8892b8', lineHeight: 1.4 }}>{skill.description}</p>
          </div>
          {/* effects */}
          {skill.effects.length > 0 && (
            <div style={{ padding: '4px 8px 6px', borderTop: '1px solid #1d2235',
                          display: 'flex', flexDirection: 'column', gap: 3 }}>
              {skill.effects.map((e, i) => {
                const typeLabel = e.type.replace(/_/g, ' ')
                const valStr = ['damage', 'pierce_damage', 'affliction', 'heal'].includes(e.type)
                  ? `${e.value} dmg`
                  : ['damage_reduction', 'destructible_defense', 'damage_boost'].includes(e.type)
                  ? `${e.value} pts`
                  : e.type.includes('energy') ? `${e.value} energy` : null
                const durStr = e.duration > 1 ? ` · ${e.duration}t` : ''
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ color: accent, fontSize: 8 }}>▸</span>
                    <span style={{ fontSize: 9, color: '#c8cfe8', textTransform: 'capitalize' }}>
                      {typeLabel}
                      {valStr && <span style={{ color: accent }}> {valStr}</span>}
                      {durStr && <span style={{ color: '#6a7a9c' }}>{durStr}</span>}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
          {/* remove hint */}
          <div style={{ padding: '3px 8px', borderTop: '1px solid #1d2235',
                        fontSize: 8, color: '#4a5578', fontFamily: 'monospace' }}>
            Click skill box again to remove
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Cast skill badge — groups all active effects by source skill, skill icon + tooltip ──

const EFFECT_LABEL: Record<string, string> = {
  stun:                'Stunned',
  invulnerable:        'Invulnerable',
  damage_reduction:    'Damage Reduction',
  destructible_defense:'Destructible Shield',
  damage_boost:        'Damage Boost',
  affliction:          'Affliction',
}

function CastSkillBadge({ skillId, charId, effects, index, markCount, side }: {
  skillId: string; charId: string
  effects: import('../../types').ActiveEffect[]
  index: number; markCount: number; side: 'player' | 'ai'
}) {
  const [hovered, setHovered] = useState(false)
  const srcSkill = CHARACTER_MAP[charId]?.skills.find(s => s.id === skillId)
  const accent = CLASS_COLOR[srcSkill?.mainClass ?? 'strategic'] ?? '#8892b8'
  const minTurns = Math.max(0, Math.min(...effects.map(ae => ae.turnsLeft - 1)))

  return (
    <div
      onClick={e => e.stopPropagation()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'absolute',
        top: 2 + (markCount + index) * 46,
        left: 2,
        zIndex: 45,
        filter: 'drop-shadow(0 2px 5px rgba(0,0,0,.85))',
        cursor: 'default',
      }}
    >
      {/* 40×40 skill icon */}
      <div style={{ width: 40, height: 40, overflow: 'hidden',
                    border: `2px solid ${accent}`, outline: '1px solid rgba(0,0,0,.6)', position: 'relative' }}>
        {srcSkill?.iconUrl
          ? <img src={srcSkill.iconUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', background: accent + '33',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: accent, fontSize: 18, fontWeight: 'bold' }}>
              {srcSkill?.name[0] ?? '?'}
            </div>
        }
      </div>
      {/* turns strip */}
      <div style={{ background: accent + 'dd', color: '#0c0e1a', textAlign: 'center',
                    fontSize: 6, fontFamily: "'Press Start 2P', monospace",
                    lineHeight: '10px', padding: '1px 0' }}>
        {minTurns}t
      </div>

      {/* tooltip */}
      {hovered && (
        <div style={{
          position: 'absolute', top: -2,
          ...(side === 'ai' ? { right: 44 } : { left: 44 }),
          width: 210,
          background: '#0c0e1a',
          border: `1px solid ${accent}66`,
          borderLeft: `3px solid ${accent}`,
          boxShadow: '0 4px 16px rgba(0,0,0,.9)',
          zIndex: 60, pointerEvents: 'none',
        }}>
          {/* header */}
          <div style={{ background: accent + '22', borderBottom: `1px solid ${accent}33`,
                        padding: '5px 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
            {srcSkill?.iconUrl && (
              <img src={srcSkill.iconUrl} alt="" style={{ width: 22, height: 22, objectFit: 'cover', flexShrink: 0 }} />
            )}
            <span style={{ color: accent, fontFamily: "'Press Start 2P', monospace",
                           fontSize: 8, fontWeight: 'bold' }}>
              {(srcSkill?.name ?? skillId).toUpperCase()}
            </span>
          </div>
          {/* active effects detail */}
          <div style={{ padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 5 }}>
            {effects.map(ae => {
              const meta = EFFECT_BADGE[ae.effect.type]
              const label = EFFECT_LABEL[ae.effect.type] ?? ae.effect.type.replace(/_/g, ' ')
              const turns = Math.max(0, ae.turnsLeft - 1)
              const valueStr = ae.effect.type === 'damage_reduction'    ? `Reduces damage by ${ae.effect.value}`
                             : ae.effect.type === 'destructible_defense' ? `Shield: ${ae.effect.value} remaining`
                             : ae.effect.type === 'damage_boost'        ? `+${ae.effect.value} to all attacks`
                             : ae.effect.type === 'stun'                ? 'Cannot act'
                             : ae.effect.type === 'invulnerable'        ? 'Cannot be targeted'
                             : null
              return (
                <div key={ae.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                  {meta && <span style={{ fontSize: 13, flexShrink: 0, lineHeight: 1.2 }}>{meta.icon}</span>}
                  <div>
                    <p style={{ fontSize: 9, color: accent, fontWeight: 'bold',
                                textTransform: 'capitalize', lineHeight: 1.3 }}>{label}</p>
                    {valueStr && <p style={{ fontSize: 9, color: '#c8cfe8', lineHeight: 1.3 }}>{valueStr}</p>}
                    <p style={{ fontSize: 8, color: '#6a7a9c', lineHeight: 1.3 }}>
                      {turns > 0 ? `${turns} turn${turns !== 1 ? 's' : ''} remaining` : 'Expires this turn'}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Damage-mark badge (persistent combo indicator) ──────────────────────────

interface DamageMarkBadgeProps {
  index:    number
  srcSkill: Skill | undefined
  bonus:    number
  turnsLeft: number
  side:     'player' | 'ai'
}

function DamageMarkBadge({ index, srcSkill, bonus, turnsLeft, side }: DamageMarkBadgeProps) {
  const [hovered, setHovered] = useState(false)
  const accent = '#f45e3f'

  return (
    <div
      onClick={e => e.stopPropagation()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'absolute',
        top: 2 + index * 32,
        left: 2,
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,.8))',
        cursor: 'default',
      }}
    >
      {/* skill icon */}
      <div style={{ width: 24, height: 24, overflow: 'hidden', border: `2px solid ${accent}`, outline: '1px solid rgba(0,0,0,.6)' }}>
        {srcSkill?.iconUrl
          ? <img src={srcSkill.iconUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', background: accent, color: '#0c0e1a',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 10, fontFamily: "'Press Start 2P', monospace" }}>
              {srcSkill?.name[0] ?? '!'}
            </div>
        }
      </div>

      {/* bonus strip */}
      <div style={{
        background: accent, color: '#0c0e1a',
        fontSize: 6, fontFamily: "'Press Start 2P', monospace",
        padding: '1px 3px', whiteSpace: 'nowrap', lineHeight: '10px',
      }}>
        +{bonus}
      </div>

      {/* tooltip on hover / click */}
      {hovered && srcSkill && (
        <div
          style={{
            position: 'absolute',
            top: -2,
            ...(side === 'ai' ? { right: 28 } : { left: 28 }),
            width: 200,
            background: '#0c0e1a',
            border: `1px solid ${accent}66`,
            borderLeft: `3px solid ${accent}`,
            boxShadow: '0 4px 16px rgba(0,0,0,.9)',
            zIndex: 60,
            pointerEvents: 'none',
          }}
        >
          {/* header */}
          <div className="flex items-center gap-2 px-2 py-1.5"
               style={{ background: accent + '22', borderBottom: `1px solid ${accent}33` }}>
            {srcSkill.iconUrl && (
              <img src={srcSkill.iconUrl} alt="" style={{ width: 20, height: 20, objectFit: 'cover', flexShrink: 0 }} />
            )}
            <span className="font-bold truncate"
                  style={{ color: accent, fontFamily: "'Press Start 2P', monospace", fontSize: 8 }}>
              {srcSkill.name.toUpperCase()}
            </span>
          </div>

          {/* combo info */}
          <div className="px-2 py-2 flex flex-col gap-1">
            <p style={{ fontSize: 10, color: '#c8cfe8', lineHeight: 1.4 }}>
              Combo active on this opponent.
            </p>
            <p style={{ fontSize: 10, color: '#f45e3f', lineHeight: 1.4, fontWeight: 'bold' }}>
              Next Haymaker deals +{bonus} extra pierce damage.
            </p>
            <p style={{ fontSize: 9, color: '#8892b8', lineHeight: 1.4 }}>
              {turnsLeft > 0
                ? `Use it on the source wrestler's next turn or the combo resets.`
                : 'Combo window expired.'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Portrait ─────────────────────────────────────────────────────────────────

interface PortraitProps {
  bc:             BattleCharacter
  side:           'player' | 'ai'
  active:         boolean
  targeted:       boolean
  incomingQueued: IncomingQueued[]
  onRemoveQueued: (casterIdx: number) => void
  onClick?:       () => void
}

function Portrait({ bc, side, active, targeted, incomingQueued, onRemoveQueued, onClick }: PortraitProps) {
  const { character, hp, maxHp, isDead, activeEffects } = bc
  const rc = getRarityColor(character.rarity)
  const stunned = isStunned(bc)
  const invu = isInvulnerable(bc)
  const borderColor = targeted ? '#6b9ff5' : active ? '#ffd166' : isDead ? '#1d2235' : rc + '88'
  // separate marks (image badges) from status badges
  const markEffects   = activeEffects.filter(ae => ae.effect.type === 'damage_mark')
  const statusEffects = activeEffects.filter(ae => EFFECT_BADGE[ae.effect.type])

  return (
    <div
      className="flex flex-col items-center gap-1 shrink-0"
      style={{
        width: 108, position: 'relative', overflow: 'visible',
        cursor: onClick && !isDead ? 'pointer' : 'default',
      }}
      onClick={!isDead ? onClick : undefined}
    >
      {/* portrait box — visual only, click handled by wrapper */}
      <div
        className="relative flex items-center justify-center font-bold text-white"
        style={{
          width: 104, height: 104, flexShrink: 0,
          border: `3px solid ${borderColor}`,
          boxShadow: targeted ? undefined : active ? '0 0 8px #ffd16644' : 'none',
          animation: targeted ? 'target-blink 1.1s ease-in-out infinite' : 'none',
          opacity: isDead ? 0.35 : 1,
          transition: 'box-shadow .2s',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div className={`absolute inset-0 ${character.avatarColor}`} />
        <div className="relative z-10 flex items-center justify-center w-full h-full">
          {character.avatarUrl
            ? <img src={character.avatarUrl} alt="" className="w-full h-full object-cover" />
            : <span style={{ fontSize: 32 }}>{character.name[0]}</span>
          }
        </div>
        {stunned && !isDead && (
          <div className="absolute inset-0 flex items-center justify-center text-lg z-20"
               style={{ background: 'rgba(255,209,102,.28)' }}>⚡</div>
        )}
        {invu && !isDead && (
          <div className="absolute inset-0 flex items-center justify-center text-lg z-20"
               style={{ background: 'rgba(56,217,169,.28)' }}>🛡</div>
        )}
        {isDead && (
          <div className="absolute inset-0 flex items-center justify-center font-bold z-20"
               style={{ background: 'rgba(0,0,0,.7)', color: '#f45e3f', fontSize: 28 }}>✕</div>
        )}
        {targeted && !isDead && (
          <div className="absolute inset-0 pointer-events-none z-20"
               style={{ border: '2px solid #6b9ff5', outline: '1px solid #6b9ff544' }} />
        )}
      </div>

      {/* queued skill badges — larger image badge for player (self/ally cast), small badge for AI */}
      {incomingQueued.map((item, i) =>
        side === 'player'
          ? <PlayerQueueBadge key={item.casterIdx} item={item} index={i} onRemove={() => onRemoveQueued(item.casterIdx)} />
          : <QueuedSkillBadge key={item.casterIdx} item={item} index={i} side={side} onRemove={() => onRemoveQueued(item.casterIdx)} />
      )}

      {/* damage_mark combo badges — persistent, shows Haymaker icon + next bonus */}
      {markEffects.map((ae, i) => {
          const srcSkill = CHARACTER_MAP[ae.sourceCharacterId]?.skills.find(s => s.id === ae.sourceSkillId)
          return (
            <DamageMarkBadge
              key={ae.key}
              index={i}
              srcSkill={srcSkill}
              bonus={ae.effect.value}
              turnsLeft={ae.turnsLeft}
              side={side}
            />
          )
        })}

      {/* active status effect badges — grouped by source skill, icon + full tooltip */}
      {(() => {
        const bySkill = new Map<string, { charId: string; effects: import('../../types').ActiveEffect[] }>()
        for (const ae of statusEffects) {
          const key = `${ae.sourceCharacterId}_${ae.sourceSkillId}`
          if (!bySkill.has(key)) bySkill.set(key, { charId: ae.sourceCharacterId, effects: [] })
          bySkill.get(key)!.effects.push(ae)
        }
        return [...bySkill.entries()].map(([key, { charId, effects }], i) => (
          <CastSkillBadge
            key={key}
            skillId={effects[0].sourceSkillId}
            charId={charId}
            effects={effects}
            index={i}
            markCount={markEffects.length}
            side={side}
          />
        ))
      })()}

      {/* name */}
      <p className="font-bold truncate text-center w-full"
         style={{ color: isDead ? '#4a5578' : '#c8cfe8', fontFamily: 'monospace', fontSize: 9 }}>
        {character.name.toUpperCase()}
      </p>

      {/* HP bar */}
      <div className="w-full px-0.5">
        <HPBar hp={hp} maxHp={maxHp} size="sm" showNumbers />
      </div>
    </div>
  )
}

// ─── Row ──────────────────────────────────────────────────────────────────────

interface CharacterRowProps {
  slot:                number
  playerChar:          BattleCharacter
  aiChar:              BattleCharacter
  playerSelected:      boolean
  aiTargeted:          boolean
  playerTargeted:      boolean
  queuedSkillId?:      string
  pendingSkillId:      string | null
  playerEnergy:        EnergyPool
  isPlayerTurn:        boolean
  incomingQueued:      IncomingQueued[]    // skills queued against AI char
  playerIncomingQueued:IncomingQueued[]    // self/ally skills queued on player char
  currentTurn:         number
  onPlayerClick:       () => void
  onAIClick:           () => void
  onSkillClick:        (skillId: string, slot: number) => void
  onSkillHover:        (skill: Skill | null) => void
  onRemoveQueued:      (casterIdx: number) => void
}

export function CharacterRow({
  slot, playerChar, aiChar,
  playerSelected, aiTargeted, playerTargeted,
  queuedSkillId, pendingSkillId, playerEnergy,
  isPlayerTurn, incomingQueued, playerIncomingQueued, currentTurn,
  onPlayerClick, onAIClick, onSkillClick, onSkillHover, onRemoveQueued,
}: CharacterRowProps) {
  const rowBg = playerSelected
    ? 'rgba(255,209,102,.04)'
    : aiTargeted
    ? 'rgba(107,159,245,.04)'
    : 'transparent'

  return (
    <div
      className="flex items-center w-full transition-colors"
      style={{ background: rowBg, borderBottom: '1px solid #1d2235', padding: '8px 16px', gap: 0 }}
    >
      {/* ── PLAYER side ── */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Portrait
          bc={playerChar}
          side="player"
          active={playerSelected}
          targeted={playerTargeted}
          incomingQueued={playerIncomingQueued}
          onRemoveQueued={onRemoveQueued}
          onClick={onPlayerClick}
        />
        <div className="flex gap-1.5 ml-2">
          {playerChar.character.skills.map(skill => {
            const streakEffect = skill.effects.find(e => e.stackIncrement && e.stackDecayTurns)
            const streak = streakEffect
              ? getSkillStreakInfo(playerChar, skill.id, streakEffect.stackIncrement!, streakEffect.stackDecayTurns!, currentTurn)
              : null
            return (
              <SkillBox
                key={skill.id}
                skill={skill}
                battleChar={playerChar}
                pool={playerEnergy}
                isQueued={queuedSkillId === skill.id}
                isPending={pendingSkillId === skill.id && playerSelected}
                clickable={isPlayerTurn && !playerChar.isDead && !isStunned(playerChar)}
                streak={streak}
                onHover={onSkillHover}
                onClick={() => onSkillClick(skill.id, slot)}
                onDoubleClick={() => onSkillClick(skill.id, slot)}
              />
            )
          })}
        </div>
      </div>

      {/* wrestling ring rope divider */}
      <div className="mx-3 shrink-0" style={{ width: 3, height: 80, background: 'linear-gradient(#1d2235, #c42b2b 30%, #fff 48%, #c42b2b 52%, #c42b2b 70%, #1d2235)' }} />

      {/* ── AI side (reversed) ── */}
      <div className="flex items-center gap-2 flex-1 min-w-0 flex-row-reverse">
        <Portrait
          bc={aiChar}
          side="ai"
          active={false}
          targeted={aiTargeted}
          incomingQueued={incomingQueued}
          onRemoveQueued={onRemoveQueued}
          onClick={aiTargeted ? onAIClick : undefined}
        />
        <div className="flex gap-1.5 mr-2 flex-row-reverse">
          {aiChar.character.skills.map(skill => (
            <AISkillBox key={skill.id} skill={skill} />
          ))}
        </div>
      </div>
    </div>
  )
}
