import { useEffect, useRef, useState, memo } from 'react'
import { usePvpStore } from '../../store/pvpStore'
import { useAuthStore } from '../../store/authStore'
import { useMissionStore } from '../../store/missionStore'
import { useRankStore } from '../../store/rankStore'
import { CharacterRow } from './CharacterRow'
import type { IncomingQueued } from './CharacterRow'
import { EnergyBar } from './EnergyBar'
import { EnergyAllocModal } from './EnergyAllocModal'
import type { BattleState, EnergyPool, QueuedSkill } from '../../types'
import { getEffectiveSkill, isInvulnerable, isStunned, spendEnergy } from '../../engine/battle'
import { BattleField } from './BattleField'
import { BattleLogModal } from './TurnLog'

const E_KEYS = ['strength', 'magic', 'spirit', 'agility'] as const
const TURN_SECS = 60

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractLastTurnLog(log: string[]): { playerLines: string[]; aiLines: string[] } {
  const markers = log.reduce<number[]>((acc, l, i) => l.startsWith('───') ? [...acc, i] : acc, [])
  if (markers.length < 2) return { playerLines: log, aiLines: [] }
  const [from, mid] = markers.slice(-2)
  const all = log.slice(from)
  const splitAt = all.indexOf(log[mid])
  return { playerLines: all.slice(0, splitAt), aiLines: all.slice(splitAt) }
}

// Isolated so its per-second setState doesn't re-render the full arena
const TurnTimer = memo(function TurnTimer({ initialTime }: { initialTime: number }) {
  const [t, setT] = useState(initialTime)
  useEffect(() => {
    setT(initialTime)
    const id = setInterval(() => setT(p => Math.max(0, p - 1)), 1000)
    return () => clearInterval(id)
  }, [initialTime])
  const pct = (t / TURN_SECS) * 100
  const col  = t > 30 ? '#ffd166' : t > 15 ? '#f4a83f' : '#f45e3f'
  return (
    <div className="w-full flex items-center gap-2">
      <div className="flex-1 h-1.5 relative" style={{ background: '#1d2235', border: '1px solid #2e3755' }}>
        <div className="absolute top-0 left-0 h-full transition-all duration-1000"
             style={{ width: `${pct}%`, background: col }} />
      </div>
      <span style={{ fontSize: 9, color: col, fontFamily: 'monospace', fontWeight: 'bold', minWidth: 28 }}>
        0:{String(t).padStart(2, '0')}
      </span>
    </div>
  )
})

// ─── Main component ───────────────────────────────────────────────────────────

export function PvpBattleArena({ onReset, isLadder = false }: { onReset: () => void; isLadder?: boolean }) {
  // Granular selectors — each only re-renders this component when its own slice changes
  const serverState       = usePvpStore(s => s.battleState)
  const myTurn            = usePvpStore(s => s.myTurn)
  const opponentActing    = usePvpStore(s => s.opponentActing)
  const opponentUsername  = usePvpStore(s => s.opponentUsername)
  const serverTime        = usePvpStore(s => s.timeLeft)
  const submitQueue       = usePvpStore(s => s.submitQueue)
  const switchMode        = usePvpStore(s => s.switchMode)
  const myUsername        = useAuthStore().username
  const recordMissionMatch = useMissionStore(s => s.recordMatch)
  const addMatch           = useRankStore(s => s.addMatch)

  const [localQueue,   setLocalQueue]   = useState<QueuedSkill[]>([])
  const [selectedChar, setSelectedChar] = useState(0)
  const [pendingSkill, setPendingSkill] = useState<{ charIdx: number; skillId: string } | null>(null)
  const [pendingAlloc, setPendingAlloc] = useState<{ charIdx: number; skillId: string; targetTeam: 'player'|'ai'; targetIdx: number } | null>(null)
  const [summary, setSummary]           = useState<{ turn: number; playerLines: string[]; aiLines: string[]; phase: 'player'|'ai' } | null>(null)
  const [logOpen, setLogOpen]           = useState(false)
  const [reward, setReward]             = useState<{ xp: number; coins: number } | null>(null)
  const lastTurnRef = useRef(0)
  const missionRecordedRef = useRef(false)

  useEffect(() => {
    if (!serverState || !myUsername || missionRecordedRef.current) return
    if (serverState.phase !== 'victory' && serverState.phase !== 'defeat') return
    missionRecordedRef.current = true
    const result = serverState.phase === 'victory' ? 'win' : 'loss'
    const survivingAllies = serverState.player.characters.filter(character => !character.isDead).length
    recordMissionMatch(
      myUsername,
      result,
      serverState.turn,
      survivingAllies,
      serverState.player.characters.map(character => character.character.id),
      serverState.ai.characters.map(character => character.character.id),
    )
    // Only ladder matches count toward rank/XP and earn coins
    if (isLadder) setReward(addMatch(result, serverState.turn, survivingAllies))
  }, [serverState?.phase])

  // Reset award state when a new match starts
  useEffect(() => { missionRecordedRef.current = false; setReward(null) }, [])

  useEffect(() => {
    if (!serverState) return
    const prev = lastTurnRef.current
    if (serverState.turn > prev) {
      if (serverState.turn !== prev) {
        // Only show if there are real action lines (not just section headers)
        const { playerLines, aiLines } = extractLastTurnLog(serverState.log)
        const hasActions = playerLines.some(l => !l.startsWith('───') && !l.startsWith('⚔') && l.trim().length > 0)
        if (hasActions) setSummary({ turn: serverState.turn - 1, playerLines, aiLines, phase: 'player' })
      }
      setLocalQueue([])
      setPendingSkill(null)
      setPendingAlloc(null)
      setSelectedChar(0)
      lastTurnRef.current = serverState.turn
    }
  }, [serverState?.turn])

  if (!serverState) return null

  const state: BattleState = { ...serverState, playerQueue: localQueue }
  const playerChars = state.player.characters
  const aiChars     = state.ai.characters
  const isOver      = state.phase === 'victory' || state.phase === 'defeat'
  const isPlanning  = myTurn && !isOver

  // ── Queue management ─────────────────────────────────────────────────────

  function getQueuedSkillId(charIdx: number) {
    return localQueue.find(q => q.characterIndex === charIdx)?.skillId
  }

  function findEffectiveSkill(charIdx: number, skillId: string) {
    const char = playerChars[charIdx]
    const baseSkill = char?.character.skills.find(s => s.id === skillId)
    return char && baseSkill ? getEffectiveSkill(char, baseSkill) : undefined
  }

  function getEnergyForChar(charIdx: number): EnergyPool {
    const pool = { ...state.player.energy }
    for (const q of localQueue) {
      if (q.characterIndex === charIdx) continue
      const skill = findEffectiveSkill(q.characterIndex, q.skillId)
      if (skill) spendEnergy(skill.cost, pool)
    }
    return pool
  }

  function getAvailableForAlloc(charIdx: number, skillId: string): EnergyPool {
    const pool = { ...state.player.energy }
    const skill = findEffectiveSkill(charIdx, skillId)
    if (skill) for (const t of E_KEYS) pool[t] = Math.max(0, pool[t] - (skill.cost[t] ?? 0))
    for (const q of localQueue) {
      if (q.characterIndex === charIdx) continue
      const qs = findEffectiveSkill(q.characterIndex, q.skillId)
      if (!qs) continue
      for (const t of E_KEYS) pool[t] = Math.max(0, pool[t] - (qs.cost[t] ?? 0) - (q.randomAllocation?.[t] ?? 0))
    }
    return pool
  }

  function hasRealChoice(charIdx: number, skillId: string): boolean {
    const skill = findEffectiveSkill(charIdx, skillId)
    if (!skill?.cost.random) return false
    return E_KEYS.filter(t => getAvailableForAlloc(charIdx, skillId)[t] > 0).length > 1
  }

  function doQueue(charIdx: number, skillId: string, targetTeam: 'player'|'ai', targetIdx: number, randomAllocation?: Partial<EnergyPool>) {
    setLocalQueue(prev => [
      ...prev.filter(q => q.characterIndex !== charIdx),
      { characterIndex: charIdx, skillId, targetTeam, targetIndex: targetIdx, randomAllocation },
    ])
    setPendingSkill(null)
  }

  function dequeueLocal(charIdx: number) {
    setLocalQueue(prev => prev.filter(q => q.characterIndex !== charIdx))
  }

  function tryQueue(charIdx: number, skillId: string, targetTeam: 'player'|'ai', targetIdx: number) {
    if (hasRealChoice(charIdx, skillId)) {
      setPendingAlloc({ charIdx, skillId, targetTeam, targetIdx })
      setPendingSkill(null)
    } else {
      doQueue(charIdx, skillId, targetTeam, targetIdx)
    }
  }

  function isValidAITarget(charIdx: number) {
    if (!pendingSkill) return false
    const skill = findEffectiveSkill(pendingSkill.charIdx, pendingSkill.skillId)
    const char  = aiChars[charIdx]
    if (!skill || !char || char.isDead || isInvulnerable(char)) return false
    return skill.targetType === 'enemy' || skill.targetType === 'any'
  }

  function isValidPlayerTarget(charIdx: number) {
    if (!pendingSkill) return false
    const skill = findEffectiveSkill(pendingSkill.charIdx, pendingSkill.skillId)
    if (!skill || skill.targetType !== 'ally') return false
    const char = playerChars[charIdx]
    return !!char && !char.isDead && charIdx !== pendingSkill.charIdx
  }

  function handleSkillClick(skillId: string, slot: number) {
    if (!isPlanning) return
    const bc = playerChars[slot]
    if (!bc || bc.isDead || isStunned(bc)) return
    setSelectedChar(slot)
    const baseSkill = bc.character.skills.find(s => s.id === skillId)
    if (!baseSkill) return
    if (baseSkill.modeToggle) { setLocalQueue(prev => prev.filter(q => q.characterIndex !== slot)); setPendingSkill(null); switchMode(slot); return }
    const skill = getEffectiveSkill(bc, baseSkill)
    if (getQueuedSkillId(slot) === skillId) { dequeueLocal(slot); setPendingSkill(null); return }
    if (skill.targetType === 'self')        { tryQueue(slot, skillId, 'player', slot); return }
    if (skill.targetType === 'all_enemies') { tryQueue(slot, skillId, 'ai', 0);       return }
    if (skill.targetType === 'all_allies')  { tryQueue(slot, skillId, 'player', 0);   return }
    setPendingSkill({ charIdx: slot, skillId })
  }

  function getIncomingQueued(aiSlot: number): IncomingQueued[] {
    return localQueue
      .filter(q => {
        if (q.targetTeam !== 'ai') return false
        const skill = findEffectiveSkill(q.characterIndex, q.skillId)
        return skill && (skill.targetType === 'all_enemies' || q.targetIndex === aiSlot)
      })
      .flatMap(q => {
        const caster = playerChars[q.characterIndex]
        const skill  = findEffectiveSkill(q.characterIndex, q.skillId)
        if (!skill || !caster) return []
        const e     = skill.effects.find(ef => ef.stackIncrement)
        const bonus = e?.stackIncrement && (caster.skillUseCounts[skill.id] ?? 0) > 0
          ? (caster.skillUseCounts[skill.id] ?? 0) * e.stackIncrement : undefined
        return [{ skill, sourceName: caster.character.name, casterIdx: q.characterIndex, bonus }]
      })
  }

  function getPlayerIncomingQueued(playerSlot: number): IncomingQueued[] {
    return localQueue
      .filter(q => {
        if (q.targetTeam !== 'player') return false
        const skill = findEffectiveSkill(q.characterIndex, q.skillId)
        return skill && (skill.targetType === 'all_allies' || q.targetIndex === playerSlot)
      })
      .flatMap(q => {
        const caster = playerChars[q.characterIndex]
        const skill  = findEffectiveSkill(q.characterIndex, q.skillId)
        return skill && caster ? [{ skill, sourceName: caster.character.name, casterIdx: q.characterIndex }] : []
      })
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 48px)', background: '#090b16', overflow: 'hidden' }}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-2 px-4 py-2 shrink-0"
           style={{ background: '#0f1120', borderBottom: '2px solid #c42b2b', minHeight: 58 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <p style={{ fontFamily: 'monospace', fontSize: 9, color: '#ffd166', fontWeight: 'bold' }}>
            {myUsername ?? 'YOU'}
          </p>
          <p style={{ fontFamily: 'monospace', fontSize: 8, color: '#4a5578' }}>TURN {state.turn}</p>
        </div>

        <div className="flex flex-col items-center gap-1 flex-1 mx-4">
          {isOver ? (
            <div className="flex flex-col items-center gap-2">
              <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10,
                          color: state.phase === 'victory' ? '#ffd166' : '#f45e3f' }}>
                {state.phase === 'victory' ? '🏆 YOU WIN' : '💀 YOU LOSE'}
              </p>
              {reward && (
                <p style={{ fontFamily: 'monospace', fontSize: 10, color: '#ffd166' }}>
                  +{reward.xp} XP{reward.coins > 0 ? ` · +${reward.coins} 🪙` : ''}
                </p>
              )}
              <button onClick={onReset}
                      style={{ padding: '6px 20px', background: '#1d2235', color: '#c8cfe8',
                               border: '1px solid #2e3755', fontFamily: 'monospace', fontSize: 9, cursor: 'pointer' }}>
                ← BACK TO LOBBY
              </button>
            </div>
          ) : opponentActing ? (
            <div className="flex flex-col items-center gap-1">
              <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: '#8892b8' }}>
                OPPONENT'S TURN
              </p>
              <p style={{ fontFamily: 'monospace', fontSize: 9, color: '#4a5578' }}>
                Waiting for opponent...
              </p>
            </div>
          ) : myTurn ? (
            <>
              <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: '#38d9a9' }}>
                YOUR TURN
              </p>
              <button
                onClick={() => submitQueue(localQueue)}
                style={{ padding: '6px 20px', fontFamily: "'Press Start 2P', monospace", fontSize: 8,
                         background: '#c42b2b', color: '#fff', boxShadow: '3px 3px 0 #7a1a0a',
                         border: 'none', cursor: 'pointer' }}>
                ▶ READY
              </button>
              {/* TurnTimer is isolated — its 1-second setState never re-renders the arena */}
              <TurnTimer initialTime={serverTime} />
            </>
          ) : (
            <p style={{ fontFamily: 'monospace', fontSize: 9, color: '#4a5578' }}>Starting...</p>
          )}
        </div>

        <p style={{ fontFamily: 'monospace', fontSize: 9, color: '#f45e3f', fontWeight: 'bold' }}>
          {opponentUsername ?? 'OPPONENT'}
        </p>
      </div>

      {/* ── Targeting banner ── */}
      <div className="flex items-center justify-between px-4 shrink-0"
           style={{
             height: 32,
             background: pendingSkill ? 'rgba(107,159,245,.12)' : 'transparent',
             borderBottom: `1px solid ${pendingSkill ? '#6b9ff544' : 'transparent'}`,
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

      {/* ── Battle field ── */}
      <BattleField>
        {[0, 1, 2].map(slot => (
          <CharacterRow
            key={slot} slot={slot}
            playerChar={playerChars[slot]}
            aiChar={aiChars[slot]}
            playerSelected={selectedChar === slot}
            aiTargeted={isValidAITarget(slot)}
            playerTargeted={isValidPlayerTarget(slot)}
            queuedSkillId={getQueuedSkillId(slot)}
            pendingSkillId={pendingSkill?.charIdx === slot ? pendingSkill.skillId : null}
            playerEnergy={getEnergyForChar(slot)}
            isPlayerTurn={isPlanning}
            incomingQueued={getIncomingQueued(slot)}
            playerIncomingQueued={getPlayerIncomingQueued(slot)}
            currentTurn={state.turn}
            onPlayerClick={() => {
              if (isValidPlayerTarget(slot))
                tryQueue(pendingSkill!.charIdx, pendingSkill!.skillId, 'player', slot)
              else
                setSelectedChar(slot)
            }}
            onAIClick={() => pendingSkill && tryQueue(pendingSkill.charIdx, pendingSkill.skillId, 'ai', slot)}
            onSkillClick={handleSkillClick}
            onSkillHover={() => {}}
            onRemoveQueued={casterIdx => dequeueLocal(casterIdx)}
          />
        ))}
      </BattleField>

      {logOpen && <BattleLogModal log={state.log} onClose={() => setLogOpen(false)} />}

      {/* ── Energy allocation modal ── */}
      {pendingAlloc && (() => {
        const skill = findEffectiveSkill(pendingAlloc.charIdx, pendingAlloc.skillId)
        if (!skill) return null
        return (
          <EnergyAllocModal
            skill={skill}
            availablePool={getAvailableForAlloc(pendingAlloc.charIdx, pendingAlloc.skillId)}
            onConfirm={allocation => {
              doQueue(pendingAlloc.charIdx, pendingAlloc.skillId, pendingAlloc.targetTeam, pendingAlloc.targetIdx, allocation)
              setPendingAlloc(null)
            }}
            onCancel={() => setPendingAlloc(null)}
          />
        )
      })()}

      {/* ── Turn summary modal ── */}
      {summary && (
        <div className="fixed inset-0 flex items-center justify-center z-50"
             style={{ background: 'rgba(0,0,0,.72)' }}>
          <div style={{ width: 480, maxHeight: '70vh', display: 'flex', flexDirection: 'column',
                        background: '#0c0e1a', border: `2px solid ${summary.phase === 'player' ? '#ffd166' : '#f45e3f'}`,
                        boxShadow: '0 8px 32px rgba(0,0,0,.9)' }}>
            <div className="flex items-center px-4 py-3"
                 style={{ background: '#0f1120', borderBottom: '2px solid #2e3755' }}>
              <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9,
                          color: '#ffd166' }}>
                BATTLE LOG — TURN {summary.turn}
              </p>
            </div>
            <div style={{ overflowY: 'auto', flex: 1, padding: '6px 0' }}>
              {(summary.phase === 'player' ? summary.playerLines : summary.aiLines).map((line, i) => (
                <div key={i} style={{ padding: '5px 14px', borderBottom: '1px solid #141726',
                                      fontSize: 11, color: '#8892b8' }}>{line}</div>
              ))}
            </div>
            <div style={{ borderTop: '2px solid #2e3755', padding: '10px 16px',
                          display: 'flex', justifyContent: 'flex-end', background: '#0f1120' }}>
              <button
                onClick={() => {
                  const hasActions = summary.aiLines.some(l => !l.startsWith('───'))
                  if (summary.phase === 'player' && hasActions)
                    setSummary({ ...summary, phase: 'ai' })
                  else setSummary(null)
                }}
                style={{ padding: '6px 20px', background: '#ffd166', color: '#0c0e1a',
                         fontFamily: "'Press Start 2P', monospace", fontSize: 8,
                         boxShadow: '3px 3px 0 #7a5b1e', border: 'none', cursor: 'pointer' }}>
                {summary.phase === 'player' && summary.aiLines.length > 0 ? 'NEXT ▶' : 'OK ▶'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Energy bar ── */}
      <div className="px-4 py-2 shrink-0 flex items-center justify-between gap-3" style={{ borderTop: '1px solid #1d2235', background: '#090b16' }}>
        <EnergyBar pool={state.player.energy} label="ENERGY" />
        <button type="button" onClick={() => setLogOpen(true)} className="shrink-0 px-3 py-1 text-xs font-bold uppercase tracking-widest" style={{ border: '1px solid #445180', background: '#141726', color: '#c8cfe8', fontFamily: 'monospace' }}>Battle Log</button>
      </div>
    </div>
  )
}
