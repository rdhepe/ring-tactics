import type { Character } from '../../types'
import portrait          from '../../assets/wrestlers/phantom-x/portrait.jpg'
import springboardImg    from '../../assets/wrestlers/phantom-x/Springboard Kick.jpg'
import shootingStarImg   from '../../assets/wrestlers/phantom-x/Shooting Star Press.jpg'
import momentumImg       from '../../assets/wrestlers/phantom-x/Momentum.jpg'
import rollAwayImg       from '../../assets/wrestlers/phantom-x/Roll Away.jpg'

export const phantom: Character = {
  id: 'phantom',
  name: 'Phantom X',
  title: 'The High-Flyer',
  description: 'Lightning-quick aerial specialist. The higher he climbs, the harder he falls — on your face.',
  avatarUrl: portrait,
  avatarColor: 'bg-purple-600',
  rarity: 'uncommon',
  classes: ['high-flyer'],
  maxHp: 100,
  skills: [
    {
      id: 'phantom_s1',
      name: 'Springboard Kick',
      description: 'Bounces off the ropes and launches a flying kick for 25 technical damage.',
      iconColor: 'bg-purple-500',
      iconUrl: springboardImg,
      cost: { magic: 1 },
      cooldown: 0,
      targetType: 'enemy',
      mainClass: 'physical',
      persistence: 'instant',
      effects: [{ type: 'damage', value: 25, duration: 1 }],
    },
    {
      id: 'phantom_s2',
      name: 'Shooting Star Press',
      description: 'Soars from the top rope in a full rotation and crashes down. Deals 40 affliction damage — armour means nothing at this height.',
      iconColor: 'bg-violet-700',
      iconUrl: shootingStarImg,
      cost: { magic: 1, random: 1 },
      cooldown: 2,
      targetType: 'enemy',
      mainClass: 'physical',
      persistence: 'instant',
      isAffliction: true,
      effects: [{ type: 'affliction', value: 40, duration: 1 }],
    },
    {
      id: 'phantom_s3',
      name: 'Momentum',
      description: 'Builds unstoppable ring momentum for 3 rounds. All attacks deal 15 more damage and he gains 1 speed energy each round.',
      iconColor: 'bg-fuchsia-600',
      iconUrl: momentumImg,
      cost: { magic: 1 },
      cooldown: 4,
      targetType: 'self',
      mainClass: 'strategic',
      persistence: 'action',
      effects: [
        { type: 'damage_boost', value: 15, duration: 3, target: 'self', damageBoostTypes: ['all'] },
        { type: 'energy_gain',  value: 1,  duration: 3, target: 'self' },
      ],
    },
    {
      id: 'phantom_s4',
      name: 'Roll Away',
      description: 'Dives under the bottom rope and out of reach. Invulnerable for 1 round. Costs any energy type.',
      iconColor: 'bg-indigo-500',
      iconUrl: rollAwayImg,
      cost: { random: 1 },
      cooldown: 4,
      targetType: 'self',
      mainClass: 'strategic',
      persistence: 'instant',
      effects: [{ type: 'invulnerable', value: 1, duration: 1, target: 'self' }],
    },
  ],
}
