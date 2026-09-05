import { useEffect, useRef, useState } from 'react'
import { useBattleStore } from '../../store/battleStore'
import { API, useAuthStore } from '../../store/authStore'
import { useMissionStore } from '../../store/missionStore'
import { CharacterRow } from './CharacterRow'
import type { IncomingQueued } from './CharacterRow'
import { EnergyBar } from './EnergyBar'
import type { BattleState, EnergyPool } from '../../types'
import { getEffectiveSkill, isInvulnerable, isStunned, spendEnergy } from '../../engine/battle'
import { EnergyAllocModal } from './EnergyAllocModal'
import { BattleField } from './BattleField'
import { BattleLogModal } from './TurnLog'

const E_KEYS = ['strength', 'magic', 'spirit', 'agility'] as const

const TURN_SECS = 60

// ─── Header ───────────────────────────────────────────────────────────────────

function BattleHeader({ state, username, isOver, isAITurn, timeLeft, onReadyClick, onReset }: {
  state: BattleState; isOver: boolean; isAITurn: boolean; timeLeft: number
  username: string | null
  onReadyClick: () => void; onReset: () => void
}) {
  const isVictory   = state.phase === 'victory'
  const isPlayerTurn = state.phase === 'player_turn'
  const pct = (timeLeft / TURN_SECS) * 100
  const barColor = timeLeft > 30 ? '#ffd166' : timeLeft > 15 ? '#f4a83f' : '#f45e3f'

  return (
    <div className="flex items-center justify-between gap-2 px-4 py-2 shrink-0"
         style={{ background: '#0f1120', borderBottom: '2px solid #c42b2b', minHeight: 58 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <p style={{ fontFamily: 'monospace', fontSize: 9, color: '#ffd166', fontWeight: 'bold' }}>
          {username ?? 'YOU'}
        </p>
        <p style={{ fontFamily: 'monospace', fontSize: 8, color: '#4a5578' }}>TURN {state.turn}</p>
      </div>

      <div className="flex flex-col items-center gap-1 flex-1 mx-4">
        {isOver ? (
          <div className="flex flex-col items-center gap-1">
            <button onClick={onReset}
                    className="px-6 py-2 font-bold uppercase tracking-widest transition-all"
                    style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8,
                             background: isVictory ? '#38d9a9' : '#f45e3f', color: '#0c0e1a',
                             boxShadow: isVictory ? '3px 3px 0 #1a7a6a' : '3px 3px 0 #7a1a0a' }}>
              {isVictory ? '🏆 VICTORY!' : '💣 DEFEATED'} — PLAY AGAIN
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={isPlayerTurn ? onReadyClick : undefined}
              disabled={!isPlayerTurn}
              className="px-6 py-1.5 font-bold uppercase tracking-widest transition-all"
              style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8,
                       background: isPlayerTurn ? '#c42b2b' : '#1d2235',
                       color: isPlayerTurn ? '#fff' : '#4a5578',
                       cursor: isPlayerTurn ? 'pointer' : 'default',
                       boxShadow: isPlayerTurn ? '3px 3px 0 #7a1a0a' : 'none',
                       border: isPlayerTurn ? 'none' : '2px solid #2e3755' }}>
              {isAITurn ? "OPPONENT'S TURN" : isPlayerTurn ? '▶ READY' : 'STARTING...'}
            </button>

            {isAITurn && (
              <p style={{ fontFamily: 'monospace', fontSize: 9, color: '#4a5578' }}>
                Waiting for opponent...
              </p>
            )}

            {/* timer bar — hidden while AI is deciding */}
            {isPlayerTurn && !isAITurn && (
              <div className="w-full flex items-center gap-2">
                <div className="flex-1 h-1.5 relative" style={{ background: '#1d2235', border: '1px solid #2e3755' }}>
                  <div className="absolute top-0 left-0 h-full transition-all duration-1000"
                       style={{ width: `${pct}%`, background: barColor }} />
                </div>
                <span className="shrink-0 font-bold tabular-nums"
                      style={{ fontSize: 9, color: barColor, fontFamily: 'monospace', minWidth: 28 }}>
                  0:{String(timeLeft).padStart(2, '0')}
                </span>
              </div>
            )}
          </>
        )}

      </div>

      <p style={{ fontFamily: 'monospace', fontSize: 9, color: '#f45e3f', fontWeight: 'bold' }}>
        AI OPPONENT
      </p>
    </div>
  )
}

// ─── Turn summary modal ───────────────────────────────────────────────────────

function lineStyle(line: string): { color: string; icon: string } {
  if (/dmg|burns|bleeds|affliction|pierces|combo.*extra|extra.*dmg/i.test(line)) return { color: '#f45e3f', icon: '💥' }
  if (/heals|regenerates/i.test(line))                                             return { color: '#38d9a9', icon: '💚' }
  if (/stun/i.test(line))                                                           return { color: '#ffd166', icon: '⚡' }
  if (/shield|invulnerable|guard|fortif/i.test(line))                              return { color: '#6b9ff5', icon: '🛡' }
  if (/combo|lock.on|extra/i.test(line))                                           return { color: '#f4a83f', icon: '🔥' }
  if (/drain/i.test(line))                                                          return { color: '#a855f7', icon: '💧' }
  if (/gain.*energy/i.test(line))                                                  return { color: '#38d9a9', icon: '⚡' }
  if (/🏆|Victory/i.test(line))                                                    return { color: '#ffd166', icon: '🏆' }
  if (/💀|Defeat/i.test(line))                                                     return { color: '#f45e3f', icon: '💀' }
  if (/can't afford|stunned!/i.test(line))                                         return { color: '#f45e3f', icon: '✗' }
  if (/invulnerable.*fail/i.test(line))                                            return { color: '#6b9ff5', icon: '🛡' }
  return { color: '#8892b8', icon: '▸' }
}

function cleanLogLine(line: string) {
  return line.replace(/^\[hidden-from-(player|ai)\] /, '')
}

function SummaryModal({ turnNum, phase, lines, playerChars, aiChars, onClose }: {
  turnNum: number
  phase: 'player' | 'ai'
  lines: string[]
  playerChars: import('../../types').BattleCharacter[]
  aiChars:     import('../../types').BattleCharacter[]
  onClose: () => void
}) {
  const isPlayer   = phase === 'player'
  const accentColor = isPlayer ? '#ffd166' : '#f45e3f'
  const title      = `BATTLE LOG — TURN ${turnNum}`
  // Build name → portrait map for inline icons
  const portraitMap = new Map<string, { url?: string; color: string }>()
  for (const bc of [...playerChars, ...aiChars]) {
    portraitMap.set(bc.character.name.toLowerCase(), {
      url:   bc.character.avatarUrl,
      color: bc.character.avatarColor.replace('bg-', ''),
    })
  }

  function findPortrait(line: string) {
    for (const [name, meta] of portraitMap.entries()) {
      if (line.toLowerCase().includes(name)) return meta
    }
    return null
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50"
         style={{ background: 'rgba(0,0,0,.72)' }}>
      <div style={{ width: 500, maxHeight: '80vh', display: 'flex', flexDirection: 'column',
                    background: '#0c0e1a', border: `2px solid ${accentColor}`,
                    boxShadow: '0 8px 40px rgba(0,0,0,.95)' }}>

        {/* header */}
        <div style={{ background: '#0f1120', borderBottom: '2px solid #2e3755',
                      padding: '10px 16px', flexShrink: 0 }}>
          <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10,
                      color: accentColor, marginBottom: 10 }}>
            {title}
          </p>
          {/* team thumbnails */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {playerChars.map(bc => (
                <div key={bc.character.id} title={bc.character.name}
                     style={{ width: 36, height: 36, overflow: 'hidden', flexShrink: 0,
                              border: `2px solid ${bc.isDead ? '#2e3755' : '#ffd16666'}`,
                              opacity: bc.isDead ? 0.35 : 1 }}>
                  {bc.character.avatarUrl
                    ? <img src={bc.character.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div className={`w-full h-full flex items-center justify-center font-bold text-white ${bc.character.avatarColor}`}
                           style={{ fontSize: 14 }}>{bc.character.name[0]}</div>
                  }
                </div>
              ))}
            </div>
            <span style={{ color: '#c42b2b', fontFamily: "'Press Start 2P', monospace", fontSize: 8 }}>VS</span>
            <div style={{ display: 'flex', gap: 4 }}>
              {aiChars.map(bc => (
                <div key={bc.character.id} title={bc.character.name}
                     style={{ width: 36, height: 36, overflow: 'hidden', flexShrink: 0,
                              border: `2px solid ${bc.isDead ? '#2e3755' : '#f45e3f66'}`,
                              opacity: bc.isDead ? 0.35 : 1 }}>
                  {bc.character.avatarUrl
                    ? <img src={bc.character.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div className={`w-full h-full flex items-center justify-center font-bold text-white ${bc.character.avatarColor}`}
                           style={{ fontSize: 14 }}>{bc.character.name[0]}</div>
                  }
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* scrollable action list */}
        <div style={{ overflowY: 'auto', padding: '6px 0', flex: 1 }}>
          {lines.length === 0 ? (
            <p style={{ color: '#4a5578', fontSize: 12, textAlign: 'center', padding: '16px' }}>No actions this turn.</p>
          ) : lines.map((line, i) => {
            const cleanLine = cleanLogLine(line)
            const isSection = cleanLine.startsWith('─')
            const { color, icon } = lineStyle(cleanLine)
            const portrait = !isSection ? findPortrait(cleanLine) : null
            if (isSection) return (
              <div key={i} style={{ padding: '6px 14px 3px', marginTop: 4 }}>
                <p style={{ fontSize: 8, color: '#4a5578', fontFamily: 'monospace',
                             textTransform: 'uppercase', letterSpacing: 2 }}>{cleanLine.replace(/─/g, '').trim()}</p>
              </div>
            )
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8,
                                    padding: '5px 14px', borderBottom: '1px solid #141726' }}>
                {portrait ? (
                  <div style={{ width: 26, height: 26, overflow: 'hidden', flexShrink: 0,
                                border: `1px solid ${color}55` }}>
                    {portrait.url
                      ? <img src={portrait.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ width: '100%', height: '100%', background: color + '44',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      fontSize: 12, color }}>{icon}</div>
                    }
                  </div>
                ) : (
                  <span style={{ fontSize: 14, flexShrink: 0, width: 26, textAlign: 'center' }}>{icon}</span>
                )}
                <span style={{ fontSize: 11, color, lineHeight: 1.5 }}>{cleanLine}</span>
              </div>
            )
          })}
        </div>

        {/* footer */}
        <div style={{ borderTop: '2px solid #2e3755', padding: '10px 16px', display: 'flex',
                      justifyContent: 'flex-end', background: '#0f1120', flexShrink: 0 }}>
          <button
            onClick={onClose}
            autoFocus
            style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8,
                     background: '#ffd166', color: '#0c0e1a', padding: '8px 24px',
                     boxShadow: '3px 3px 0 #7a5b1e', border: 'none', cursor: 'pointer' }}>
            ▶ OK
          </button>
        </div>
      </div>
    </div>
  )
}

function extractLastTurnLog(log: string[]): { playerLines: string[]; aiLines: string[] } {
  const markers = log.reduce<number[]>((acc, line, index) => {
    if (line.startsWith('───')) acc.push(index)
    return acc
  }, [])
  if (markers.length === 0) return { playerLines: log, aiLines: [] }

  const lastMarker = markers[markers.length - 1]
  const markerHasActions = log.slice(lastMarker + 1).some(line => !line.startsWith('───') && line.trim())
  const start = markerHasActions || markers.length === 1 ? lastMarker : markers[markers.length - 2]
  const end = markerHasActions ? log.length : lastMarker
  return { playerLines: log.slice(start, end).filter(line => line.trim()), aiLines: [] }
}

// ─── Main arena ───────────────────────────────────────────────────────────────

export function BattleArena() {
  const { battleState: state, selectedCharIdx, pendingSkill,
    selectChar, setPendingSkill, queueSkill, dequeueSkill, switchMode, endTurn, reset,
  } = useBattleStore()
  const username = useAuthStore(state => state.username)
  const recordMissionMatch = useMissionStore(state => state.recordMatch)

  const [pendingAlloc, setPendingAlloc]   = useState<{ charIdx: number; skillId: string; targetTeam: 'player'|'ai'; targetIdx: number } | null>(null)
  const [timeLeft,     setTimeLeft]       = useState(TURN_SECS)
  const [summary, setSummary] = useState<{ turn: number; playerLines: string[]; aiLines: string[]; phase: 'player' | 'ai' } | null>(null)
  const [logOpen, setLogOpen] = useState(false)
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastTurnRef = useRef(0)

  const isOver       = !state || state.phase === 'victory' || state.phase === 'defeat'
  const isPlayerTurn = state?.phase === 'player_turn'
  const isAITurn     = state?.phase === 'ai_turn'

  // Award XP once when match ends
  const xpAwardedRef = useRef(false)
  useEffect(() => {
    if (!state || !isOver || xpAwardedRef.current) return
    xpAwardedRef.current = true
    const result = state.phase === 'victory' ? 'win' : 'loss'
    const survivingAllies = state.player.characters.filter(c => !c.isDead).length
    // AI matches don't count toward rank/XP — only ladder matches do
    if (username) void fetch(`${API}/stats/match`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ result }),
    })
    if (username) recordMissionMatch(
      username,
      result,
      state.turn,
      survivingAllies,
      state.player.characters.map(character => character.character.id),
      state.ai.characters.map(character => character.character.id),
    )
  }, [state?.phase])

  // Reset award flag when a new battle starts
  useEffect(() => { xpAwardedRef.current = false }, [])

  // Show turn summary after resolution completes
  useEffect(() => {
    if (!state) return
    const prev = lastTurnRef.current
    if ((state.turn > prev && prev > 0) ||
      ((state.phase === 'victory' || state.phase === 'defeat') && prev > 0)) {
      const { playerLines, aiLines } = extractLastTurnLog(state.log)
      setSummary({ turn: prev, playerLines, aiLines, phase: 'player' })
    }
    lastTurnRef.current = state.turn
  }, [state?.turn, state?.phase])

  // Match the multiplayer clock: battle-log visibility does not pause the turn.
  useEffect(() => {
    if (!isPlayerTurn || isOver) { setTimeLeft(TURN_SECS); return }
    setTimeLeft(TURN_SECS)
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timerRef.current!); endTurn(); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [state?.turn, isPlayerTurn])

  if (!state) return null

  const playerChars = state.player.characters
  const aiChars     = state.ai.characters

  function getQueuedSkillId(charIdx: number) {
    return state!.playerQueue.find(q => q.characterIndex === charIdx)?.skillId
  }

  function findEffectiveSkill(charIdx: number, skillId: string) {
    const char = playerChars[charIdx]
    const baseSkill = char?.character.skills.find(s => s.id === skillId)
    return char && baseSkill ? getEffectiveSkill(char, baseSkill) : undefined
  }

  /** Pool remaining for wildcard allocation: deducts this skill's fixed costs + all other queued costs. */
  function getAvailableForAlloc(charIdx: number, skillId: string): EnergyPool {
    const pool = { ...state!.player.energy }
    const skill = findEffectiveSkill(charIdx, skillId)
    if (skill) {
      for (const t of E_KEYS) pool[t] = Math.max(0, pool[t] - (skill.cost[t] ?? 0))
    }
    for (const q of state!.playerQueue) {
      if (q.characterIndex === charIdx) continue
      const qs = findEffectiveSkill(q.characterIndex, q.skillId)
      if (!qs) continue
      for (const t of E_KEYS) {
        pool[t] = Math.max(0, pool[t] - (qs.cost[t] ?? 0) - (q.randomAllocation?.[t] ?? 0))
      }
    }
    return pool
  }

  /** True when the player has a real choice for wildcard slots (>1 energy type available). */
  function hasRealChoice(charIdx: number, skillId: string): boolean {
    const skill = findEffectiveSkill(charIdx, skillId)
    if (!skill?.cost.random) return false
    const pool = getAvailableForAlloc(charIdx, skillId)
    return E_KEYS.filter(t => pool[t] > 0).length > 1
  }

  /** Try to queue; shows alloc modal if the skill has wildcard slots with a real choice. */
  function tryQueue(charIdx: number, skillId: string, targetTeam: 'player'|'ai', targetIdx: number) {
    if (hasRealChoice(charIdx, skillId)) {
      setPendingAlloc({ charIdx, skillId, targetTeam, targetIdx })
      setPendingSkill(null)
    } else {
      queueSkill(charIdx, skillId, targetTeam, targetIdx)
    }
  }

  /** Energy pool remaining after every OTHER character's queued skill cost is deducted. */
  function getEnergyForChar(charIdx: number): EnergyPool {
    const remaining = { ...state!.player.energy }
    for (const q of state!.playerQueue) {
      if (q.characterIndex === charIdx) continue
      const skill = findEffectiveSkill(q.characterIndex, q.skillId)
      if (skill) spendEnergy(skill.cost, remaining)
    }
    return remaining
  }

  function getIncomingQueued(aiSlot: number): IncomingQueued[] {
    return state!.playerQueue
      .filter(q => {
        if (q.targetTeam !== 'ai') return false
        const skill = findEffectiveSkill(q.characterIndex, q.skillId)
        return skill?.targetType === 'all_enemies' || q.targetIndex === aiSlot
      })
      .flatMap(q => {
        const caster = playerChars[q.characterIndex]
        const skill  = findEffectiveSkill(q.characterIndex, q.skillId)
        return skill && caster ? [{ skill, sourceName: caster.character.name, casterIdx: q.characterIndex,
          bonus: (() => {
            const e = skill.effects.find(ef => ef.stackIncrement)
            const uses = caster.skillUseCounts[skill.id] ?? 0
            return e?.stackIncrement && uses > 0 ? uses * e.stackIncrement : undefined
          })(),
        }] : []
      })
  }

  function getPlayerIncomingQueued(playerSlot: number): IncomingQueued[] {
    return state!.playerQueue
      .filter(q => {
        if (q.targetTeam !== 'player') return false
        const skill = findEffectiveSkill(q.characterIndex, q.skillId)
        if (!skill) return false
        return skill.targetType === 'all_allies' || q.targetIndex === playerSlot
      })
      .flatMap(q => {
        const caster = playerChars[q.characterIndex]
        const skill  = findEffectiveSkill(q.characterIndex, q.skillId)
        return skill && caster ? [{ skill, sourceName: caster.character.name, casterIdx: q.characterIndex }] : []
      })
  }

  function isValidAITarget(charIdx: number): boolean {
    if (!pendingSkill) return false
    const skill = findEffectiveSkill(pendingSkill.charIdx, pendingSkill.skillId)
    if (!skill) return false
    const char = aiChars[charIdx]
    if (!char || char.isDead) return false
    if (isInvulnerable(char)) return false
    return skill.targetType === 'enemy' || skill.targetType === 'any'
  }

  function isValidPlayerTarget(charIdx: number): boolean {
    if (!pendingSkill) return false
    const skill = findEffectiveSkill(pendingSkill.charIdx, pendingSkill.skillId)
    if (!skill || skill.targetType !== 'ally') return false
    const char = playerChars[charIdx]
    return !!char && !char.isDead && charIdx !== pendingSkill.charIdx
  }

  function handleSkillClick(skillId: string, slot: number) {
    if (!isPlayerTurn) return
    const bc = playerChars[slot]
    if (!bc || bc.isDead || isStunned(bc)) return
    selectChar(slot)
    const baseSkill = bc.character.skills.find(s => s.id === skillId)
    if (!baseSkill) return
    if (baseSkill.modeToggle) { switchMode(slot); return }
    const skill = getEffectiveSkill(bc, baseSkill)

    if (getQueuedSkillId(slot) === skillId) {
      dequeueSkill(slot); setPendingSkill(null); return
    }
    if (skill.targetType === 'self')         { tryQueue(slot, skillId, 'player', slot); return }
    if (skill.targetType === 'all_enemies')  { tryQueue(slot, skillId, 'ai',     0);    return }
    if (skill.targetType === 'all_allies')   { tryQueue(slot, skillId, 'player', 0);    return }
    setPendingSkill({ charIdx: slot, skillId })
  }

  function handleReady() {
    if (timerRef.current) clearInterval(timerRef.current)
    endTurn()
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 48px)', background: '#090b16', overflow: 'hidden' }}>
      <BattleHeader
        state={state} username={username} isOver={isOver} isAITurn={isAITurn} timeLeft={timeLeft}

        onReadyClick={handleReady}
        onReset={reset}
      />

      {/* targeting banner — always rendered at fixed height to prevent layout shift */}
      <div className="flex items-center justify-between px-4 shrink-0"
           style={{
             height: 32,
             background: pendingSkill ? 'rgba(107,159,245,.12)' : 'transparent',
             borderBottom: `1px solid ${pendingSkill ? '#6b9ff544' : 'transparent'}`,
             transition: 'background .15s',
             visibility: pendingSkill ? 'visible' : 'hidden',
           }}>
          <span className="text-xs font-bold uppercase tracking-widest"
                style={{ color: '#6b9ff5', fontFamily: 'monospace' }}>
            {(() => {
              const skill = pendingSkill ? findEffectiveSkill(pendingSkill.charIdx, pendingSkill.skillId) : null
              return skill?.targetType === 'ally' ? '► Click a teammate to target' : '► Click an enemy to target'
            })()}
          </span>
          <button onClick={() => setPendingSkill(null)}
                  className="text-xs font-bold uppercase tracking-widest px-3 py-1"
                  style={{ color: '#f45e3f', border: '1px solid #f45e3f44', background: '#f45e3f11' }}>
            Cancel
          </button>
        </div>

      {/* battle field */}
      <BattleField>
        {[0, 1, 2].map(slot => (
          <CharacterRow
            key={slot} slot={slot}
            playerChar={playerChars[slot]}
            aiChar={aiChars[slot]}
            playerSelected={selectedCharIdx === slot}
            aiTargeted={isValidAITarget(slot)}
            playerTargeted={isValidPlayerTarget(slot)}
            queuedSkillId={getQueuedSkillId(slot)}
            pendingSkillId={pendingSkill?.charIdx === slot ? pendingSkill.skillId : null}
            playerEnergy={getEnergyForChar(slot)}
            isPlayerTurn={isPlayerTurn && !isOver}
            incomingQueued={getIncomingQueued(slot)}
            playerIncomingQueued={getPlayerIncomingQueued(slot)}
            currentTurn={state.turn}
            onPlayerClick={() => {
              if (!isOver && isValidPlayerTarget(slot))
                tryQueue(pendingSkill!.charIdx, pendingSkill!.skillId, 'player', slot)
              else if (!isOver)
                selectChar(slot)
            }}
            onAIClick={() => pendingSkill && tryQueue(pendingSkill.charIdx, pendingSkill.skillId, 'ai', slot)}
            onSkillClick={handleSkillClick}
            onSkillHover={() => {}}
            onRemoveQueued={casterIdx => dequeueSkill(casterIdx)}
          />
        ))}
      </BattleField>

      {logOpen && <BattleLogModal log={state.log} onClose={() => setLogOpen(false)} />}

      {/* wildcard energy allocation modal */}
      {pendingAlloc && (() => {
        const skill = findEffectiveSkill(pendingAlloc.charIdx, pendingAlloc.skillId)
        if (!skill) return null
        return (
          <EnergyAllocModal
            skill={skill}
            availablePool={getAvailableForAlloc(pendingAlloc.charIdx, pendingAlloc.skillId)}
            onConfirm={allocation => {
              queueSkill(pendingAlloc.charIdx, pendingAlloc.skillId, pendingAlloc.targetTeam, pendingAlloc.targetIdx, allocation)
              setPendingAlloc(null)
            }}
            onCancel={() => setPendingAlloc(null)}
          />
        )
      })()}

      {/* turn summary modal */}
      {summary && (
        <SummaryModal
          turnNum={summary.turn}
          phase={summary.phase}
          lines={summary.phase === 'player' ? summary.playerLines : summary.aiLines}
          playerChars={playerChars}
          aiChars={aiChars}
          onClose={() => {
            if (summary.phase === 'player' && summary.aiLines.length > 0)
              setSummary({ ...summary, phase: 'ai' })
            else
              setSummary(null)
          }}
        />
      )}

      {/* energy placement matches player and ladder battles */}
      <div className="px-4 py-2 shrink-0 flex items-center justify-between gap-3" style={{ borderTop: '1px solid #1d2235', background: '#090b16' }}>
        <EnergyBar pool={state.player.energy} label="ENERGY" />
        <button type="button" onClick={() => setLogOpen(true)} className="shrink-0 px-3 py-1 text-xs font-bold uppercase tracking-widest" style={{ border: '1px solid #445180', background: '#141726', color: '#c8cfe8', fontFamily: 'monospace' }}>Battle Log</button>
      </div>
    </div>
  )
}
