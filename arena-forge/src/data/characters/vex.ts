import type { Character } from '../../types'

/** Vex — rogue/assassin, burst + stun, low cooldowns */
export const vex: Character = {
  id: 'vex',
  name: 'Vex',
  title: 'Shadow Blade',
  description:
    'Vex strikes from the darkness without warning. Specialises in disabling targets and dealing heavy burst damage before vanishing.',
  avatarColor: 'bg-zinc-700',
  rarity: 'common',
  classes: ['rogue', 'assassin'],
  maxHp: 100,
  skills: [
    {
      id: 'vex_s1',
      name: 'Shadow Strike',
      description:
        'Appears behind an enemy and stabs them for 30 physical damage.',
      iconColor: 'bg-zinc-500',
      cost: { agility: 1 },
      cooldown: 0,
      targetType: 'enemy',
      mainClass: 'physical',
      persistence: 'instant',
      effects: [
        { type: 'damage', value: 30, duration: 1 },
      ],
    },
    {
      id: 'vex_s2',
      name: 'Crippling Poison',
      description:
        'Coats a blade in toxin. Deals 15 affliction damage per turn for 3 turns to one enemy. This is an affliction — cannot be reduced.',
      iconColor: 'bg-green-700',
      cost: { agility: 1, magic: 1 },
      cooldown: 2,
      targetType: 'enemy',
      mainClass: 'physical',
      persistence: 'action',
      isAffliction: true,
      effects: [
        { type: 'affliction', value: 15, duration: 3 },
      ],
    },
    {
      id: 'vex_s3',
      name: 'Garrote',
      description:
        'Grabs the enemy by the throat. Stuns one enemy for 1 turn — they cannot use any skills.',
      iconColor: 'bg-stone-500',
      cost: { agility: 2 },
      cooldown: 3,
      targetType: 'enemy',
      mainClass: 'physical',
      persistence: 'instant',
      effects: [
        { type: 'stun', value: 1, duration: 1 },
      ],
    },
    {
      id: 'vex_s4',
      name: 'Smoke Bomb',
      description:
        'Detonates a smoke bomb and vanishes. Becomes invulnerable for 1 turn.',
      iconColor: 'bg-neutral-400',
      cost: { agility: 1 },
      cooldown: 4,
      targetType: 'self',
      mainClass: 'strategic',
      persistence: 'instant',
      effects: [
        { type: 'invulnerable', value: 1, duration: 1, target: 'self' },
      ],
    },
  ],
}
