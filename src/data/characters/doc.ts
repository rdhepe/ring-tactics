import type { Character } from '../../types'
import portrait          from '../../assets/wrestlers/Doc Holiday/portrait.jpg'
import patchUpImg        from '../../assets/wrestlers/Doc Holiday/Patch Up.jpg'
import cornerShoutsImg   from '../../assets/wrestlers/Doc Holiday/Corner Shouts.jpg'
import protectiveTaping  from '../../assets/wrestlers/Doc Holiday/Protective Taping.jpg'
import towelFakeImg      from '../../assets/wrestlers/Doc Holiday/Towel Fake.jpg'

export const doc: Character = {
  id: 'doc',
  name: 'Doc Holiday',
  title: 'The Cornerman',
  description: 'Twenty-year veteran cornerman. He keeps his team fresh with tape jobs, water, and extremely illegal advice.',
  avatarUrl: portrait,
  avatarColor: 'bg-emerald-600',
  rarity: 'uncommon',
  classes: ['cornerman', 'brawler'],
  maxHp: 100,
  skills: [
    {
      id: 'doc_s1',
      name: 'Patch Up',
      description: 'Slaps on the cold sponge and tapes the cuts. Restores 25 HP to one ally.',
      iconColor: 'bg-emerald-500',
      iconUrl: patchUpImg,
      cost: { spirit: 1 },
      cooldown: 0,
      targetType: 'ally',
      mainClass: 'strategic',
      persistence: 'instant',
      effects: [{ type: 'heal', value: 25, duration: 1 }],
    },
    {
      id: 'doc_s2',
      name: 'Corner Shouts',
      description: 'Screams instructions from the corner. Restores 15 HP to the entire team.',
      iconColor: 'bg-yellow-500',
      iconUrl: cornerShoutsImg,
      cost: { spirit: 2 },
      cooldown: 0,
      targetType: 'all_allies',
      mainClass: 'strategic',
      persistence: 'instant',
      effects: [{ type: 'heal', value: 15, duration: 1, target: 'all_allies' }],
    },
    {
      id: 'doc_s3',
      name: 'Protective Taping',
      description: 'Wraps an ally head-to-toe with protective tape. Reduces incoming damage to them by 20 for 2 rounds.',
      iconColor: 'bg-teal-600',
      iconUrl: protectiveTaping,
      cost: { spirit: 1, random: 1 },
      cooldown: 0,
      targetType: 'ally',
      mainClass: 'strategic',
      persistence: 'instant',
      effects: [{ type: 'damage_reduction', value: 20, duration: 2 }],
    },
    {
      id: 'doc_s4',
      name: 'Towel Fake',
      description: 'Pretends to throw in the towel as a distraction. Becomes invulnerable for 1 round. Costs any energy type. 4-turn cooldown.',
      iconColor: 'bg-lime-500',
      iconUrl: towelFakeImg,
      cost: { random: 1 },
      cooldown: 4,
      targetType: 'self',
      mainClass: 'strategic',
      persistence: 'instant',
      effects: [{ type: 'invulnerable', value: 1, duration: 1, target: 'self' }],
    },
  ],
}
