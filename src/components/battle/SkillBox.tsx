import { useEffect, useRef, useState } from 'react'
import type { Skill, EnergyPool } from '../../types'
import { canAfford, getSkillCooldownLeft, isStunned } from '../../engine/battle'
import type { BattleCharacter } from '../../types'
import { EnergyCostDisplay } from '../ui/EnergyOrb'

const CLASS_COLOR: Record<string, string> = {
  physical:  '#f45e3f',
  technical: '#38d9a9',
  magic:     '#6b9ff5',
  strategic: '#38d9a9',
}

export interface SkillStreak { bonus: number; turnsLeft: number }

interface SkillBoxProps {
  skill:          Skill
  battleChar:     BattleCharacter
  pool:           EnergyPool
  isQueued:       boolean
  isPending:      boolean
  clickable:      boolean
  streak?:        SkillStreak | null
  onHover:        (skill: Skill | null) => void
  onClick:        () => void
  onDoubleClick?: () => void
}

export function SkillBox({ skill, battleChar, pool, isQueued, isPending, clickable, streak, onHover, onClick, onDoubleClick }: SkillBoxProps) {
  const cd = getSkillCooldownLeft(battleChar, skill.id)
  const onCd = cd > 0
  const stunned = isStunned(battleChar)
  const cantAfford = !canAfford(skill.cost, pool)
  const isBlocked = onCd || cantAfford || battleChar.isDead || stunned
  const accent = CLASS_COLOR[skill.mainClass] ?? '#445180'

  const [tipVisible, setTipVisible] = useState(false)
  const [tipAbove, setTipAbove]     = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  // close on outside click or Escape
  useEffect(() => {
    if (!tipVisible) return
    function close(e: MouseEvent | KeyboardEvent) {
      if (e instanceof KeyboardEvent) { if (e.key === 'Escape') setTipVisible(false); return }
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setTipVisible(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', close)
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', close) }
  }, [tipVisible])

  // close when another SkillBox opens its tooltip
  useEffect(() => {
    function onOtherOpen(e: Event) {
      if ((e as CustomEvent).detail !== skill.id) setTipVisible(false)
    }
    window.addEventListener('skillbox-tip-open', onOtherOpen)
    return () => window.removeEventListener('skillbox-tip-open', onOtherOpen)
  }, [skill.id])

  const border = isQueued || isPending ? '#ffd166' : isBlocked ? '#1d2235' : accent + '88'
  const bg = isQueued  ? 'rgba(255,209,102,.18)' :
             isPending ? 'rgba(255,209,102,.1)'  :
             isBlocked ? '#0c0e1a'               : accent + '18'

  const streakColor = streak
    ? streak.turnsLeft <= 1 ? '#f45e3f' : '#38d9a9'
    : null

  return (
    // wrapper intercepts right-click so tooltip works even when button is disabled
    <div
      ref={wrapRef}
      style={{ position: 'relative', display: 'inline-block', flexShrink: 0 }}
      onContextMenu={e => {
        e.preventDefault()
        const opening = !tipVisible
        if (opening && wrapRef.current) {
          const rect = wrapRef.current.getBoundingClientRect()
          // flip upward if the enlarged tooltip would not fit below
          setTipAbove(window.innerHeight - rect.bottom < 340)
        }
        setTipVisible(v => !v)
        if (opening) window.dispatchEvent(new CustomEvent('skillbox-tip-open', { detail: skill.id }))
      }}
    >
      {/* right-click tooltip — outside button so it renders even when disabled */}
      {tipVisible && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: 'absolute',
            ...(tipAbove
              ? { bottom: '100%', marginBottom: 6 }
              : { top: '100%',    marginTop: 6 }),
            left: '50%',
            transform: 'translateX(-50%)',
            width: 280,
            background: '#0c0e1a',
            border: `1px solid ${accent}66`,
            borderLeft: `3px solid ${accent}`,
            boxShadow: '0 4px 20px rgba(0,0,0,.9)',
            zIndex: 100,
            textAlign: 'left',
            pointerEvents: 'auto',
          }}
        >
          {/* header */}
          <div className="px-3 py-2 flex items-center gap-3"
               style={{ background: accent + '22', borderBottom: `1px solid ${accent}33` }}>
            {skill.iconUrl && (
              <img src={skill.iconUrl} alt=""
                   style={{ width: 32, height: 32, objectFit: 'cover', flexShrink: 0 }} />
            )}
            <span className="font-bold truncate"
                  style={{ color: accent, fontFamily: "'Press Start 2P', monospace", fontSize: 10 }}>
              {skill.name.toUpperCase()}
            </span>
          </div>
          {/* description */}
          <p className="px-3 py-3 text-px-muted leading-snug" style={{ fontSize: 12 }}>
            {skill.description}
          </p>
          {/* cost */}
          <div className="px-3 pb-3 flex items-center gap-3"
               style={{ borderBottom: '1px solid #1d2235' }}>
            <span style={{ fontSize: 10, color: '#4a5578', fontFamily: 'monospace' }}>COST</span>
            <EnergyCostDisplay cost={skill.cost} size="sm" />
          </div>
          {/* meta */}
          <div className="px-3 pb-3 flex flex-wrap gap-x-4 gap-y-1"
               style={{ borderTop: '1px solid #1d2235', paddingTop: 4 }}>
            <span style={{ fontSize: 10, color: accent, fontFamily: 'monospace', textTransform: 'uppercase' }}>
              {skill.mainClass}
            </span>
            <span style={{ fontSize: 10, color: '#8892b8', fontFamily: 'monospace' }}>
              {skill.persistence}
            </span>
            {skill.cooldown > 0 && (
              <span style={{ fontSize: 10, color: '#ffd166', fontFamily: 'monospace' }}>
                CD: {skill.cooldown}
              </span>
            )}
            {skill.isAffliction && (
              <span style={{ fontSize: 10, color: '#a855f7', fontFamily: 'monospace' }}>Affliction</span>
            )}
          </div>
        </div>
      )}
      <button
        className="relative flex flex-col items-center justify-end w-full transition-all"
        style={{
          width: 92, height: 106,
          background: bg,
          border: `2px solid ${border}`,
          cursor: clickable && !isBlocked ? 'pointer' : 'default',
          opacity: (isBlocked && !onCd && !tipVisible) ? 0.38 : 1,
        }}
        title={undefined}
        disabled={!clickable || isBlocked}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onMouseEnter={() => onHover(skill)}
        onMouseLeave={() => onHover(null)}
      >
        {skill.iconUrl ? (
        <img
          src={skill.iconUrl}
          alt={skill.name}
          className="absolute top-0 left-0 w-full"
          style={{ height: 88, objectFit: 'cover', opacity: isBlocked ? 0.3 : 0.9 }}
        />
      ) : (
        <span className="absolute top-0 left-0 w-full flex items-center justify-center font-bold"
            style={{ height: 88, color: isBlocked ? '#4a5578' : accent, fontSize: 32 }}>
          {skill.name[0]}
        </span>
      )}
      {/* name strip always at the bottom, outside the image */}
      <span className="relative z-10 w-full text-center leading-none px-0.5 truncate"
            style={{
              fontSize: 7, fontFamily: 'monospace',
              color: '#c8cfe8',
              background: isBlocked ? '#0a0c17' : '#141726',
              padding: '2px 2px',
            }}>
        {skill.name.toUpperCase()}
      </span>

      {/* queued star */}
      {isQueued && (
        <div className="absolute top-0.5 right-0.5 w-3 h-3 flex items-center justify-center"
             style={{ background: '#ffd166', fontSize: 7, color: '#0c0e1a' }}>
          ★
        </div>
      )}

      {/* streak bonus badge — bottom strip */}
      {streak && streak.bonus > 0 && (
        <div
          className="absolute bottom-0 left-0 right-0 flex items-center justify-center"
          style={{
            height: 13,
            background: streakColor!,
            fontSize: 7,
            color: '#0c0e1a',
            fontFamily: "'Press Start 2P', monospace",
          }}
        >
          +{streak.bonus}{streak.turnsLeft <= 1 ? '!' : ''}
        </div>
      )}

      {/* stun overlay */}
      {stunned && !onCd && (
        <div className="absolute inset-0 flex items-center justify-center"
             style={{ background: 'rgba(9,11,22,.82)' }}>
          <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: '#ffd166' }}>⚡</span>
        </div>
      )}

      {/* cooldown overlay */}
      {onCd && (
        <div className="absolute inset-0 flex items-center justify-center"
             style={{ background: 'rgba(9,11,22,.82)' }}>
          <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 16, color: '#ffd166' }}>
            {cd}
          </span>
        </div>
      )}
      </button>
    </div>
  )
}

interface AISkillBoxProps { skill: Skill }

export function AISkillBox({ skill }: AISkillBoxProps) {
  const accent = CLASS_COLOR[skill.mainClass] ?? '#445180'
  const [tipVisible, setTipVisible] = useState(false)
  const [tipAbove, setTipAbove]     = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!tipVisible) return
    function close(e: MouseEvent | KeyboardEvent) {
      if (e instanceof KeyboardEvent) { if (e.key === 'Escape') setTipVisible(false); return }
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setTipVisible(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', close)
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', close) }
  }, [tipVisible])

  useEffect(() => {
    function onOtherOpen(e: Event) {
      if ((e as CustomEvent).detail !== skill.id) setTipVisible(false)
    }
    window.addEventListener('skillbox-tip-open', onOtherOpen)
    return () => window.removeEventListener('skillbox-tip-open', onOtherOpen)
  }, [skill.id])

  return (
    <div
      ref={wrapRef}
      style={{ position: 'relative', display: 'inline-block', flexShrink: 0 }}
      onContextMenu={e => {
        e.preventDefault()
        const opening = !tipVisible
        if (opening && wrapRef.current) {
          const rect = wrapRef.current.getBoundingClientRect()
          setTipAbove(window.innerHeight - rect.bottom < 340)
        }
        setTipVisible(v => !v)
        if (opening) window.dispatchEvent(new CustomEvent('skillbox-tip-open', { detail: skill.id }))
      }}
    >
      {tipVisible && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: 'absolute',
            ...(tipAbove ? { bottom: '100%', marginBottom: 6 } : { top: '100%', marginTop: 6 }),
            left: '50%',
            transform: 'translateX(-50%)',
            width: 280,
            background: '#0c0e1a',
            border: `1px solid ${accent}66`,
            borderLeft: `3px solid ${accent}`,
            boxShadow: '0 4px 20px rgba(0,0,0,.9)',
            zIndex: 100,
            textAlign: 'left',
            pointerEvents: 'auto',
          }}
        >
          <div className="px-3 py-2 flex items-center gap-3"
               style={{ background: accent + '22', borderBottom: `1px solid ${accent}33` }}>
            <span className="font-bold truncate"
                  style={{ color: accent, fontFamily: "'Press Start 2P', monospace", fontSize: 10 }}>
              {skill.name.toUpperCase()}
            </span>
          </div>
          <p className="px-3 py-3 text-px-muted leading-snug" style={{ fontSize: 12 }}>
            {skill.description}
          </p>
          <div className="px-3 pb-3 flex flex-wrap gap-x-4 gap-y-1"
               style={{ borderTop: '1px solid #1d2235', paddingTop: 4 }}>
            <span style={{ fontSize: 10, color: accent, fontFamily: 'monospace', textTransform: 'uppercase' }}>
              {skill.mainClass}
            </span>
            <span style={{ fontSize: 10, color: '#8892b8', fontFamily: 'monospace' }}>
              {skill.persistence}
            </span>
            {skill.cooldown > 0 && (
              <span style={{ fontSize: 10, color: '#ffd166', fontFamily: 'monospace' }}>CD: {skill.cooldown}</span>
            )}
          </div>
        </div>
      )}
      <div className="shrink-0 flex flex-col items-center justify-end relative overflow-hidden"
         style={{ width: 92, height: 106, background: accent + '12', border: `2px solid ${accent}44`, cursor: 'context-menu' }}>
        {skill.iconUrl ? (
          <img src={skill.iconUrl} alt={skill.name}
               className="absolute top-0 left-0 w-full"
            style={{ height: 88, objectFit: 'cover', opacity: 0.9 }} />
        ) : (
          <span className="absolute top-0 left-0 w-full flex items-center justify-center font-bold"
                style={{ height: 88, color: accent, fontSize: 32 }}>
            {skill.name[0]}
          </span>
        )}
        <span className="relative z-10 w-full text-center leading-none truncate"
              style={{ fontSize: 7, color: '#c8cfe8', background: '#141726', padding: '2px 2px', fontFamily: 'monospace' }}>
          {skill.name.toUpperCase()}
        </span>
      </div>
    </div>
  )
}
