import type { Character } from '../../types'
import bladeTrapChaosImg from '../../assets/wrestlers/Switchblade/Blade Trap - Chaos.jpg'
import bladeTrapPrecisionImg from '../../assets/wrestlers/Switchblade/Blade Trap - Precision.jpg'
import finalSwitchChaosImg from '../../assets/wrestlers/Switchblade/Final Switch - Chaos.jpg'
import finalSwitchPrecisionImg from '../../assets/wrestlers/Switchblade/Final Switch - Precision.jpg'
import portraitImg from '../../assets/wrestlers/Switchblade/portrait.jpg'
import quickCutChaosImg from '../../assets/wrestlers/Switchblade/Quick Cut -Chaos.jpg'
import quickCutPrecisionImg from '../../assets/wrestlers/Switchblade/Quick Cut - Precision.jpg'
import switchbladeImg from '../../assets/wrestlers/Switchblade/Switchblade.jpg'

export const switchblade: Character = {
  id: 'switchblade',
  name: 'Switchblade',
  title: 'The Split Persona',
  description: 'A master of deception who never stays in one style for long. Switchblade can flip between Precision and Chaos at any moment, completely changing how he attacks and responds.',
  avatarUrl: portraitImg,
  avatarColor: 'bg-cyan-700',
  rarity: 'common',
  classes: ['technician', 'high-flyer'],
  maxHp: 100,
  skills: [
    {
      id: 'switchblade_s1',
      name: 'Switchblade',
      description: 'Switches between Precision Mode and Chaos Mode. Switching modes does not consume an action, but can only be done once per round.',
      iconColor: 'bg-cyan-600',
      iconUrl: switchbladeImg,
      cost: {},
      cooldown: 0,
      targetType: 'self',
      mainClass: 'strategic',
      persistence: 'instant',
      modeToggle: true,
      effects: [],
    },
    {
      id: 'switchblade_s2',
      name: 'Quick Cut',
      description: 'Precision Mode: deals 25 technical damage to one enemy.',
      iconColor: 'bg-sky-600',
      iconUrl: quickCutPrecisionImg,
      cost: { agility: 1 },
      cooldown: 0,
      targetType: 'enemy',
      mainClass: 'technical',
      persistence: 'instant',
      effects: [
        { type: 'damage', value: 25, duration: 1 },
        { type: 'marked_bonus_damage', value: 10, duration: 1, consumeMark: true },
      ],
      modeVariants: {
        chaos: {
          name: 'Quick Cut',
          description: 'Chaos Mode: deals 20 physical damage to one enemy and gains 10 destructible defense.',
          iconUrl: quickCutChaosImg,
          mainClass: 'physical',
          effects: [
            { type: 'damage', value: 20, duration: 1 },
            { type: 'destructible_defense', value: 10, duration: 1, target: 'self' },
          ],
        },
      },
    },
    {
      id: 'switchblade_s3',
      name: 'Blade Trap',
      description: 'Precision Mode: deals 15 technical damage and marks the target for 2 rounds. Your next attack against the marked target deals +10 damage.',
      iconColor: 'bg-teal-700',
      iconUrl: bladeTrapPrecisionImg,
      cost: { agility: 2 },
      cooldown: 2,
      targetType: 'enemy',
      mainClass: 'technical',
      persistence: 'instant',
      effects: [
        { type: 'damage', value: 15, duration: 1 },
        { type: 'skill_mark', value: 1, duration: 2 },
      ],
      modeVariants: {
        chaos: {
          name: 'Blade Trap',
          description: 'Chaos Mode: deals 30 physical damage, but removes the mark if one exists.',
          iconUrl: bladeTrapChaosImg,
          mainClass: 'physical',
          effects: [
            { type: 'damage', value: 30, duration: 1 },
            { type: 'consume_mark', value: 1, duration: 1 },
          ],
        },
      },
    },
    {
      id: 'switchblade_s4',
      name: 'Final Switch',
      description: "Precision Mode: exploits the opponent's weakness. Deals 35 technical damage. If the target is marked, deals +15 damage and consumes the mark.",
      iconColor: 'bg-lime-600',
      iconUrl: finalSwitchPrecisionImg,
      cost: { agility: 2 },
      cooldown: 3,
      targetType: 'enemy',
      mainClass: 'technical',
      persistence: 'instant',
      effects: [
        { type: 'damage', value: 35, duration: 1 },
        { type: 'marked_bonus_damage', value: 15, duration: 1, consumeMark: true },
      ],
      modeVariants: {
        chaos: {
          name: 'Final Switch',
          description: 'Chaos Mode: launches a reckless finishing assault. Deals 45 physical damage, but Switchblade takes 10 damage.',
          iconUrl: finalSwitchChaosImg,
          mainClass: 'physical',
          effects: [
            { type: 'damage', value: 45, duration: 1 },
            { type: 'self_damage', value: 10, duration: 1, target: 'self' },
          ],
        },
      },
    },
  ],
}