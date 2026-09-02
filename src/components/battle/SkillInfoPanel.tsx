import type { Skill } from '../../types'
import { EnergyCostDisplay } from '../ui/EnergyOrb'

const CLASS_COLOR: Record<string, string> = { physical: '#f45e3f', magic: '#6b9ff5', strategic: '#38d9a9' }

interface SkillInfoPanelProps { skill: Skill | null; charName?: string }

export function SkillInfoPanel({ skill, charName }: SkillInfoPanelProps) {
  if (!skill) {
    return (
      <div className="flex-1 flex items-center justify-center"
           style={{ background: '#0c0e1a' }}>
        <p className="text-px-dim text-xs uppercase tracking-widest"
           style={{ fontFamily: 'monospace' }}>Hover a skill to inspect</p>
      </div>
    )
  }

  const accent = CLASS_COLOR[skill.mainClass] ?? '#8892b8'

  return (
    <div className="flex-1 flex items-stretch gap-0 overflow-hidden"
         style={{ background: '#0c0e1a', borderLeft: `3px solid ${accent}` }}>
      {/* large icon — image when available, letter fallback otherwise */}
      <div className="shrink-0 w-20 flex items-center justify-center font-bold text-4xl overflow-hidden"
           style={{ background: accent + '18', borderRight: `2px solid ${accent}44`, color: accent }}>
        {skill.iconUrl
          ? <img src={skill.iconUrl} alt={skill.name} className="w-full h-full object-cover" />
          : skill.name[0]
        }
      </div>

      {/* content */}
      <div className="flex-1 min-w-0 px-4 py-3 flex flex-col justify-between">
        {/* top row */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-bold text-sm uppercase tracking-wide leading-tight"
               style={{ color: accent, fontFamily: "'Press Start 2P', monospace", fontSize: 10 }}>
              {skill.name}
            </p>
            {charName && (
              <p className="text-px-dim text-[9px] uppercase tracking-widest mt-0.5"
                 style={{ fontFamily: 'monospace' }}>{charName}</p>
            )}
          </div>
          <EnergyCostDisplay cost={skill.cost} size="md" />
        </div>

        {/* description */}
        <p className="text-px-muted text-xs leading-relaxed mt-1.5 line-clamp-2">
          {skill.description}
        </p>

        {/* meta row */}
        <div className="flex items-center gap-4 mt-2 flex-wrap">
          <span className="text-px-dim text-[9px] uppercase tracking-widest"
                style={{ fontFamily: 'monospace' }}>
            CLASSES: <span className="text-px-muted">{skill.mainClass}, {skill.persistence}</span>
            {skill.isAffliction && <span style={{ color: '#a855f7' }}>, Affliction</span>}
          </span>
          <span className="text-px-dim text-[9px] uppercase tracking-widest"
                style={{ fontFamily: 'monospace' }}>
            COOLDOWN: <span style={{ color: skill.cooldown === 0 ? '#38d9a9' : '#ffd166' }}>
              {skill.cooldown === 0 ? 'None' : skill.cooldown}
            </span>
          </span>
          <span className="text-px-dim text-[9px] uppercase tracking-widest"
                style={{ fontFamily: 'monospace' }}>
            TARGET: <span className="text-px-muted">{skill.targetType}</span>
          </span>
        </div>
      </div>
    </div>
  )
}
