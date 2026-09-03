import type { BattleCharacter, EnergyPool } from '../../types'
import { SkillCard } from '../ui/SkillCard'
import { isStunned, canAfford, getEffectiveSkill, getSkillCooldownLeft } from '../../engine/battle'

interface SkillPanelProps {
  battleChar: BattleCharacter
  pool: EnergyPool
  selectedSkillId: string | null
  queuedSkillId?: string
  onSelectSkill: (skillId: string) => void
}

export function SkillPanel({ battleChar, pool, selectedSkillId, queuedSkillId, onSelectSkill }: SkillPanelProps) {
  const { character } = battleChar
  const stunned = isStunned(battleChar)

  return (
    <div className="flex flex-col gap-0">
      <div className="px-3 py-2 flex items-center gap-2"
           style={{ background: '#141726', borderBottom: '1px solid #2e3755' }}>
        <span className="text-px-dim text-[9px] font-bold uppercase tracking-widest" style={{ fontFamily: 'monospace' }}>
          SKILLS
        </span>
        <span className="text-px-gold font-bold text-xs ml-1">{character.name}</span>
        {stunned && <span className="text-[9px] px-1.5 py-0.5 font-bold"
                         style={{ background: 'rgba(255,209,102,.15)', color: '#ffd166', border: '1px solid #ffd16644', fontFamily: 'monospace' }}>STUNNED</span>}
      </div>
      <div className="flex flex-col">
        {character.skills.map(baseSkill => {
          const skill = getEffectiveSkill(battleChar, baseSkill)
          const cooldownLeft = getSkillCooldownLeft(battleChar, baseSkill.id)
          const cantAfford = !canAfford(skill.cost, pool)
          const isQueued = queuedSkillId === baseSkill.id
          return (
            <SkillCard
              key={baseSkill.id}
              skill={skill}
              selected={selectedSkillId === baseSkill.id || isQueued}
              disabled={stunned || battleChar.isDead || (cantAfford && cooldownLeft === 0)}
              cooldownLeft={cooldownLeft}
              onClick={() => onSelectSkill(baseSkill.id)}
            />
          )
        })}
      </div>
    </div>
  )
}
