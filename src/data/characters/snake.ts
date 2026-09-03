import type { Character } from '../../types'
import portrait        from '../../assets/wrestlers/snake eyes/portrait.jpg'
import kneeStrikeImg   from '../../assets/wrestlers/snake eyes/Knee Strike.jpg'
import vipersGripImg   from "../../assets/wrestlers/snake eyes/Viper's Grip.jpg"
import chokeHoldImg    from '../../assets/wrestlers/snake eyes/Choke Hold.jpg'
import quickScramble   from '../../assets/wrestlers/snake eyes/Quick Scramble.jpg'

export const snake: Character = {
  id: 'snake',
  name: 'Snake Eyes',
  title: 'The Viper',
  description: 'Cold and methodical submission specialist. Once he sinks in a hold you have two options: tap or sleep.',
  avatarUrl: portrait,
  avatarColor: 'bg-zinc-700',
  rarity: 'common',
  classes: ['submission', 'technician'],
  maxHp: 100,
  skills: [
    {
      id: 'snake_s1',
      name: 'Knee Strike',
      description: 'A swift knee straight to the midsection drops the opponent for 30 physical damage.',
      iconColor: 'bg-zinc-500',
      iconUrl: kneeStrikeImg,
      cost: { agility: 1 },
      cooldown: 0,
      targetType: 'enemy',
      mainClass: 'physical',
      persistence: 'instant',
      effects: [{ type: 'damage', value: 30, duration: 1 }],
    },
    {
      id: 'snake_s2',
      name: "Viper's Grip",
      description: 'Digs thumbs into pressure points. The opponent takes 15 affliction damage each round for 3 rounds. Cannot be reduced. Does not stack on the same target.',
      iconColor: 'bg-green-800',
      iconUrl: vipersGripImg,
      cost: { agility: 2 },
      cooldown: 2,
      targetType: 'enemy',
      mainClass: 'physical',
      persistence: 'action',
      isAffliction: true,
      effects: [{ type: 'affliction', value: 15, duration: 3 }],
    },
    {
      id: 'snake_s3',
      name: 'Choke Hold',
      description: 'Clamps on a rear naked choke. Target cannot act for 1 round, cancelling their queued move.',
      iconColor: 'bg-stone-600',
      iconUrl: chokeHoldImg,
      cost: { agility: 2 },
      cooldown: 3,
      targetType: 'enemy',
      mainClass: 'physical',
      persistence: 'instant',
      effects: [{ type: 'stun', value: 1, duration: 1 }],
    },
    {
      id: 'snake_s4',
      name: 'Quick Scramble',
      description: 'Wriggles free from any position and resets. Invulnerable for 1 round. Costs any energy type. 4-turn cooldown.',
      iconColor: 'bg-neutral-500',
      iconUrl: quickScramble,
      cost: { random: 1 },
      cooldown: 4,
      targetType: 'self',
      mainClass: 'strategic',
      persistence: 'instant',
      effects: [{ type: 'invulnerable', value: 1, duration: 1, target: 'self' }],
    },
  ],
}
