import type { BattleCharacter } from '../../types'
import { HPBar } from '../ui/HPBar'
import { getRarityColor } from '../ui/RarityBadge'
import { isStunned, isInvulnerable } from '../../engine/battle'

const EFFECT_ICON: Record<string, { icon: string; color: string }> = {
  stun:                { icon: '⚡', color: '#ffd166' },
  invulnerable:        { icon: '🛡', color: '#38d9a9' },
  damage_reduction:    { icon: '🔰', color: '#6b9ff5' },
  destructible_defense:{ icon: '🧱', color: '#8892b8' },
  damage_boost:        { icon: '🔥', color: '#f45e3f' },
  next_damage_boost:   { icon: '↑', color: '#f45e3f' },
  damage_penalty:      { icon: '↓', color: '#8892b8' },
  affliction:          { icon: '☠', color: '#a855f7' },
  heal:                { icon: '💚', color: '#38d9a9' },
  domino_mark:         { icon: '●', color: '#f97316' },
  heal_on_damage:      { icon: '✚', color: '#38d9a9' },
  death_prevention:    { icon: '✦', color: '#ffd166' },
  interference:        { icon: '⚠', color: '#6b9ff5' },
  skill_cancel:        { icon: '×', color: '#f45e3f' },
  play_dead_mark:      { icon: '◆', color: '#f45e3f' },
}

interface BattleCharSlotProps {
  battleChar: BattleCharacter
  side: 'player' | 'ai'
  selected: boolean
  targeted: boolean
  queuedSkillName?: string
  onClick: () => void
}

export function BattleCharSlot({ battleChar, side: _side, selected, targeted, queuedSkillName, onClick }: BattleCharSlotProps) {
  const { character, hp, maxHp, isDead, activeEffects } = battleChar
  const rc = getRarityColor(character.rarity)
  const stunned = isStunned(battleChar)
  const invu = isInvulnerable(battleChar)

  const uniqueEffects = [...new Map(activeEffects.map(ae => [ae.effect.type, ae])).values()]

  return (
    <button
      onClick={onClick}
      disabled={isDead}
      className="relative flex flex-col items-center gap-1.5 p-2 transition-all w-full"
      style={{
        background: isDead ? '#0c0e1a' : selected ? 'rgba(255,209,102,.07)' : targeted ? 'rgba(107,159,245,.07)' : '#141726',
        border: isDead ? '2px solid #1d2235' : selected ? '2px solid #ffd166' : targeted ? '2px solid #6b9ff5' : '2px solid #2e3755',
        opacity: isDead ? 0.4 : 1,
        cursor: isDead ? 'not-allowed' : 'pointer',
        minWidth: 80,
      }}
    >
      {/* top color bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: isDead ? '#2e3755' : rc }} />

      {/* avatar */}
      <div
        className={`w-12 h-12 flex items-center justify-center font-bold text-xl text-white overflow-hidden ${character.avatarColor}`}
        style={{ border: `2px solid ${isDead ? '#2e3755' : rc}55`, position: 'relative', flexShrink: 0 }}
      >
        {character.avatarUrl
          ? <img src={character.avatarUrl} alt="" className="w-full h-full object-cover" />
          : character.name[0]
        }
        {/* status overlays */}
        {stunned && !isDead && (
          <div className="absolute inset-0 flex items-center justify-center text-base"
               style={{ background: 'rgba(255,209,102,.3)' }}>⚡</div>
        )}
        {invu && !isDead && (
          <div className="absolute inset-0 flex items-center justify-center text-base"
               style={{ background: 'rgba(56,217,169,.3)' }}>🛡</div>
        )}
        {isDead && (
          <div className="absolute inset-0 flex items-center justify-center text-base"
               style={{ background: 'rgba(0,0,0,.6)' }}>✕</div>
        )}
      </div>

      {/* name */}
      <p className="text-px-text font-bold text-xs truncate max-w-full px-1">{character.name}</p>

      {/* HP bar */}
      <div className="w-full px-1">
        <HPBar hp={hp} maxHp={maxHp} size="sm" showNumbers />
      </div>

      {/* active effects row */}
      {uniqueEffects.length > 0 && (
        <div className="flex gap-0.5 flex-wrap justify-center">
          {uniqueEffects.slice(0, 4).map(ae => {
            const meta = EFFECT_ICON[ae.effect.type]
            if (!meta) return null
            return (
              <span key={ae.key} title={`${ae.effect.type} (${ae.turnsLeft}t)`}
                    className="text-[9px] px-1 py-0.5 font-bold"
                    style={{ background: meta.color + '22', color: meta.color, border: `1px solid ${meta.color}44` }}>
                {meta.icon}{ae.turnsLeft}
              </span>
            )
          })}
        </div>
      )}

      {/* queued skill badge */}
      {queuedSkillName && !isDead && (
        <div className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 text-[8px] font-bold uppercase truncate max-w-24"
             style={{ background: '#ffd166', color: '#0c0e1a', fontFamily: 'monospace' }}>
          {queuedSkillName}
        </div>
      )}

      {/* targeting ring */}
      {targeted && !isDead && (
        <div className="absolute inset-0 pointer-events-none"
             style={{ border: '2px solid #6b9ff5', boxShadow: '0 0 8px #6b9ff566' }} />
      )}
    </button>
  )
}
