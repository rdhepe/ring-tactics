import { useState } from 'react'
import type { Character } from '../../types'
import { getRarityColor, RarityBadge } from '../ui/RarityBadge'
import { SkillCard } from '../ui/SkillCard'
import { EnergyCostDisplay } from '../ui/EnergyOrb'
import { HPBar } from '../ui/HPBar'

interface CharacterDetailProps {
  character: Character
  onSelect?: () => void
  selected?: boolean
  selectLabel?: string
}

export function CharacterDetail({ character, onSelect, selected, selectLabel = 'Add to Team' }: CharacterDetailProps) {
  const [activeIdx, setActiveIdx] = useState(0)
  const active = character.skills[activeIdx]
  const rc = getRarityColor(character.rarity)

  return (
    <div className="arena-detail flex flex-col gap-0">
      {/* header strip */}
      <div className="flex items-stretch gap-0" style={{ borderBottom: '2px solid #2e3755' }}>
        <div
          className={`w-28 h-28 shrink-0 flex items-center justify-center text-4xl font-bold text-white overflow-hidden ${character.avatarColor}`}
          style={{ borderRight: `3px solid ${rc}` }}
        >
          {character.avatarUrl
            ? <img src={character.avatarUrl} alt="" className="w-full h-full object-cover" />
            : character.name[0]
          }
        </div>
        <div className="flex-1 px-4 py-3 flex flex-col justify-center gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-px-text font-bold text-lg uppercase tracking-wider leading-none">
              {character.name}
            </h2>
            <RarityBadge rarity={character.rarity} />
          </div>
          {character.title && (
            <p className="text-px-muted text-xs italic">{character.title}</p>
          )}
          <div className="flex gap-1 flex-wrap mt-0.5">
            {character.classes.map(cls => (
              <span key={cls} className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5"
                    style={{ background: '#1d2235', color: '#8892b8', border: '1px solid #2e3755', fontFamily: 'monospace' }}>
                {cls}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* hp bar */}
      <div className="px-4 py-3" style={{ borderBottom: '1px solid #2e3755' }}>
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-px-dim text-[9px] font-bold uppercase tracking-widest" style={{ fontFamily: 'monospace' }}>HP</span>
          <span className="text-px-muted text-[10px] font-bold" style={{ fontFamily: 'monospace' }}>{character.maxHp}</span>
        </div>
        <HPBar hp={character.maxHp} maxHp={character.maxHp} />
      </div>

      {/* description */}
      <div className="px-4 py-3" style={{ borderBottom: '1px solid #2e3755' }}>
        <p className="text-px-muted text-sm leading-relaxed">{character.description}</p>
      </div>

      {/* skills */}
      <div>
        <div className="px-4 py-2 flex items-center gap-2" style={{ borderBottom: '1px solid #2e3755', background: '#141726' }}>
          <span className="text-px-dim text-[9px] font-bold uppercase tracking-widest" style={{ fontFamily: 'monospace' }}>Skills</span>
          <span className="text-px-dim text-[9px]" style={{ fontFamily: 'monospace' }}>({character.skills.length})</span>
        </div>
        <div className="flex flex-col">
          {character.skills.map((skill, i) => (
            <SkillCard
              key={skill.id}
              skill={skill}
              selected={activeIdx === i}
              onClick={() => setActiveIdx(i)}
            />
          ))}
        </div>
      </div>

      {/* expanded skill info */}
      <div className="mx-4 my-4 overflow-hidden" style={{ background: '#0c0e1a', border: '1px solid #445180', borderTop: '4px solid #ffd166' }}>
        <div className="relative w-full overflow-hidden" style={{ height: 220, background: '#090b16' }}>
          {active.iconUrl ? (
            <img src={active.iconUrl} alt={active.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl font-bold text-px-gold">{active.name[0]}</div>
          )}
          <div className="absolute inset-x-0 bottom-0 px-4 py-3"
               style={{ background: 'linear-gradient(transparent, rgba(9,11,22,.96))' }}>
            <p className="font-bold text-px-gold text-lg uppercase tracking-wide">{active.name}</p>
          </div>
        </div>
        <div className="p-4">
          <p className="text-px-muted text-sm leading-relaxed mb-4">{active.description}</p>
          <div className="grid grid-cols-2 gap-x-5 gap-y-2 mb-4">
            {[
              ['Target', active.targetType],
              ['Class', active.mainClass],
              ['Type', active.persistence],
              ['Cooldown', active.cooldown === 0 ? 'None' : `${active.cooldown} turns`],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-2 items-baseline">
                <span className="text-px-dim text-[10px] uppercase tracking-wider shrink-0" style={{ fontFamily: 'monospace' }}>{k}</span>
                <span className="text-px-text text-sm font-bold capitalize">{v}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-px-dim text-[10px] uppercase tracking-wider" style={{ fontFamily: 'monospace' }}>Cost</span>
            <EnergyCostDisplay cost={active.cost} />
          </div>
          {active.effects.length > 0 && (
            <div className="mt-4 pt-3 flex flex-col gap-1" style={{ borderTop: '1px solid #2e3755' }}>
              {active.effects.map((e, i) => (
                <p key={i} className="text-sm text-px-muted">
                  <span className="text-px-gold font-bold capitalize">{e.type.replace(/_/g, ' ')}</span>
                  {' '}·{' '}{e.value}{e.duration > 1 ? ` for ${e.duration}t` : ''}
                  {e.stackIncrement ? `, +${e.stackIncrement}/use` : ''}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* select button */}
      {onSelect && (
        <div className="px-4 pb-4 pt-1">
          <button
            onClick={onSelect}
            className="w-full py-2.5 font-bold text-sm uppercase tracking-widest transition-all hover:brightness-110"
            style={selected
              ? { background: '#ffd166', color: '#0c0e1a', boxShadow: '3px 3px 0 #7a5b1e' }
              : { background: '#1d2235', color: '#e2e8ff', border: '1px solid #445180' }
            }
          >
            {selected ? '✓ On Team' : selectLabel}
          </button>
        </div>
      )}
    </div>
  )
}
