import type { Character } from '../../types'

/** Kael — melee warrior with stacking damage and a defensive stance */
export const kael: Character = {
  id: 'kael',
  name: 'Kael',
  title: 'Iron Vanguard',
  description:
    'A battle-hardened warrior who grows stronger with every exchange. His iron discipline lets him shrug off blows that would fell lesser fighters.',
  avatarColor: 'bg-red-700',
  rarity: 'common',
  classes: ['warrior', 'tank'],
  maxHp: 100,
  skills: [
    {
      id: 'kael_s1',
      name: 'Iron Strike',
      description:
        'Charges at one enemy with his sword, dealing physical damage. Deals 5 more damage each time this skill is used.',
      iconColor: 'bg-red-500',
      cost: { strength: 1 },
      cooldown: 0,
      targetType: 'enemy',
      mainClass: 'physical',
      persistence: 'instant',
      effects: [
        { type: 'damage', value: 20, duration: 1, stackIncrement: 5 },
      ],
    },
    {
      id: 'kael_s2',
      name: 'Crushing Blow',
      description:
        'Delivers a devastating overhead strike that pierces through all defenses, dealing 35 physical damage.',
      iconColor: 'bg-orange-600',
      cost: { strength: 2 },
      cooldown: 1,
      targetType: 'enemy',
      mainClass: 'physical',
      persistence: 'instant',
      effects: [
        { type: 'pierce_damage', value: 35, duration: 1 },
      ],
    },
    {
      id: 'kael_s3',
      name: 'Battle Hardened',
      description:
        'Hardens his armor and stance. For 2 turns, reduces all incoming damage by 15 and gains 20 destructible defense.',
      iconColor: 'bg-gray-500',
      cost: { strength: 1, spirit: 1 },
      cooldown: 3,
      targetType: 'self',
      mainClass: 'strategic',
      persistence: 'instant',
      effects: [
        { type: 'damage_reduction', value: 15, duration: 2, target: 'self' },
        { type: 'destructible_defense', value: 20, duration: 2, target: 'self' },
      ],
    },
    {
      id: 'kael_s4',
      name: 'Shield Stance',
      description:
        'Becomes invulnerable to enemy skills for 1 turn. Cooldown: 4.',
      iconColor: 'bg-slate-500',
      cost: { strength: 1 },
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
