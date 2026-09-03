import type { Character } from '../../types'
import cheapShotImg from '../../assets/wrestlers/Blackout/Cheap Shot.jpg'
import cutTheLightsImg from '../../assets/wrestlers/Blackout/Cut the Lights.jpg'
import fadeOutImg from '../../assets/wrestlers/Blackout/Fade Out.jpg'
import interferenceImg from '../../assets/wrestlers/Blackout/Interference.jpg'
import portraitImg from '../../assets/wrestlers/Blackout/portrait.jpg'

export const blackout: Character = {
  id: 'blackout',
  name: 'Blackout',
  title: 'The Disruptor',
  description: "A dirty fighter who thrives on breaking the opponent's rhythm. He doesn't need to overpower you - he just needs to make your next move useless.",
  avatarUrl: portraitImg,
  avatarColor: 'bg-slate-700',
  rarity: 'common',
  classes: ['brawler', 'technician'],
  maxHp: 100,
  skills: [
    {
      id: 'blackout_s1',
      name: 'Cheap Shot',
      description: 'Deals 25 physical damage, plus 10 if the target has already used a skill this round.',
      iconColor: 'bg-slate-600',
      iconUrl: cheapShotImg,
      cost: { strength: 1 },
      cooldown: 0,
      targetType: 'enemy',
      mainClass: 'physical',
      persistence: 'instant',
      effects: [
        { type: 'conditional_used_skill_this_round', value: 10, duration: 1 },
        { type: 'damage', value: 25, duration: 1 },
      ],
    },
    {
      id: 'blackout_s2',
      name: 'Cut the Lights',
      description: "Cancels the target's next queued skill without spending its energy.",
      iconColor: 'bg-indigo-700',
      iconUrl: cutTheLightsImg,
      cost: { magic: 2 },
      cooldown: 3,
      targetType: 'enemy',
      mainClass: 'strategic',
      persistence: 'action',
      effects: [{ type: 'skill_cancel', value: 1, duration: 1 }],
    },
    {
      id: 'blackout_s3',
      name: 'Interference',
      description: 'For 2 rounds, the target takes 15 physical damage the next time they damage an ally.',
      iconColor: 'bg-blue-700',
      iconUrl: interferenceImg,
      cost: { magic: 1 },
      cooldown: 3,
      targetType: 'enemy',
      mainClass: 'strategic',
      persistence: 'action',
      effects: [{ type: 'interference', value: 15, duration: 2 }],
    },
    {
      id: 'blackout_s4',
      name: 'Fade Out',
      description: 'Becomes invulnerable for 1 round. Enemies that attack him deal 10 less damage on their next damaging attack.',
      iconColor: 'bg-zinc-700',
      iconUrl: fadeOutImg,
      cost: { random: 1 },
      cooldown: 4,
      targetType: 'self',
      mainClass: 'strategic',
      persistence: 'instant',
      effects: [{ type: 'invulnerable', value: 1, duration: 1, target: 'self' }],
    },
  ],
}
