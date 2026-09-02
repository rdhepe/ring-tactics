import { create } from 'zustand'
import type { BattleState, BattlePhase, Character, TeamId } from '../types'
import { buildAIQueue, initBattle, resolveSinglePlayerTurn } from '../engine/battle'

interface PendingSkill { charIdx: number; skillId: string }

interface BattleStore {
  battleState: BattleState | null
  selectedCharIdx: number
  pendingSkill: PendingSkill | null

  startBattle:    (playerChars: Character[], aiChars: Character[]) => void
  selectChar:     (idx: number) => void
  setPendingSkill:(p: PendingSkill | null) => void
  queueSkill:     (charIdx: number, skillId: string, targetTeam: TeamId, targetIdx: number, randomAllocation?: Partial<import('../types').EnergyPool>) => void
  dequeueSkill:   (charIdx: number) => void
  endTurn:        () => void
  reset:          () => void
}

export const useBattleStore = create<BattleStore>((set, get) => ({
  battleState: null,
  selectedCharIdx: 0,
  pendingSkill: null,

  startBattle: (playerChars, aiChars) => {
    set({ battleState: initBattle(playerChars, aiChars), selectedCharIdx: 0, pendingSkill: null })
  },

  selectChar: (idx) => set({ selectedCharIdx: idx, pendingSkill: null }),

  setPendingSkill: (p) => set({ pendingSkill: p }),

  queueSkill: (charIdx, skillId, targetTeam, targetIdx, randomAllocation) => {
    const { battleState } = get()
    if (!battleState) return
    const next = structuredClone(battleState) as BattleState
    next.playerQueue = next.playerQueue.filter(q => q.characterIndex !== charIdx)
    next.playerQueue.push({ characterIndex: charIdx, skillId, targetTeam, targetIndex: targetIdx, randomAllocation })
    set({ battleState: next, pendingSkill: null })
  },

  dequeueSkill: (charIdx) => {
    const { battleState } = get()
    if (!battleState) return
    const next = structuredClone(battleState) as BattleState
    next.playerQueue = next.playerQueue.filter(q => q.characterIndex !== charIdx)
    set({ battleState: next })
  },

  endTurn: () => {
    const { battleState } = get()
    if (!battleState || battleState.phase !== 'player_turn') return
    const afterPlayerTurn = resolveSinglePlayerTurn(battleState, 'player', battleState.playerQueue)
    if (afterPlayerTurn.phase !== 'player_turn') {
      set({ battleState: afterPlayerTurn, pendingSkill: null })
      return
    }

    set({
      battleState: { ...afterPlayerTurn, phase: 'ai_turn' as BattlePhase },
      pendingSkill: null,
    })
    // AI "thinks" for a short random window then resolves
    const thinkMs = 800 + Math.random() * 700
    setTimeout(() => {
      const cur = get().battleState
      if (!cur || cur.phase !== 'ai_turn') return
      const aiQueue = buildAIQueue(cur)
      set({ battleState: resolveSinglePlayerTurn(cur, 'ai', aiQueue), selectedCharIdx: 0 })
    }, thinkMs)
  },

  reset: () => set({ battleState: null, selectedCharIdx: 0, pendingSkill: null }),
}))
