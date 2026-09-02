import type { Skill } from '../../types'
import { EnergyCostDisplay } from './EnergyOrb'

const CLASS_COLOR: Record<string, string> = {
  physical:  '#f45e3f',
  magic:     '#6b9ff5',
  strategic: '#38d9a9',
}

interface SkillCardProps {
  skill: Skill
  selected?: boolean
  disabled?: boolean
  cooldownLeft?: number
  onClick?: () => void
}

export function SkillCard({ skill, selected, disabled, cooldownLeft = 0, onClick }: SkillCardProps) {
  const onCooldown = cooldownLeft > 0
  const blocked = disabled || onCooldown
  const accent = CLASS_COLOR[skill.mainClass] ?? '#8892b8'

  return (
    <button
      onClick={onClick}
      disabled={blocked}
      className="relative w-full text-left transition-all group"
      style={{
        background: selected ? 'rgba(255,209,102,.07)' : blocked ? 'rgba(13,15,26,.5)' : '#1d2235',
        border: `1px solid ${selected ? '#ffd166' : blocked ? '#2e3755' : '#2e3755'}`,
        borderLeft: `3px solid ${blocked ? '#2e3755' : accent}`,
        opacity: blocked && !onCooldown ? 0.45 : 1,
        cursor: blocked ? 'not-allowed' : 'pointer',
      }}
    >
      <div className="flex items-center gap-3 px-3 py-2">
        {/* icon square — image when available, letter fallback */}
        <div
          className="shrink-0 w-9 h-9 flex items-center justify-center font-bold text-base overflow-hidden"
          style={{ background: `${accent}22`, border: `1px solid ${accent}44`, color: accent }}
        >
          {skill.iconUrl
            ? <img src={skill.iconUrl} alt={skill.name} className="w-full h-full object-cover" />
            : skill.name[0]
          }
        </div>

        {/* main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="font-bold text-sm text-px-text uppercase tracking-wide">{skill.name}</span>
            {skill.isAffliction && (
              <span className="text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5"
                    style={{ background: 'rgba(244,94,63,.15)', color: '#f45e3f', border: '1px solid #f45e3f44', fontFamily: 'monospace' }}>
                Affliction
              </span>
            )}
          </div>
          <p className="text-xs text-px-muted leading-relaxed mt-0.5 line-clamp-2">{skill.description}</p>
        </div>

        {/* meta column */}
        <div className="shrink-0 flex flex-col items-end gap-1.5">
          <EnergyCostDisplay cost={skill.cost} size="sm" />
          <div className="flex gap-2 text-px-dim" style={{ fontSize: 9, fontFamily: 'monospace' }}>
            {skill.cooldown > 0 && <span className="text-px-muted">CD:{skill.cooldown}</span>}
            <span className="uppercase">{skill.persistence[0].toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* cooldown overlay */}
      {onCooldown && (
        <div className="absolute inset-0 flex items-center justify-center"
             style={{ background: 'rgba(12,14,26,.7)' }}>
          <span className="text-px-gold font-bold text-2xl"
                style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 16 }}>
            {cooldownLeft}
          </span>
        </div>
      )}
    </button>
  )
}
