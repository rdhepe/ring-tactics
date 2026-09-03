import type { Character } from '../../types'
import portrait        from '../../assets/wrestlers/The Mind/portrait.jpg'
import mindGamesImg    from '../../assets/wrestlers/The Mind/Mind Games.jpg'
import stealMomentImg  from '../../assets/wrestlers/The Mind/Steal the Moment.jpg'
import tauntImg        from '../../assets/wrestlers/The Mind/Taunt.jpg'
import smokeImg        from "../../assets/wrestlers/The Mind/Smoke & Mirrors.jpg"

export const themind: Character = {
  id: 'themind',
  name: 'The Mind',
  title: 'The Psychologist',
  description: 'Never breaks a sweat. Wins by making opponents break themselves — draining their energy and confidence in equal measure.',
  avatarUrl: portrait,
  avatarColor: 'bg-sky-800',
  rarity: 'rare',
  classes: ['technician', 'cornerman'],
  maxHp: 100,
  skills: [
    {
      id: 'mind_s1',
      name: 'Mind Games',
      description: "Messes with the opponent's head so badly they practically hurt themselves. 20 technical damage.",
      iconColor: 'bg-sky-500',
      iconUrl: mindGamesImg,
      cost: { magic: 1 },
      cooldown: 0,
      targetType: 'enemy',
      mainClass: 'magic',
      persistence: 'instant',
      effects: [{ type: 'damage', value: 20, duration: 1 }],
    },
    {
      id: 'mind_s2',
      name: 'Steal the Moment',
      description: "Hijacks the crowd's energy. Steals 2 random energy from the opponent and gains those same energy types.",
      iconColor: 'bg-cyan-600',
      iconUrl: stealMomentImg,
      cost: { magic: 2 },
      cooldown: 3,
      targetType: 'enemy',
      mainClass: 'strategic',
      persistence: 'instant',
      effects: [
        { type: 'energy_drain', value: 2, duration: 1 },
      ],
    },
    {
      id: 'mind_s3',
      name: 'Taunt',
      description: "Gets so deep inside the opponent's head they can't function. Stuns one target for 1 round, cancelling their next action.",
      iconColor: 'bg-blue-700',
      iconUrl: tauntImg,
      cost: { magic: 2 },
      cooldown: 4,
      targetType: 'enemy',
      mainClass: 'magic',
      persistence: 'control',
      effects: [{ type: 'stun', value: 1, duration: 1 }],
    },
    {
      id: 'mind_s4',
      name: 'Smoke & Mirrors',
      description: 'Confuses everyone so thoroughly nobody can target him. Invulnerable for 1 round. Costs any energy type.',
      iconColor: 'bg-indigo-600',
      iconUrl: smokeImg,
      cost: { random: 1 },
      cooldown: 4,
      targetType: 'self',
      mainClass: 'strategic',
      persistence: 'instant',
      effects: [{ type: 'invulnerable', value: 1, duration: 1, target: 'self' }],
    },
  ],
}
