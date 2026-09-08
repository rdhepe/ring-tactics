import type { Character } from '../../types'
import breakThroughImg from '../../assets/wrestlers/Double Down/BRUTUS — BREAK THROUGH.jpg'
import forceTagImg from '../../assets/wrestlers/Double Down/BRUTUS — FORCE TAG.jpg'
import doubleTeamImg from '../../assets/wrestlers/Double Down/DOUBLE TEAM.jpg'
import lastSecondTagImg from '../../assets/wrestlers/Double Down/Last Second Tag.jpg'
import exploitImg from '../../assets/wrestlers/Double Down/VEX — EXPLOIT.jpg'
import precisionTagImg from '../../assets/wrestlers/Double Down/VEX — PRECISION TAG.jpg'
import portraitImg from '../../assets/wrestlers/Double Down/portrait.jpg'

export const doubledown: Character = {
  id: 'doubledown',
  name: 'Double Down',
  title: 'The Perfect Pair',
  description: 'Two completely different fighters sharing one card. Brutus makes openings with raw power; Vex turns those openings into precise punishment.',
  avatarUrl: portraitImg,
  avatarColor: 'bg-red-800',
  rarity: 'legendary',
  classes: ['brawler', 'technician'],
  maxHp: 100,
  combatModeNames: { precision: 'Brutus', chaos: 'Vex' },
  skills: [
    {
      id: 'doubledown_s1',
      name: 'Break Through',
      description: 'Brutus deals 25 physical damage and creates an Opening on the target for 2 turns.',
      iconColor: 'bg-red-700',
      iconUrl: breakThroughImg,
      cost: { strength: 1 },
      cooldown: 0,
      targetType: 'enemy',
      mainClass: 'physical',
      persistence: 'instant',
      effects: [
        { type: 'damage', value: 25, duration: 1 },
        { type: 'skill_mark', value: 1, duration: 2 },
      ],
      modeVariants: {
        chaos: {
          name: 'Exploit',
          description: 'Vex deals 20 technical damage. An Opening turns it into 40 damage and is consumed.',
          iconUrl: exploitImg,
          cost: { agility: 1 },
          mainClass: 'technical',
          effects: [
            { type: 'damage', value: 20, duration: 1 },
            { type: 'marked_bonus_damage', value: 20, duration: 1, consumeMark: true },
          ],
        },
      },
    },
    {
      id: 'doubledown_s2',
      name: 'Force Tag',
      description: "Brutus deals 15 physical damage, reduces the target's destructible defense by 10 for 2 turns, then tags Vex.",
      iconColor: 'bg-orange-700',
      iconUrl: forceTagImg,
      cost: { strength: 1 },
      cooldown: 2,
      targetType: 'enemy',
      mainClass: 'physical',
      persistence: 'instant',
      effects: [
        { type: 'damage', value: 15, duration: 1 },
        { type: 'defense_break', value: 10, duration: 2 },
        { type: 'tag_switch', value: 1, duration: 1, target: 'self' },
      ],
      modeVariants: {
        chaos: {
          name: 'Precision Tag',
          description: 'Vex deals 15 technical damage. The target takes +15 damage from the next attack, then Brutus tags in.',
          iconUrl: precisionTagImg,
          cost: { agility: 1 },
          mainClass: 'technical',
          effects: [
            { type: 'damage', value: 15, duration: 1 },
            { type: 'next_damage_boost', value: 15, duration: 2, target: 'enemy' },
            { type: 'tag_switch', value: 1, duration: 1, target: 'self' },
          ],
        },
      },
    },
    {
      id: 'doubledown_s3',
      name: 'Double Team',
      description: 'Brutus hits for 25 physical, then Vex adds 15 technical. An Opening adds 10 damage. Tags Vex in.',
      iconColor: 'bg-yellow-700',
      iconUrl: doubleTeamImg,
      cost: { random: 2 },
      cooldown: 3,
      targetType: 'enemy',
      mainClass: 'physical',
      persistence: 'instant',
      effects: [
        { type: 'damage', value: 25, duration: 1 },
        { type: 'damage', value: 15, duration: 1 },
        { type: 'marked_bonus_damage', value: 10, duration: 1 },
        { type: 'tag_switch', value: 1, duration: 1, target: 'self' },
      ],
      modeVariants: {
        chaos: {
          name: 'Double Team',
          description: 'Vex hits for 20 technical, then Brutus adds 20 physical. An Opening adds 15 damage. Tags Brutus in.',
          iconUrl: doubleTeamImg,
          mainClass: 'technical',
          effects: [
            { type: 'damage', value: 20, duration: 1 },
            { type: 'damage', value: 20, duration: 1 },
            { type: 'marked_bonus_damage', value: 15, duration: 1 },
            { type: 'tag_switch', value: 1, duration: 1, target: 'self' },
          ],
        },
      },
    },
    {
      id: 'doubledown_s4',
      name: 'Last Second Tag',
      description: 'The active fighter escapes and tags their partner. Becomes invulnerable for 1 round.',
      iconColor: 'bg-sky-700',
      iconUrl: lastSecondTagImg,
      cost: { random: 1 },
      cooldown: 4,
      targetType: 'self',
      mainClass: 'strategic',
      persistence: 'instant',
      effects: [
        { type: 'invulnerable', value: 1, duration: 1, target: 'self' },
        { type: 'tag_switch', value: 1, duration: 1, target: 'self' },
      ],
    },
  ],
}
