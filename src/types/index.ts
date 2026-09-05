// ─── Energy ─────────────────────────────────────────────────────────────────
export type EnergyType = 'strength' | 'magic' | 'spirit' | 'agility' | 'random'
export type CombatMode = 'precision' | 'chaos'

export interface EnergyCost {
  strength?: number
  magic?: number
  spirit?: number
  agility?: number
  random?: number
}

// ─── Effects ─────────────────────────────────────────────────────────────────

export type EffectType =
  | 'damage'
  | 'heal'
  | 'stun'
  | 'invulnerable'
  | 'damage_reduction'
  | 'destructible_defense'
  | 'pierce_damage'    // ignores damage reduction
  | 'affliction'       // ignores damage reduction AND destructible defense
  | 'energy_gain'
  | 'energy_drain'
  | 'damage_boost'     // increases own damage output for N turns
  | 'damage_mark'      // per-target combo marker; value = accumulated bonus for next hit
  | 'conditional_damage'
  | 'counter_guard'
  | 'damage_penalty'
  | 'target_lock'
  | 'attacked_target'
  | 'setup_mode'
  | 'consume_setup'
  | 'skill_mark'
  | 'consume_mark_stun'
  | 'precision_mode'
  | 'chaos_mode'
  | 'marked_bonus_damage'
  | 'consume_mark'
  | 'self_damage'
  | 'conditional_damaged_this_round'
  | 'damaged_this_round'
  | 'domino_mark'
  | 'heal_on_damage'
  | 'conditional_heal_below_half'
  | 'death_prevention'
  | 'next_damage_boost'
  | 'play_dead_mark'
  | 'conditional_used_skill_this_round'
  | 'skill_cancel'
  | 'interference'

export type TargetType = 'enemy' | 'ally' | 'self' | 'all_enemies' | 'all_allies' | 'any'

export interface SkillEffect {
  type: EffectType
  /** base value (damage, heal amount, reduction %, etc.) */
  value: number
  /** how many turns it persists; 1 = instant/this turn only */
  duration: number
  /** which target the effect lands on; if omitted uses the skill's targetType */
  target?: TargetType
  /** for damage_boost: which damage types are boosted */
  damageBoostTypes?: Array<'physical' | 'magic' | 'all'>
  /** scaling: effect value increases by this per prior use (e.g. stacking skills) */
  stackIncrement?: number
  /** reset stackIncrement counter if skill is not used again within N turns */
  stackDecayTurns?: number
  /** for energy_gain: fixed type to grant; omit for a random type */
  energyType?: EnergyType
  /** cap on the accumulated value for stacking effects like damage_mark */
  maxValue?: number
  /** for counter_guard: damage reflected to the attacker after mitigation */
  counterDamage?: number
  /** for marked_bonus_damage: remove the mark after applying the bonus */
  consumeMark?: boolean
  /** bonus added when conditional_heal_below_half targets an ally below 50% HP */
  lowHealthBonus?: number
  /** Hidden from the opposing PvP client until it resolves or expires. */
  hidden?: boolean
}

export interface SkillVariant {
  name: string
  description: string
  iconUrl?: string
  cost?: EnergyCost
  cooldown?: number
  targetType?: TargetType
  mainClass?: SkillMainClass
  persistence?: SkillPersistence
  isAffliction?: boolean
  effects: SkillEffect[]
}

// ─── Skill classes ───────────────────────────────────────────────────────────

/** Main class determines what can be blocked/countered */
export type SkillMainClass = 'physical' | 'technical' | 'magic' | 'strategic'

/** Persistence type */
export type SkillPersistence = 'instant' | 'action' | 'control'

// ─── Skill ───────────────────────────────────────────────────────────────────

export interface Skill {
  id: string
  name: string
  description: string
  iconColor: string          // Tailwind bg color class for placeholder icon
  iconUrl?: string            // optional skill image; overrides iconColor when set
  cost: EnergyCost
  cooldown: number
  targetType: TargetType
  mainClass: SkillMainClass
  persistence: SkillPersistence
  isAffliction?: boolean     // if true, damage bypasses reduction AND destructible defense
  effects: SkillEffect[]
  modeToggle?: boolean
  modeVariants?: Partial<Record<CombatMode, SkillVariant>>
  setupVariant?: SkillVariant
}

// ─── Character ───────────────────────────────────────────────────────────────

export type CharacterRarity = 'common' | 'uncommon' | 'rare' | 'legendary'

export type CharacterClass =
  | 'warrior'
  | 'mage'
  | 'rogue'
  | 'healer'
  | 'tank'
  | 'support'
  | 'assassin'
  | 'ranger'
  | 'brawler'
  | 'high-flyer'
  | 'submission'
  | 'cornerman'
  | 'monster'
  | 'technician'

export interface Character {
  id: string
  name: string
  title?: string
  description: string
  /** path relative to /public, or a placeholder color */
  avatarUrl?: string
  avatarColor: string        // Tailwind bg color used when no image
  rarity: CharacterRarity
  classes: CharacterClass[]
  maxHp: number              // default 100
  skills: [Skill, Skill, Skill, Skill]  // exactly 4 skills
  /** optional unlock requirement text */
  unlockHint?: string
}

// ─── Battle runtime types (used from Iteration 2 onwards) ────────────────────

export interface EnergyPool {
  strength: number
  magic: number
  spirit: number
  agility: number
}

export type StatusKey = `${EffectType}_${string}` // e.g. "stun_kael_skill1"

export interface ActiveEffect {
  key: StatusKey
  sourceSkillId: string
  sourceCharacterId: string
  sourceTeamId?: TeamId
  effect: SkillEffect
  turnsLeft: number
  stacks: number
}

export interface BattleCharacter {
  character: Character
  hp: number
  maxHp: number
  cooldowns: Record<string, number>  // skillId -> turns remaining
  activeEffects: ActiveEffect[]
  isDead: boolean
  /** per-use stack counter for stacking skills */
  skillUseCounts: Record<string, number>
  /** turn number when each skill last successfully landed */
  skillLastUsedTurn: Record<string, number>
  /** offensive skill stored by The Echo; it returns to normal after this expires or is used */
  copiedAttack?: { skill: Skill; expiresAtTurn: number }
  /** turn in which Perfect Copy has already captured an attempted attack */
  perfectCopyTriggeredTurn?: number
}

export type TeamId = 'player' | 'ai'

export interface BattleTeam {
  id: TeamId
  characters: BattleCharacter[]
  energy: EnergyPool
}

export type BattlePhase =
  | 'team_select'
  | 'player_turn'
  | 'ai_turn'
  | 'resolving'
  | 'victory'
  | 'defeat'

export interface QueuedSkill {
  characterIndex: number
  skillId: string
  targetTeam: TeamId
  targetIndex: number
  /** player-chosen allocation for ? (random) cost slots; absent = engine greedy-fills */
  randomAllocation?: Partial<EnergyPool>
}

export interface BattleState {
  phase: BattlePhase
  turn: number
  player: BattleTeam
  ai: BattleTeam
  playerQueue: QueuedSkill[]
  aiQueue: QueuedSkill[]
  log: string[]
  /** most recently executed skill that dealt damage */
  lastOffensiveSkill?: { skill: Skill; teamId: TeamId }
}
