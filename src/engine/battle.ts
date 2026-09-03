import type {
  BattleState, BattleTeam, BattleCharacter, Character,
  EnergyPool, EnergyCost, QueuedSkill, TeamId, ActiveEffect, Skill, SkillEffect, CombatMode,
} from '../types'

// ─── Constants ────────────────────────────────────────────────────────────────

const ENERGY_TYPES = ['strength', 'magic', 'spirit', 'agility'] as const
type EKey = typeof ENERGY_TYPES[number]

const LOG_MAX = 80

// ─── Init ─────────────────────────────────────────────────────────────────────

function makeBattleChar(character: Character): BattleCharacter {
  const activeEffects: ActiveEffect[] = character.skills.some(skill => skill.modeToggle)
    ? [{
        key: 'precision_mode_default',
        sourceSkillId: 'mode_toggle',
        sourceCharacterId: character.id,
        effect: { type: 'precision_mode', value: 1, duration: 9999 },
        turnsLeft: 9999,
        stacks: 1,
      }]
    : []
  return { character, hp: character.maxHp, maxHp: character.maxHp, cooldowns: {}, activeEffects, isDead: false, skillUseCounts: {}, skillLastUsedTurn: {} }
}

function makeTeam(id: TeamId, characters: Character[]): BattleTeam {
  return { id, characters: characters.map(makeBattleChar), energy: { strength: 0, magic: 0, spirit: 0, agility: 0 } }
}

export function randEnergyType(): EKey {
  return ENERGY_TYPES[Math.floor(Math.random() * 4)]
}

export function grantEnergy(team: BattleTeam, count: number): void {
  const MAX_PER_TYPE = 3
  for (let i = 0; i < count; i++) {
    const t = randEnergyType()
    if (team.energy[t] < MAX_PER_TYPE) team.energy[t]++
  }
}

export function initBattle(playerChars: Character[], aiChars: Character[]): BattleState {
  const player = makeTeam('player', playerChars)
  const ai = makeTeam('ai', aiChars)
  // Turn 1: each side starts with only 1 random energy (Soul Arena rule)
  grantEnergy(player, 1)
  grantEnergy(ai, 1)
  return { phase: 'player_turn', turn: 1, player, ai, playerQueue: [], aiQueue: [], log: ['⚔ Battle begins! Turn 1 — you receive 1 energy (opening round).'] }
}

// ─── Energy ───────────────────────────────────────────────────────────────────

export function canAfford(cost: EnergyCost, pool: EnergyPool): boolean {
  for (const t of ENERGY_TYPES) if ((cost[t] ?? 0) > pool[t]) return false
  const remaining = ENERGY_TYPES.reduce((s, t) => s + pool[t] - (cost[t] ?? 0), 0)
  return remaining >= (cost.random ?? 0)
}

export function spendEnergy(
  cost: EnergyCost,
  pool: EnergyPool,
  /** player-chosen allocation for ? slots; falls back to greedy if absent */
  randomAllocation?: Partial<EnergyPool>,
): void {
  for (const t of ENERGY_TYPES) pool[t] -= (cost[t] ?? 0)
  if (randomAllocation) {
    for (const t of ENERGY_TYPES) pool[t] -= (randomAllocation[t] ?? 0)
  } else {
    let rand = cost.random ?? 0
    for (const t of ENERGY_TYPES) {
      if (rand <= 0) break
      const take = Math.min(rand, pool[t])
      pool[t] -= take
      rand -= take
    }
  }
}

// ─── Status queries ───────────────────────────────────────────────────────────

export function isStunned(char: BattleCharacter): boolean {
  return char.activeEffects.some(ae => ae.effect.type === 'stun')
}

export function isInvulnerable(char: BattleCharacter): boolean {
  return char.activeEffects.some(ae => ae.effect.type === 'invulnerable')
}

function isInSetupMode(char: BattleCharacter): boolean {
  return char.activeEffects.some(ae => ae.effect.type === 'setup_mode')
}

export function getCombatMode(char: BattleCharacter): CombatMode {
  return char.activeEffects.some(ae => ae.effect.type === 'chaos_mode') ? 'chaos' : 'precision'
}

export function getEffectiveSkill(char: BattleCharacter, skill: Skill): Skill {
  if (char.character.id === 'echo' && skill.id === 'echo_s2' && char.copiedAttack) {
    const copied = char.copiedAttack.skill
    return { ...skill, ...copied, id: skill.id, cost: skill.cost, cooldown: skill.cooldown, iconColor: skill.iconColor }
  }
  const variant = skill.modeVariants?.[getCombatMode(char)] ?? (isInSetupMode(char) ? skill.setupVariant : undefined)
  if (!variant) return skill
  return {
    ...skill,
    ...variant,
    id: skill.id,
    iconColor: skill.iconColor,
    iconUrl: variant.iconUrl ?? skill.iconUrl,
    cost: variant.cost ?? skill.cost,
    cooldown: variant.cooldown ?? skill.cooldown,
    targetType: variant.targetType ?? skill.targetType,
    mainClass: variant.mainClass ?? skill.mainClass,
    persistence: variant.persistence ?? skill.persistence,
    isAffliction: variant.isAffliction ?? skill.isAffliction,
  }
}

export function switchCombatMode(state: BattleState, teamId: TeamId, charIndex: number): BattleState {
  const next = structuredClone(state) as BattleState
  const team = teamId === 'player' ? next.player : next.ai
  const char = team.characters[charIndex]
  const toggleSkill = char?.character.skills.find(skill => skill.modeToggle)
  if (!char || char.isDead || !toggleSkill || isStunned(char)) return next
  if (char.skillLastUsedTurn[toggleSkill.id] === next.turn) return next

  const current = getCombatMode(char)
  const nextMode: CombatMode = current === 'precision' ? 'chaos' : 'precision'
  char.activeEffects = char.activeEffects.filter(ae => ae.effect.type !== 'precision_mode' && ae.effect.type !== 'chaos_mode')
  char.activeEffects.push({
    key: `${nextMode}_mode_${toggleSkill.id}` as ActiveEffect['key'],
    sourceSkillId: toggleSkill.id,
    sourceCharacterId: char.character.id,
    effect: { type: nextMode === 'precision' ? 'precision_mode' : 'chaos_mode', value: 1, duration: 9999 },
    turnsLeft: 9999,
    stacks: 1,
  })
  char.skillLastUsedTurn[toggleSkill.id] = next.turn
  char.cooldowns[toggleSkill.id] = 1
  next.playerQueue = next.playerQueue.filter(q => !(teamId === 'player' && q.characterIndex === charIndex))
  next.aiQueue = next.aiQueue.filter(q => !(teamId === 'ai' && q.characterIndex === charIndex))
  next.log = [...next.log, `${char.character.name} switches to ${nextMode === 'precision' ? 'Precision' : 'Chaos'} Mode.`].slice(-LOG_MAX)
  return next
}

function getDR(char: BattleCharacter): number {
  return char.activeEffects.filter(ae => ae.effect.type === 'damage_reduction').reduce((s, ae) => s + ae.effect.value, 0)
}

function getDmgBoost(char: BattleCharacter): number {
  return char.activeEffects.filter(ae => ae.effect.type === 'damage_boost').reduce((s, ae) => s + ae.effect.value, 0)
}

function getDmgPenalty(char: BattleCharacter): number {
  return char.activeEffects.filter(ae => ae.effect.type === 'damage_penalty').reduce((s, ae) => s + ae.effect.value, 0)
}

const OFFENSIVE_EFFECT_TYPES = new Set<SkillEffect['type']>(['damage', 'pierce_damage', 'affliction', 'conditional_damage', 'marked_bonus_damage'])

function isOffensiveSkill(skill: Skill): boolean {
  return skill.effects.some(effect => OFFENSIVE_EFFECT_TYPES.has(effect.type))
}

function storeCopiedAttack(char: BattleCharacter, skill: Skill, turn: number, log: string[]): void {
  if (!isOffensiveSkill(skill)) return
  char.copiedAttack = {
    skill: {
      ...structuredClone(skill),
      effects: skill.effects.map(effect => OFFENSIVE_EFFECT_TYPES.has(effect.type)
        ? { ...effect, value: Math.floor(effect.value * 0.8) }
        : { ...effect }),
    },
    expiresAtTurn: turn + 2,
  }
  log.push(`${char.character.name} copies ${skill.name} for 2 rounds.`)
}

function consumeFirstEffect(char: BattleCharacter, type: SkillEffect['type']): SkillEffect | undefined {
  const index = char.activeEffects.findIndex(ae => ae.effect.type === type)
  if (index === -1) return undefined
  const [effect] = char.activeEffects.splice(index, 1)
  return effect.effect
}

function rememberAttack(attacker: BattleCharacter, target: BattleCharacter): void {
  const key = `attacked_target_${target.character.id}` as ActiveEffect['key']
  attacker.activeEffects = attacker.activeEffects.filter(ae => ae.key !== key)
  attacker.activeEffects.push({
    key,
    sourceSkillId: 'basic_attack_memory',
    sourceCharacterId: target.character.id,
    effect: { type: 'attacked_target', value: 0, duration: 1 },
    turnsLeft: 2,
    stacks: 1,
  })
}

function hasEffectFromSource(char: BattleCharacter, type: SkillEffect['type'], sourceCharacterId: string): boolean {
  return char.activeEffects.some(ae => ae.effect.type === type && ae.sourceCharacterId === sourceCharacterId)
}

function consumeEffectFromSource(char: BattleCharacter, type: SkillEffect['type'], sourceCharacterId: string): boolean {
  const index = char.activeEffects.findIndex(ae => ae.effect.type === type && ae.sourceCharacterId === sourceCharacterId)
  if (index === -1) return false
  char.activeEffects.splice(index, 1)
  return true
}

// ─── Damage application ───────────────────────────────────────────────────────

function applyDmg(
  char: BattleCharacter,
  raw: number,
  dtype: 'normal' | 'pierce' | 'affliction',
  attacker?: BattleCharacter,
  log?: string[],
): number {
  let dmg = raw
  if (attacker) {
    const counterGuard = consumeFirstEffect(char, 'counter_guard')
    if (counterGuard) {
      const reduced = Math.min(counterGuard.value, dmg)
      dmg -= reduced
      log?.push(`${char.character.name}'s reversal reduces incoming damage by ${reduced}`)
      const counterDamage = counterGuard.counterDamage ?? 0
      if (counterDamage > 0 && !attacker.isDead) {
        applyDmg(attacker, counterDamage, 'normal')
        log?.push(`${char.character.name} reverses ${attacker.character.name} for ${counterDamage} damage`)
      }
    }
  }
  if (dtype === 'affliction') {
    char.hp = Math.max(0, char.hp - dmg)
    return dmg
  }
  if (dtype === 'normal') dmg = Math.max(0, dmg - getDR(char))
  // pierce ignores DR but both go through destructible defense
  const ddList = char.activeEffects.filter(ae => ae.effect.type === 'destructible_defense')
  for (const ae of ddList) {
    if (dmg <= 0) break
    const absorbed = Math.min(ae.effect.value, dmg)
    ae.effect.value -= absorbed
    dmg -= absorbed
  }
  char.activeEffects = char.activeEffects.filter(ae => ae.effect.type !== 'destructible_defense' || ae.effect.value > 0)
  char.hp = Math.max(0, char.hp - Math.max(0, dmg))
  return Math.max(0, dmg)
}

// ─── Effect application ───────────────────────────────────────────────────────

// passive status effect types — listed here so addActiveEffect can reference them
const PASSIVE_TYPES = new Set(['stun', 'invulnerable', 'damage_reduction', 'destructible_defense', 'damage_boost', 'damage_mark', 'counter_guard', 'damage_penalty', 'target_lock', 'attacked_target', 'setup_mode', 'skill_mark', 'precision_mode', 'chaos_mode'])

function addActiveEffect(char: BattleCharacter, skillId: string, charId: string, effect: SkillEffect): void {
  const key = `${effect.type}_${skillId}` as ActiveEffect['key']
  char.activeEffects = char.activeEffects.filter(ae => ae.key !== key)
  // +1 so passive effects survive the end-of-turn tick and last the full declared duration
  const turnsLeft = PASSIVE_TYPES.has(effect.type) ? effect.duration + 1 : effect.duration
  char.activeEffects.push({ key, sourceSkillId: skillId, sourceCharacterId: charId, effect: { ...effect }, turnsLeft, stacks: 1 })
}

function applyInstant(
  effect: SkillEffect,
  skillId: string,
  actor: BattleCharacter, actorTeam: BattleTeam,
  target: BattleCharacter, targetTeam: BattleTeam,
  log: string[],
): void {
  const boost = getDmgBoost(actor)
  const outgoingPenalty = getDmgPenalty(actor)
  const aName = actor.character.name
  const tName = target.character.name
  switch (effect.type) {
    case 'damage': {
      const amount = Math.max(0, effect.value + boost - outgoingPenalty)
      applyDmg(target, amount, 'normal', actor, log)
      consumeFirstEffect(actor, 'damage_penalty')
      rememberAttack(actor, target)
      log.push(`${aName} deals ${amount} dmg to ${tName}`)
      break
    }
    case 'pierce_damage': {
      const amount = Math.max(0, effect.value + boost - outgoingPenalty)
      applyDmg(target, amount, 'pierce', actor, log)
      consumeFirstEffect(actor, 'damage_penalty')
      rememberAttack(actor, target)
      log.push(`${aName} pierces ${tName} for ${amount} dmg`)
      break
    }
    case 'affliction': {
      const amount = Math.max(0, effect.value + boost - outgoingPenalty)
      applyDmg(target, amount, 'affliction', actor, log)
      consumeFirstEffect(actor, 'damage_penalty')
      rememberAttack(actor, target)
      log.push(`${aName} afflicts ${tName} for ${amount}`)
      break
    }
    case 'conditional_damage': {
      if (!hasEffectFromSource(target, 'attacked_target', actor.character.id)) break
      const amount = Math.max(0, effect.value + boost - outgoingPenalty)
      applyDmg(target, amount, 'normal', actor, log)
      consumeFirstEffect(actor, 'damage_penalty')
      log.push(`${aName} counters ${tName} for ${amount} bonus damage`)
      break
    }
    case 'marked_bonus_damage': {
      if (!hasEffectFromSource(target, 'skill_mark', actor.character.id)) break
      const amount = Math.max(0, effect.value + boost - outgoingPenalty)
      applyDmg(target, amount, 'normal', actor, log)
      consumeFirstEffect(actor, 'damage_penalty')
      if (effect.consumeMark) consumeEffectFromSource(target, 'skill_mark', actor.character.id)
      log.push(`${aName} exploits ${tName}'s mark for +${amount} damage`)
      break
    }
    case 'consume_mark_stun': {
      if (!consumeEffectFromSource(target, 'skill_mark', actor.character.id)) break
      addActiveEffect(target, skillId, actor.character.id, { type: 'stun', value: effect.value, duration: effect.duration })
      log.push(`${aName}'s trap stuns ${tName}`)
      break
    }
    case 'consume_mark':
      consumeEffectFromSource(target, 'skill_mark', actor.character.id)
      break
    case 'self_damage':
      applyDmg(actor, effect.value, 'affliction')
      log.push(`${aName} takes ${effect.value} recoil damage`)
      break
    case 'heal': {
      const before = target.hp
      target.hp = Math.min(target.maxHp, target.hp + effect.value)
      log.push(`${aName} heals ${tName} for ${target.hp - before}`)
      break
    }
    case 'energy_gain':
      for (let i = 0; i < effect.value; i++) actorTeam.energy[randEnergyType()]++
      log.push(`${aName} gains ${effect.value} energy`)
      break
    case 'energy_drain': {
      const MAX_PER_TYPE = 3
      let left = effect.value, drained = 0
      while (left > 0) {
        const available = ENERGY_TYPES.filter(t => targetTeam.energy[t] > 0)
        if (available.length === 0) break
        const t = available[Math.floor(Math.random() * available.length)]
        targetTeam.energy[t]--
        actorTeam.energy[t] = Math.min(MAX_PER_TYPE, actorTeam.energy[t] + 1)
        left--; drained++
      }
      log.push(`${aName} steals ${drained} energy from ${targetTeam.id === 'player' ? 'you' : 'enemy'}`)
      break
    }
    case 'target_lock':
      break
    case 'consume_setup':
      consumeFirstEffect(actor, 'setup_mode')
      log.push(`${aName}'s setup ends`)
      break
  }
}

// ─── Resolve targets ──────────────────────────────────────────────────────────

function resolveTargets(
  effectTarget: string,
  actor: BattleCharacter, actorTeam: BattleTeam, enemyTeam: BattleTeam,
  queuedTarget: BattleCharacter,
): { chars: BattleCharacter[]; team: BattleTeam }[] {
  switch (effectTarget) {
    case 'self':        return [{ chars: [actor],                                              team: actorTeam }]
    case 'ally':        return [{ chars: [queuedTarget].filter(c => !c.isDead),               team: actorTeam }]
    case 'all_allies':  return actorTeam.characters.filter(c => !c.isDead).map(c => ({ chars: [c], team: actorTeam }))
    case 'enemy':       return [{ chars: [queuedTarget].filter(c => !c.isDead && !isInvulnerable(c)), team: enemyTeam }]
    case 'all_enemies': return enemyTeam.characters.filter(c => !c.isDead && !isInvulnerable(c)).map(c => ({ chars: [c], team: enemyTeam }))
    case 'any':         return [{ chars: [queuedTarget].filter(c => !c.isDead),               team: enemyTeam }]
    default:            return []
  }
}

// ─── Skill execution ──────────────────────────────────────────────────────────

// immediate effect types for instant skills
const INSTANT_TYPES = new Set(['damage', 'pierce_damage', 'affliction', 'conditional_damage', 'marked_bonus_damage', 'consume_mark', 'consume_mark_stun', 'consume_setup', 'self_damage', 'heal', 'energy_gain', 'energy_drain'])

export function executeQueuedSkill(state: BattleState, queued: QueuedSkill, actorTeamId: TeamId, log: string[]): void {
  const actorTeam = actorTeamId === 'player' ? state.player : state.ai
  const enemyTeam = actorTeamId === 'player' ? state.ai : state.player
  const actor = actorTeam.characters[queued.characterIndex]
  if (!actor || actor.isDead) return

  const baseSkill = actor.character.skills.find(s => s.id === queued.skillId)
  if (!baseSkill) return
  if (baseSkill.modeToggle) return
  if (actor.copiedAttack && actor.copiedAttack.expiresAtTurn < state.turn) delete actor.copiedAttack
  const skill = getEffectiveSkill(actor, baseSkill)

  if (isStunned(actor)) { log.push(`${actor.character.name} is stunned!`); return }
  if ((actor.cooldowns[skill.id] ?? 0) > 0) { log.push(`${actor.character.name}'s ${skill.name} is on cooldown!`); return }
  if (!canAfford(skill.cost, actorTeam.energy)) { log.push(`${actor.character.name} can't afford ${skill.name}!`); return }

  if (actor.character.id === 'echo' && baseSkill.id === 'echo_s1') {
    if (state.lastOffensiveSkill) storeCopiedAttack(actor, state.lastOffensiveSkill, state.turn, log)
    else log.push(`${actor.character.name} has no offensive attack to copy.`)
  }

  const targetLock = actor.activeEffects.find(ae => ae.effect.type === 'target_lock')
  let targetTeamId = queued.targetTeam
  let targetIndex = queued.targetIndex
  if (targetLock && (skill.targetType === 'enemy' || skill.targetType === 'any')) {
    const lockedIndex = enemyTeam.characters.findIndex(c => c.character.id === targetLock.sourceCharacterId && !c.isDead)
    if (lockedIndex !== -1) {
      targetTeamId = enemyTeam.id
      targetIndex = lockedIndex
    }
  }

  const isEnemyTarget = targetTeamId !== actorTeamId
  const targetTeam = targetTeamId === 'player' ? state.player : state.ai
  const primaryTarget = targetTeam.characters[targetIndex]

  if (skill.targetType === 'all_enemies' && isOffensiveSkill(skill)) {
    const protectedEcho = enemyTeam.characters.find(char =>
      char.character.id === 'echo' && isInvulnerable(char) && char.perfectCopyTriggeredTurn !== state.turn)
    if (protectedEcho) {
      storeCopiedAttack(protectedEcho, skill, state.turn, log)
      protectedEcho.perfectCopyTriggeredTurn = state.turn
    }
  }

  // For single-enemy skills, bail if invulnerable
  if (isEnemyTarget && primaryTarget && isInvulnerable(primaryTarget)
    && (skill.targetType === 'enemy' || skill.targetType === 'any')) {
    if (primaryTarget.character.id === 'echo' && primaryTarget.perfectCopyTriggeredTurn !== state.turn && isOffensiveSkill(skill)) {
      storeCopiedAttack(primaryTarget, skill, state.turn, log)
      primaryTarget.perfectCopyTriggeredTurn = state.turn
    }
    log.push(`${primaryTarget.character.name} is invulnerable! ${skill.name} fails.`)
    return
  }

  spendEnergy(skill.cost, actorTeam.energy, queued.randomAllocation)
  if (skill.cooldown > 0) actor.cooldowns[skill.id] = skill.cooldown + 1
  actor.skillUseCounts[skill.id] = (actor.skillUseCounts[skill.id] ?? 0) + 1
  actor.skillLastUsedTurn[skill.id] = state.turn
  if (isOffensiveSkill(skill)) state.lastOffensiveSkill = structuredClone(skill)
  if (actor.character.id === 'echo' && baseSkill.id === 'echo_s2' && actor.copiedAttack) {
    delete actor.copiedAttack
    log.push(`${actor.character.name}'s copied attack fades.`)
  }
  if (targetLock && (skill.targetType === 'enemy' || skill.targetType === 'any')) consumeFirstEffect(actor, 'target_lock')

  // ─── damage_mark: apply accumulated bonus, then increment/refresh the mark ───
  for (const effect of skill.effects) {
    if (effect.type !== 'damage_mark') continue
    const groups = resolveTargets(effect.target ?? skill.targetType, actor, actorTeam, enemyTeam, primaryTarget)
    for (const { chars } of groups) {
      for (const t of chars) {
        const markKey = `damage_mark_${skill.id}` as ActiveEffect['key']
        const existing = t.activeEffects.find(ae => ae.key === markKey)
        if (existing) {
          const bonus = existing.effect.value
          applyDmg(t, bonus, 'pierce')
          log.push(`💪 ${actor.character.name}'s Haymaker combo hits ${t.character.name} for +${bonus} extra!`)
          existing.effect.value = effect.maxValue !== undefined
            ? Math.min(existing.effect.value + effect.value, effect.maxValue)
            : existing.effect.value + effect.value   // increment for next hit
          existing.turnsLeft = effect.duration + 1 // refresh decay window
        } else {
          addActiveEffect(t, skill.id, actor.character.id, effect)
          log.push(`${actor.character.name} locks onto ${t.character.name}!`)
        }
      }
    }
  }

  for (const effect of skill.effects) {
    if (effect.type === 'damage_mark') continue // handled in pre-pass above
    const effectTargetStr = effect.target ?? skill.targetType
    const groups = resolveTargets(effectTargetStr, actor, actorTeam, enemyTeam, primaryTarget)
    const uses = actor.skillUseCounts[skill.id]
    const finalEffect = effect.stackIncrement && uses > 1
      ? { ...effect, value: effect.value + effect.stackIncrement * (uses - 1) }
      : effect

    for (const { chars, team: tTeam } of groups) {
      for (const t of chars) {
        const isInstant = (skill.persistence === 'instant' && INSTANT_TYPES.has(effect.type))
          || effect.type === 'consume_setup'
          || effect.type === 'consume_mark_stun'
        const isPassive = PASSIVE_TYPES.has(effect.type)
        const isActionEffect = skill.persistence !== 'instant'

        if (isInstant) {
          applyInstant(finalEffect, skill.id, actor, actorTeam, t, tTeam, log)
        } else if (isPassive || isActionEffect) {
          addActiveEffect(t, skill.id, actor.character.id, finalEffect)
          const verb: Record<string, string> = {
            stun: 'stuns', invulnerable: 'shields', damage_reduction: 'guards',
            destructible_defense: 'fortifies', damage_boost: 'empowers',
            affliction: 'poisons', damage: 'marks', heal: 'heals', energy_gain: 'charges',
          }
          log.push(`${actor.character.name} ${verb[effect.type] ?? 'affects'} ${t.character.name} (${finalEffect.duration}t)`)
        }
      }
    }
  }
}

// ─── Per-turn ticking ─────────────────────────────────────────────────────────

const TICK_TYPES = new Set(['damage', 'pierce_damage', 'affliction', 'heal', 'energy_gain'])

export function tickCharEffects(
  char: BattleCharacter,
  charTeam: BattleTeam,
  log: string[],
  tickDamageMarks = true,
): void {
  for (const ae of char.activeEffects) {
    if (ae.effect.type === 'damage_mark' && !tickDamageMarks) continue

    if (TICK_TYPES.has(ae.effect.type)) {
      switch (ae.effect.type) {
        case 'damage':       applyDmg(char, ae.effect.value, 'normal');     log.push(`${char.character.name} burns for ${ae.effect.value}`); break
        case 'pierce_damage':applyDmg(char, ae.effect.value, 'pierce');     log.push(`${char.character.name} bleeds for ${ae.effect.value}`); break
        case 'affliction':   applyDmg(char, ae.effect.value, 'affliction'); log.push(`${char.character.name} suffers ${ae.effect.value} affliction`); break
        case 'heal': {
          const prev = char.hp
          char.hp = Math.min(char.maxHp, char.hp + ae.effect.value)
          log.push(`${char.character.name} regenerates ${char.hp - prev} hp`)
          break
        }
        case 'energy_gain':
          for (let i = 0; i < ae.effect.value; i++) charTeam.energy[(ae.effect.energyType as EKey) ?? randEnergyType()]++
          break
      }
    }
    ae.turnsLeft--
  }
  char.activeEffects = char.activeEffects.filter(ae => ae.turnsLeft > 0)
}

function tickCooldowns(char: BattleCharacter): void {
  for (const id in char.cooldowns) {
    char.cooldowns[id]--
    if (char.cooldowns[id] <= 0) delete char.cooldowns[id]
  }
}

// ─── Win/loss ─────────────────────────────────────────────────────────────────

function markDead(state: BattleState): void {
  for (const c of [...state.player.characters, ...state.ai.characters]) {
    if (c.hp <= 0) { c.isDead = true; c.activeEffects = []; c.cooldowns = {} }
  }
}

export function checkEnd(state: BattleState): 'victory' | 'defeat' | null {
  const pDead = state.player.characters.every(c => c.isDead)
  const aDead = state.ai.characters.every(c => c.isDead)
  if (aDead) return 'victory'
  if (pDead) return 'defeat'
  return null
}

// ─── AI ───────────────────────────────────────────────────────────────────────

type AIStrategy = 'aggressive' | 'defensive' | 'balanced'

function aiStrategy(state: BattleState): AIStrategy {
  const alive = (chars: BattleCharacter[]) => chars.filter(c => !c.isDead)
  const avgHp  = (chars: BattleCharacter[]) => {
    const a = alive(chars)
    return a.length ? a.reduce((s, c) => s + c.hp / c.maxHp, 0) / a.length : 0
  }
  const aiAlive = alive(state.ai.characters).length
  const plAlive = alive(state.player.characters).length
  const aiHp    = avgHp(state.ai.characters)
  const plHp    = avgHp(state.player.characters)

  if (aiHp < 0.35 || aiAlive < plAlive) return 'defensive'
  if (plHp < 0.35 || aiAlive > plAlive) return 'aggressive'
  return 'balanced'
}

/** Rough offensive threat of a character based on skill damage totals */
function threatScore(char: BattleCharacter): number {
  return char.character.skills.reduce((s, sk) =>
    s + sk.effects
      .filter(e => ['damage', 'pierce_damage', 'affliction'].includes(e.type))
      .reduce((ss, e) => ss + e.value, 0), 0)
}

function hasEffect(char: BattleCharacter, type: string): boolean {
  return char.activeEffects.some(ae => ae.effect.type === type)
}

/** Score a single skill in context; also decides best target index + team */
function evaluateSkill(
  skill: Skill,
  actor: BattleCharacter,
  actorIdx: number,
  team: BattleTeam,
  enemies: BattleCharacter[],
  state: BattleState,
  strategy: AIStrategy,
): { score: number; targetTeamId: TeamId; targetIdx: number } {
  const allies       = team.characters
  const aliveEnemies = enemies.filter(e => !e.isDead)
  const aliveAllies  = allies.filter(a => !a.isDead)
  let score = 0
  let targetTeamId: TeamId = 'player'
  let targetIdx = 0

  for (const effect of skill.effects) {
    switch (effect.type) {
      case 'damage':
      case 'pierce_damage':
      case 'affliction': {
        const mult = strategy === 'aggressive' ? 1.5 : strategy === 'defensive' ? 0.75 : 1.0
        const validTargets = aliveEnemies.filter(e => !isInvulnerable(e))
        if (!validTargets.length) { score -= 500; break }
        // Prefer finishing off the weakest enemy
        const target = validTargets.reduce((a, b) => b.hp < a.hp ? b : a)
        // Bonus for near-kill
        const killBonus = target.hp <= effect.value ? 20 : 0
        score += effect.value * mult + killBonus
        targetIdx = enemies.indexOf(target)
        break
      }

      case 'heal': {
        if (!aliveAllies.length) break
        const target = aliveAllies.reduce((a, b) => (b.hp / b.maxHp) < (a.hp / a.maxHp) ? b : a)
        const ratio  = target.hp / target.maxHp
        if (ratio > 0.88) { score -= 15; break } // not worth healing near-full HP
        const urgency = ratio < 0.25 ? 4.5 : ratio < 0.5 ? 2.2 : 1.0
        score += effect.value * urgency * (strategy === 'defensive' ? 1.6 : 0.85)
        targetIdx    = allies.indexOf(target)
        targetTeamId = 'ai'
        break
      }

      case 'stun': {
        const validTargets = aliveEnemies.filter(e => !isInvulnerable(e) && !isStunned(e))
        if (!validTargets.length) { score -= 500; break }
        // Stun the highest-threat enemy
        const target = validTargets.reduce((a, b) => threatScore(b) > threatScore(a) ? b : a)
        score   += 30 + effect.duration * 14
        targetIdx = enemies.indexOf(target)
        break
      }

      case 'invulnerable': {
        if (hasEffect(actor, 'invulnerable')) { score -= 200; break }
        const ratio = actor.hp / actor.maxHp
        score += ratio < 0.30 ? 50 : ratio < 0.55 ? 30 : ratio < 0.75 ? 18 : 8
        targetTeamId = 'ai'; targetIdx = actorIdx
        break
      }

      case 'damage_reduction': {
        if (hasEffect(actor, 'damage_reduction')) { score -= 50; break }
        const ratio = actor.hp / actor.maxHp
        score += effect.value * effect.duration
          * (strategy === 'defensive' ? 1.5 : 0.9)
          * (ratio < 0.5 ? 1.4 : 1.0)
        targetTeamId = 'ai'; targetIdx = actorIdx
        break
      }

      case 'destructible_defense': {
        if (hasEffect(actor, 'destructible_defense')) { score -= 50; break }
        const ratio = actor.hp / actor.maxHp
        score += effect.value
          * (strategy === 'defensive' ? 1.3 : 0.7)
          * (ratio < 0.5 ? 1.5 : 1.0)
        targetTeamId = 'ai'; targetIdx = actorIdx
        break
      }

      case 'damage_boost': {
        if (hasEffect(actor, 'damage_boost')) { score -= 50; break }
        // Only valuable if this character has damage skills
        const hasDmg = actor.character.skills.some(sk =>
          sk.effects.some(e => ['damage', 'pierce_damage', 'affliction'].includes(e.type)))
        if (!hasDmg) { score -= 20; break }
        score += effect.value * effect.duration * (strategy === 'aggressive' ? 1.6 : 1.0)
        targetTeamId = 'ai'; targetIdx = actorIdx
        break
      }

      case 'energy_drain': {
        const enemyPool = Object.values(state.player.energy).reduce((s, v) => s + v, 0)
        score += Math.min(effect.value, enemyPool) * 8
        const validTargets = aliveEnemies.filter(e => !isInvulnerable(e))
        if (validTargets.length)
          targetIdx = enemies.indexOf(validTargets.reduce((a, b) => b.hp < a.hp ? b : a))
        break
      }

      case 'energy_gain': {
        score += effect.value * 4
        targetTeamId = 'ai'; targetIdx = actorIdx
        break
      }
    }
  }

  return { score, targetTeamId, targetIdx }
}

export function buildAIQueue(state: BattleState): QueuedSkill[] {
  const queue: QueuedSkill[] = []
  const team     = state.ai
  const enemies  = state.player.characters
  const strategy = aiStrategy(state)
  // Use a local copy so AI character budget checks don't modify the real state
  const remainingEnergy = { ...team.energy }

  for (let ci = 0; ci < team.characters.length; ci++) {
    const char = team.characters[ci]
    if (char.isDead || isStunned(char)) continue

    let best: { score: number; skillId: string; targetTeamId: TeamId; targetIdx: number } | null = null

    for (const skill of char.character.skills) {
      if (!canAfford(skill.cost, remainingEnergy)) continue
      if ((char.cooldowns[skill.id] ?? 0) > 0) continue

      const { score, targetTeamId, targetIdx } =
        evaluateSkill(skill, char, ci, team, enemies, state, strategy)

      if (best === null || score > best.score)
        best = { score, skillId: skill.id, targetTeamId, targetIdx }
    }

    // Skip if no worthwhile move found (conserve energy)
    if (!best || best.score < 1) continue

    const skill = char.character.skills.find(s => s.id === best!.skillId)!
    spendEnergy(skill.cost, remainingEnergy) // deduct from local budget so later chars see correct totals
    queue.push({ characterIndex: ci, skillId: best.skillId, targetTeam: best.targetTeamId, targetIndex: best.targetIdx })
  }

  return queue
}

// ─── Full turn resolution ─────────────────────────────────────────────────────

export function resolveTurn(state: BattleState): BattleState {
  const next = structuredClone(state) as BattleState
  const turnLog: string[] = [`─── Turn ${next.turn} — Your moves ───`]

  // ── PHASE 1: player acts first ──────────────────────────────────────────────
  for (let slot = 0; slot < 3; slot++) {
    const pq = next.playerQueue.find(q => q.characterIndex === slot)
    if (pq) { executeQueuedSkill(next, pq, 'player', turnLog); markDead(next) }
  }

  // ── PHASE 2: AI reacts to updated state (sees player damage/debuffs) ────────
  const midResult = checkEnd(next)
  if (!midResult) {
    turnLog.push(`─ Opponent responds ─`)
    const aiQueue = buildAIQueue(next)
    next.aiQueue = aiQueue
    for (let slot = 0; slot < 3; slot++) {
      const aq = aiQueue.find(q => q.characterIndex === slot)
      if (aq) { executeQueuedSkill(next, aq, 'ai', turnLog); markDead(next) }
    }
  }

  // Tick action/DoT effects
  for (const c of next.player.characters) if (!c.isDead) tickCharEffects(c, next.player, turnLog)
  for (const c of next.ai.characters)     if (!c.isDead) tickCharEffects(c, next.ai, turnLog)

  // Tick cooldowns
  for (const c of [...next.player.characters, ...next.ai.characters]) tickCooldowns(c)

  markDead(next)
  const result = checkEnd(next)
  if (result) {
    next.phase = result
    turnLog.push(result === 'victory' ? '🏆 Victory! All enemies defeated.' : '💀 Defeat. Your team fell.')
  } else {
    next.turn++
    // reset stacking bonuses for skills not used within their decay window
    for (const team of [next.player, next.ai]) {
      for (const char of team.characters) {
        for (const skill of char.character.skills) {
          const e = skill.effects.find(ef => ef.stackDecayTurns && ef.stackIncrement)
          if (!e?.stackDecayTurns) continue
          const lastUsed = char.skillLastUsedTurn[skill.id]
          if (lastUsed !== undefined && (next.turn - lastUsed) > e.stackDecayTurns) {
            char.skillUseCounts[skill.id] = 0
            delete char.skillLastUsedTurn[skill.id]
          }
        }
      }
    }
    next.phase = 'player_turn'
    const alive = (t: BattleTeam) => t.characters.filter(c => !c.isDead).length
    const playerAlive = alive(next.player)
    const aiAlive    = alive(next.ai)
    const pGain = Math.max(1, Math.ceil(playerAlive / 2))
    const aGain = Math.max(1, Math.ceil(aiAlive / 2))
    grantEnergy(next.player, pGain)
    grantEnergy(next.ai, aGain)
    turnLog.push(`─── Turn ${next.turn} — +${pGain} energy (⌈${playerAlive}/2⌉) ───`)
  }

  next.playerQueue = []
  next.aiQueue = []
  const allLog = [...state.log, ...turnLog]
  next.log = allLog.length > LOG_MAX ? allLog.slice(-LOG_MAX) : allLog
  return next
}

// ─── Utility exports for UI ───────────────────────────────────────────────────

/** PVP variant: uses state.aiQueue (P2's submitted moves) instead of AI-building it. */
export function resolveTurnPvp(state: BattleState): BattleState {
  const next = structuredClone(state) as BattleState
  const turnLog: string[] = [`─── Turn ${next.turn} ───`]

  for (let slot = 0; slot < 3; slot++) {
    const pq = next.playerQueue.find(q => q.characterIndex === slot)
    if (pq) { executeQueuedSkill(next, pq, 'player', turnLog); markDead(next) }
  }

  const midResult = checkEnd(next)
  if (!midResult) {
    turnLog.push(`─ Opponent responds ─`)
    for (let slot = 0; slot < 3; slot++) {
      const aq = next.aiQueue.find(q => q.characterIndex === slot)
      if (aq) { executeQueuedSkill(next, aq, 'ai', turnLog); markDead(next) }
    }
  }

  for (const c of next.player.characters) if (!c.isDead) tickCharEffects(c, next.player, turnLog)
  for (const c of next.ai.characters)     if (!c.isDead) tickCharEffects(c, next.ai, turnLog)
  for (const c of [...next.player.characters, ...next.ai.characters]) tickCooldowns(c)

  markDead(next)
  const result = checkEnd(next)
  if (result) {
    next.phase = result
    turnLog.push(result === 'victory' ? '🏆 Victory! All enemies defeated.' : '💀 Defeat. Your team fell.')
  } else {
    next.turn++
    for (const team of [next.player, next.ai]) {
      for (const char of team.characters) {
        for (const skill of char.character.skills) {
          const e = skill.effects.find(ef => ef.stackDecayTurns && ef.stackIncrement)
          if (!e?.stackDecayTurns) continue
          const lastUsed = char.skillLastUsedTurn[skill.id]
          if (lastUsed !== undefined && (next.turn - lastUsed) > e.stackDecayTurns) {
            char.skillUseCounts[skill.id] = 0
            delete char.skillLastUsedTurn[skill.id]
          }
        }
      }
    }
    next.phase = 'player_turn'
    const alive = (t: BattleTeam) => t.characters.filter(c => !c.isDead).length
    grantEnergy(next.player, Math.max(1, Math.ceil(alive(next.player) / 2)))
    grantEnergy(next.ai,     Math.max(1, Math.ceil(alive(next.ai) / 2)))
    turnLog.push(`─── Turn ${next.turn} ───`)
  }

  next.playerQueue = []
  next.aiQueue = []
  const allLog = [...state.log, ...turnLog]
  next.log = allLog.length > LOG_MAX ? allLog.slice(-LOG_MAX) : allLog
  return next
}

// ─── Utility exports for UI ───────────────────────────────────────────────────

/** Sequential PvP: execute only one team's queue, then fully finalize the turn. */
export function resolveSinglePlayerTurn(
  state: BattleState,
  teamId: TeamId,
  queue: QueuedSkill[],
): BattleState {
  const next = structuredClone(state) as BattleState
  const label = teamId === 'player' ? 'P1 acts' : 'P2 acts'
  const turnLog: string[] = [`─── Turn ${next.turn} — ${label} ───`]

  for (let slot = 0; slot < 3; slot++) {
    const q = queue.find(q => q.characterIndex === slot)
    if (q) { executeQueuedSkill(next, q, teamId, turnLog); markDead(next) }
  }

  for (const c of next.player.characters) if (!c.isDead) tickCharEffects(c, next.player, turnLog, teamId === 'ai')
  for (const c of next.ai.characters)     if (!c.isDead) tickCharEffects(c, next.ai, turnLog, teamId === 'player')
  const actingTeam = teamId === 'player' ? next.player : next.ai
  for (const c of actingTeam.characters) tickCooldowns(c)

  markDead(next)
  const result = checkEnd(next)
  if (result) {
    next.phase = result
    turnLog.push(result === 'victory' ? '🏆 Victory! All enemies defeated.' : '💀 Defeat. Your team fell.')
  } else {
    next.turn++
    for (const team of [next.player, next.ai]) {
      for (const char of team.characters) {
        for (const skill of char.character.skills) {
          const e = skill.effects.find(ef => ef.stackDecayTurns && ef.stackIncrement)
          if (!e?.stackDecayTurns) continue
          const lastUsed = char.skillLastUsedTurn[skill.id]
          if (lastUsed !== undefined && (next.turn - lastUsed) > e.stackDecayTurns) {
            char.skillUseCounts[skill.id] = 0
            delete char.skillLastUsedTurn[skill.id]
          }
        }
      }
    }
    next.phase = 'player_turn'
    const alive = (t: BattleTeam) => t.characters.filter(c => !c.isDead).length
    grantEnergy(next.player, Math.max(1, Math.ceil(alive(next.player) / 2)))
    grantEnergy(next.ai,     Math.max(1, Math.ceil(alive(next.ai) / 2)))
    turnLog.push(`─── Turn ${next.turn} ───`)
  }

  next.playerQueue = []
  next.aiQueue = []
  const allLog = [...state.log, ...turnLog]
  next.log = allLog.length > LOG_MAX ? allLog.slice(-LOG_MAX) : allLog
  return next
}

export function getSkillCooldownLeft(char: BattleCharacter, skillId: string): number {
  return char.cooldowns[skillId] ?? 0
}

/** Returns current streak info for a stacking+decaying skill, or null if no active streak. */
export function getSkillStreakInfo(
  char: BattleCharacter,
  skillId: string,
  stackIncrement: number,
  stackDecayTurns: number,
  currentTurn: number,
): { bonus: number; turnsLeft: number } | null {
  const uses = char.skillUseCounts[skillId] ?? 0
  if (uses === 0) return null
  const lastUsed = char.skillLastUsedTurn[skillId]
  if (lastUsed === undefined) return null
  const turnsLeft = (lastUsed + stackDecayTurns) - currentTurn + 1
  if (turnsLeft <= 0) return null
  return { bonus: uses * stackIncrement, turnsLeft }
}

export function energyTotal(pool: EnergyPool): number {
  return pool.strength + pool.magic + pool.spirit + pool.agility
}
