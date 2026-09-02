import type { Character } from '../../types'

/** Zara — debuffer/controller, drains energy and locks down enemies */
export const zara: Character = {
  id: 'zara',
  name: 'Zara',
  title: 'Void Sovereign',
  description:
    'Zara manipulates the void itself to steal and sap the enemy\'s resources. She wins by making opponents helpless, not by raw damage.',
  avatarColor: 'bg-sky-800',
  rarity: 'rare',
  classes: ['mage', 'support'],
  maxHp: 100,
  skills: [
    {
      id: 'zara_s1',
      name: 'Void Lash',
      description:
        'Whips void energy at one enemy for 20 magic damage.',
      iconColor: 'bg-sky-500',
      cost: { magic: 1 },
      cooldown: 0,
      targetType: 'enemy',
      mainClass: 'magic',
      persistence: 'instant',
      effects: [
        { type: 'damage', value: 20, duration: 1 },
      ],
    },
    {
      id: 'zara_s2',
      name: 'Energy Siphon',
      description:
        'Drains 2 random energy from one enemy and adds it to your pool.',
      iconColor: 'bg-cyan-600',
      cost: { magic: 1 },
      cooldown: 2,
      targetType: 'enemy',
      mainClass: 'strategic',
      persistence: 'instant',
      effects: [
        { type: 'energy_drain', value: 2, duration: 1 },
        { type: 'energy_gain', value: 2, duration: 1, target: 'self' },
      ],
    },
    {
      id: 'zara_s3',
      name: 'Null Field',
      description:
        'Surrounds one enemy in a field of nullifying energy, stunning them for 2 turns.',
      iconColor: 'bg-blue-700',
      cost: { magic: 2 },
      cooldown: 4,
      targetType: 'enemy',
      mainClass: 'magic',
      persistence: 'control',
      effects: [
        { type: 'stun', value: 1, duration: 2 },
      ],
    },
    {
      id: 'zara_s4',
      name: 'Phase Shift',
      description:
        'Shifts partially out of reality. Becomes invulnerable for 1 turn.',
      iconColor: 'bg-indigo-600',
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
