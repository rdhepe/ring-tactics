import type { Character } from '../../types'
import playDeadImg from '../../assets/wrestlers/Velvet Vow/Play Dead.jpg'
import portraitImg from '../../assets/wrestlers/Velvet Vow/portrait.jpg'
import rallyCryImg from '../../assets/wrestlers/Velvet Vow/Rally Cry.jpg'
import secondChanceImg from '../../assets/wrestlers/Velvet Vow/Second Chance.jpg'
import tagInImg from '../../assets/wrestlers/Velvet Vow/Tag In.jpg'

export const velvetvow: Character = {
  id: 'velvetvow',
  name: 'Velvet Vow',
  title: 'The Ring General',
  description: "A composed master of ring psychology who keeps her team fighting long after the opponent thinks they've won. Every rescue creates another opportunity.",
  avatarUrl: portraitImg,
  avatarColor: 'bg-rose-700',
  rarity: 'uncommon',
  classes: ['cornerman', 'submission'],
  maxHp: 100,
  skills: [
    {
      id: 'velvetvow_s1',
      name: 'Rally Cry',
      description: 'Restores 20 HP to one ally, or 30 HP when they are below 50 HP.',
      iconColor: 'bg-rose-600',
      iconUrl: rallyCryImg,
      cost: { spirit: 1 },
      cooldown: 1,
      targetType: 'ally',
      mainClass: 'strategic',
      persistence: 'instant',
      effects: [{ type: 'conditional_heal_below_half', value: 20, duration: 1, target: 'ally', lowHealthBonus: 10 }],
    },
    {
      id: 'velvetvow_s2',
      name: 'Tag In',
      description: 'An ally gains +15 damage on their next damaging attack.',
      iconColor: 'bg-pink-700',
      iconUrl: tagInImg,
      cost: { spirit: 1 },
      cooldown: 2,
      targetType: 'ally',
      mainClass: 'strategic',
      persistence: 'action',
      effects: [{ type: 'next_damage_boost', value: 15, duration: 2, target: 'ally' }],
    },
    {
      id: 'velvetvow_s3',
      name: 'Second Chance',
      description: 'For 2 rounds, an ally survives the first lethal hit at 20 HP instead.',
      iconColor: 'bg-fuchsia-700',
      iconUrl: secondChanceImg,
      cost: { spirit: 2 },
      cooldown: 4,
      targetType: 'ally',
      mainClass: 'strategic',
      persistence: 'action',
      effects: [{ type: 'death_prevention', value: 20, duration: 2, target: 'ally' }],
    },
    {
      id: 'velvetvow_s4',
      name: 'Play Dead',
      description: 'Becomes invulnerable for 1 round. Enemies who attack her are marked and take +10 damage on their next hit.',
      iconColor: 'bg-violet-700',
      iconUrl: playDeadImg,
      cost: { random: 1 },
      cooldown: 4,
      targetType: 'self',
      mainClass: 'strategic',
      persistence: 'instant',
      effects: [{ type: 'invulnerable', value: 1, duration: 1, target: 'self' }],
    },
  ],
}
