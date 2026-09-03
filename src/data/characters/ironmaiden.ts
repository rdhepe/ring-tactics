import type { Character } from '../../types'
import portrait        from '../../assets/wrestlers/Iron Maiden/portrait.jpg'
import counterPunchImg from '../../assets/wrestlers/Iron Maiden/Counter Punch.jpg'
import reversalImg     from '../../assets/wrestlers/Iron Maiden/Reversal.jpg'
import lockdownImg     from '../../assets/wrestlers/Iron Maiden/Lockdown.jpg'
import lastStandImg    from '../../assets/wrestlers/Iron Maiden/Last Stand.jpg'

export const ironmaiden: Character = {
  id: 'ironmaiden',
  name: 'Iron Maiden',
  title: 'The Counterstrike',
  description: "Patient and calculating. She doesn't need to win the exchange - she just needs you to make the first mistake.",
  avatarUrl: portrait,
  avatarColor: 'bg-slate-600',
  rarity: 'common',
  classes: ['technician', 'tank'],
  maxHp: 100,
  skills: [
    {
      id: 'ironmaiden_s1',
      name: 'Counter Punch',
      description: 'Waits for the opponent to commit, then strikes back with precision. Deals 25 physical damage to an enemy. If that enemy attacked Iron Maiden this round, deals +10 damage.',
      iconColor: 'bg-slate-500',
      iconUrl: counterPunchImg,
      cost: { strength: 2, random: 1 },
      cooldown: 0,
      targetType: 'enemy',
      mainClass: 'physical',
      persistence: 'instant',
      effects: [
        { type: 'damage', value: 25, duration: 1 },
        { type: 'conditional_damage', value: 10, duration: 1 },
      ],
    },
    {
      id: 'ironmaiden_s2',
      name: 'Reversal',
      description: 'Turns an incoming attack against its owner. Reduces the next instance of damage she takes by 20, then deals 20 physical damage back to the attacker.',
      iconColor: 'bg-zinc-600',
      iconUrl: reversalImg,
      cost: { strength: 2 },
      cooldown: 2,
      targetType: 'self',
      mainClass: 'strategic',
      persistence: 'instant',
      effects: [{ type: 'counter_guard', value: 20, duration: 1, target: 'self', counterDamage: 20 }],
    },
    {
      id: 'ironmaiden_s3',
      name: 'Lockdown',
      description: "Traps the opponent in a technical hold. Target's next attack deals 15 less damage and they cannot change their queued target.",
      iconColor: 'bg-stone-700',
      iconUrl: lockdownImg,
      cost: { strength: 1, random: 1 },
      cooldown: 3,
      targetType: 'enemy',
      mainClass: 'physical',
      persistence: 'action',
      effects: [
        { type: 'damage_penalty', value: 15, duration: 1 },
        { type: 'target_lock', value: 1, duration: 1 },
      ],
    },
    {
      id: 'ironmaiden_s4',
      name: 'Last Stand',
      description: 'Plants her feet and refuses to go down. Gains 30 destructible defense and +10 damage for the next round.',
      iconColor: 'bg-red-700',
      iconUrl: lastStandImg,
      cost: { random: 1 },
      cooldown: 4,
      targetType: 'self',
      mainClass: 'strategic',
      persistence: 'instant',
      effects: [
        { type: 'destructible_defense', value: 30, duration: 1, target: 'self' },
        { type: 'damage_boost', value: 10, duration: 2, target: 'self', damageBoostTypes: ['all'] },
      ],
    },
  ],
}