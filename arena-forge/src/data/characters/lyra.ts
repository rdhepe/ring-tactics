import type { Character } from '../../types'

/** Lyra — healer/support, keeps team alive and buffs allies */
export const lyra: Character = {
  id: 'lyra',
  name: 'Lyra',
  title: 'Dawn Mender',
  description:
    'Lyra channels the light of the dawn to restore her allies. She lacks offensive power but is nearly impossible to kill with proper timing.',
  avatarColor: 'bg-emerald-500',
  rarity: 'uncommon',
  classes: ['healer', 'support'],
  maxHp: 100,
  skills: [
    {
      id: 'lyra_s1',
      name: 'Mending Light',
      description:
        'Channels healing energy into one ally, restoring 25 health.',
      iconColor: 'bg-emerald-400',
      cost: { spirit: 1 },
      cooldown: 0,
      targetType: 'ally',
      mainClass: 'strategic',
      persistence: 'instant',
      effects: [
        { type: 'heal', value: 25, duration: 1 },
      ],
    },
    {
      id: 'lyra_s2',
      name: 'Radiant Pulse',
      description:
        'Emits a pulse of healing light that restores 15 health to all allies.',
      iconColor: 'bg-yellow-400',
      cost: { spirit: 2 },
      cooldown: 1,
      targetType: 'all_allies',
      mainClass: 'strategic',
      persistence: 'instant',
      effects: [
        { type: 'heal', value: 15, duration: 1, target: 'all_allies' },
      ],
    },
    {
      id: 'lyra_s3',
      name: 'Guardian Veil',
      description:
        'Wraps one ally in a protective veil, reducing all damage they receive by 20 for 2 turns.',
      iconColor: 'bg-teal-500',
      cost: { spirit: 1, magic: 1 },
      cooldown: 3,
      targetType: 'ally',
      mainClass: 'strategic',
      persistence: 'instant',
      effects: [
        { type: 'damage_reduction', value: 20, duration: 2 },
      ],
    },
    {
      id: 'lyra_s4',
      name: 'Sanctuary',
      description:
        'Calls upon divine protection. Lyra becomes invulnerable for 1 turn.',
      iconColor: 'bg-lime-400',
      cost: { spirit: 1 },
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
