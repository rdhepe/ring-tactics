import type { Character } from '../../types'
import breakpointImg from '../../assets/wrestlers/breakpoint/breakpoint.jpg'
import counterstepImg from '../../assets/wrestlers/breakpoint/Counterstep.jpg'
import dominoImg from '../../assets/wrestlers/breakpoint/Domino.jpg'
import keepItGoingImg from '../../assets/wrestlers/breakpoint/Keep It Going.jpg'
import openingShotImg from '../../assets/wrestlers/breakpoint/Opening Shot.jpg'

export const breakpoint: Character = {
  id: 'breakpoint',
  name: 'Breakpoint',
  title: 'The Opportunist',
  description: 'A ruthless tactician who turns every mistake into another opening. One successful attack can set the entire team in motion.',
  avatarUrl: breakpointImg,
  avatarColor: 'bg-amber-700',
  rarity: 'uncommon',
  classes: ['brawler', 'technician'],
  maxHp: 100,
  skills: [
    {
      id: 'breakpoint_s1',
      name: 'Opening Shot',
      description: 'Deals 25 physical damage. Deals 35 instead when the target was damaged earlier this round.',
      iconColor: 'bg-amber-600',
      iconUrl: openingShotImg,
      cost: { strength: 1 },
      cooldown: 0,
      targetType: 'enemy',
      mainClass: 'physical',
      persistence: 'instant',
      effects: [
        { type: 'conditional_damaged_this_round', value: 10, duration: 1 },
        { type: 'damage', value: 25, duration: 1 },
      ],
    },
    {
      id: 'breakpoint_s2',
      name: 'Domino',
      description: 'Deals 20 physical damage and marks the target for 2 rounds. Their next hit triggers 15 bonus damage.',
      iconColor: 'bg-orange-700',
      iconUrl: dominoImg,
      cost: { strength: 1 },
      cooldown: 2,
      targetType: 'enemy',
      mainClass: 'physical',
      persistence: 'instant',
      effects: [
        { type: 'damage', value: 20, duration: 1 },
        { type: 'domino_mark', value: 15, duration: 2 },
      ],
    },
    {
      id: 'breakpoint_s3',
      name: 'Keep It Going',
      description: 'An ally heals 20 HP the next time they successfully deal damage within 2 rounds.',
      iconColor: 'bg-teal-700',
      iconUrl: keepItGoingImg,
      cost: { spirit: 1 },
      cooldown: 3,
      targetType: 'ally',
      mainClass: 'strategic',
      persistence: 'action',
      effects: [{ type: 'heal_on_damage', value: 20, duration: 2 }],
    },
    {
      id: 'breakpoint_s4',
      name: 'Counterstep',
      description: 'Becomes invulnerable for 1 round. If attacked, the next damaging attack gains +10 damage.',
      iconColor: 'bg-yellow-700',
      iconUrl: counterstepImg,
      cost: { random: 1 },
      cooldown: 4,
      targetType: 'self',
      mainClass: 'strategic',
      persistence: 'instant',
      effects: [{ type: 'invulnerable', value: 1, duration: 1, target: 'self' }],
    },
  ],
}
