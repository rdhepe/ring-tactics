import type { Character } from '../../types'

/** Drake — dragon knight, very high damage, slow and costly */
export const drake: Character = {
  id: 'drake',
  name: 'Drake',
  title: 'Dragon Knight',
  description:
    'Drake channels ancient draconic power. His skills are devastating but expensive — poor resource management will leave him helpless.',
  avatarColor: 'bg-rose-800',
  rarity: 'rare',
  classes: ['warrior', 'mage'],
  maxHp: 100,
  skills: [
    {
      id: 'drake_s1',
      name: 'Dragon Slash',
      description:
        'Swings his dragon-forged blade in a wide arc for 30 physical damage to one enemy.',
      iconColor: 'bg-rose-600',
      cost: { strength: 1, agility: 1 },
      cooldown: 0,
      targetType: 'enemy',
      mainClass: 'physical',
      persistence: 'instant',
      effects: [
        { type: 'damage', value: 30, duration: 1 },
      ],
    },
    {
      id: 'drake_s2',
      name: 'Flame Breath',
      description:
        'Exhales a cone of draconic fire, dealing 30 magic damage to all enemies.',
      iconColor: 'bg-amber-600',
      cost: { magic: 2, strength: 1 },
      cooldown: 2,
      targetType: 'all_enemies',
      mainClass: 'magic',
      persistence: 'instant',
      effects: [
        { type: 'damage', value: 30, duration: 1, target: 'all_enemies' },
      ],
    },
    {
      id: 'drake_s3',
      name: 'Drake Awakening',
      description:
        'Awakens the dragon within. For 3 turns, Drake deals 20 extra damage on all attacks and becomes resistant to physical skills (−10 physical damage reduction).',
      iconColor: 'bg-red-900',
      cost: { strength: 2, magic: 1 },
      cooldown: 4,
      targetType: 'self',
      mainClass: 'strategic',
      persistence: 'action',
      effects: [
        { type: 'damage_boost', value: 20, duration: 3, target: 'self', damageBoostTypes: ['all'] },
        { type: 'damage_reduction', value: 10, duration: 3, target: 'self' },
      ],
    },
    {
      id: 'drake_s4',
      name: 'Draconic Fortitude',
      description:
        'Scales grow impenetrable. Gains 40 destructible defense this turn.',
      iconColor: 'bg-orange-900',
      cost: { strength: 1 },
      cooldown: 3,
      targetType: 'self',
      mainClass: 'strategic',
      persistence: 'instant',
      effects: [
        { type: 'destructible_defense', value: 40, duration: 1, target: 'self' },
      ],
    },
  ],
}
