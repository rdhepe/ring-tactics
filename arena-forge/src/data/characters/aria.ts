import type { Character } from '../../types'

/** Aria — long-range mage, high burst damage, fragile */
export const aria: Character = {
  id: 'aria',
  name: 'Aria',
  title: 'Arcane Weaver',
  description:
    'Aria commands volatile arcane forces, unleashing magic that cannot be stopped by mere barriers. Her power comes at a cost — she has no physical durability.',
  avatarColor: 'bg-violet-600',
  rarity: 'uncommon',
  classes: ['mage'],
  maxHp: 100,
  skills: [
    {
      id: 'aria_s1',
      name: 'Arcane Bolt',
      description:
        'Fires a bolt of raw arcane energy at one enemy, dealing 25 magic damage.',
      iconColor: 'bg-violet-500',
      cost: { magic: 1 },
      cooldown: 0,
      targetType: 'enemy',
      mainClass: 'magic',
      persistence: 'instant',
      effects: [
        { type: 'damage', value: 25, duration: 1 },
      ],
    },
    {
      id: 'aria_s2',
      name: 'Void Rupture',
      description:
        'Tears a rift in magical space. Deals 40 affliction damage to one enemy — this damage ignores all defenses and damage reduction.',
      iconColor: 'bg-purple-700',
      cost: { magic: 2 },
      cooldown: 2,
      targetType: 'enemy',
      mainClass: 'magic',
      persistence: 'instant',
      isAffliction: true,
      effects: [
        { type: 'affliction', value: 40, duration: 1 },
      ],
    },
    {
      id: 'aria_s3',
      name: 'Arcane Surge',
      description:
        'Channels arcane power for 3 turns, boosting all of Aria\'s magic damage by 15. Gains 1 magic energy each turn this is active.',
      iconColor: 'bg-fuchsia-500',
      cost: { magic: 1 },
      cooldown: 4,
      targetType: 'self',
      mainClass: 'strategic',
      persistence: 'action',
      effects: [
        { type: 'damage_boost', value: 15, duration: 3, target: 'self', damageBoostTypes: ['magic'] },
        { type: 'energy_gain', value: 1, duration: 3, target: 'self' },
      ],
    },
    {
      id: 'aria_s4',
      name: 'Blink',
      description:
        'Teleports away from harm. Aria becomes invulnerable for 1 turn.',
      iconColor: 'bg-indigo-400',
      cost: { magic: 1 },
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
