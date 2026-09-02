import type { Character } from '../../types'
import portrait        from '../../assets/wrestlers/The Beast/portrait.jpg'
import lariatImg       from '../../assets/wrestlers/The Beast/Lariat.jpg'
import splashImg       from "../../assets/wrestlers/The Beast/World's End Splash.jpg"
import primalRageImg   from '../../assets/wrestlers/The Beast/Primal Rage.jpg'
import thickHideImg    from '../../assets/wrestlers/The Beast/Thick Hide.jpg'

export const beast: Character = {
  id: 'beast',
  name: 'The Beast',
  title: 'The Monster Heel',
  description: 'Unstoppable force of nature. Runs through opponents like paper, and gets angrier the longer the match goes.',
  avatarUrl: portrait,
  avatarColor: 'bg-rose-800',
  rarity: 'rare',
  classes: ['monster', 'brawler'],
  maxHp: 100,
  skills: [
    {
      id: 'beast_s1',
      name: 'Lariat',
      description: 'Charges across the ring and clotheslines the opponent for 30 physical damage. Any energy fuels the charge.',
      iconColor: 'bg-rose-600',
      iconUrl: lariatImg,
      cost: { strength: 1, random: 1 },
      targetType: 'enemy',
      mainClass: 'physical',
      persistence: 'instant',
      effects: [{ type: 'damage', value: 30, duration: 1 }],
    },
    {
      id: 'beast_s2',
      name: "World's End Splash",
      description: 'Climbs to the top rope and belly-flops onto the entire opposing team. Deals 30 damage to all enemies.',
      iconColor: 'bg-amber-700',
      iconUrl: splashImg,
      cost: { strength: 2, random: 1 },
      targetType: 'all_enemies',
      mainClass: 'physical',
      persistence: 'instant',
      effects: [{ type: 'damage', value: 30, duration: 1, target: 'all_enemies' }],
    },
    {
      id: 'beast_s3',
      name: 'Primal Rage',
      description: 'Enters a berserker frenzy for 3 rounds. Deals 20 more damage on all moves and shrugs off 10 incoming damage.',
      iconColor: 'bg-red-900',
      iconUrl: primalRageImg,
      cost: { strength: 2, magic: 1 },
      targetType: 'self',
      mainClass: 'strategic',
      persistence: 'action',
      effects: [
        { type: 'damage_boost',     value: 20, duration: 3, target: 'self', damageBoostTypes: ['all'] },
        { type: 'damage_reduction', value: 10, duration: 3, target: 'self' },
      ],
    },
    {
      id: 'beast_s4',
      name: 'Thick Hide',
      description: 'Barely feels the hits. Gains 40 destructible defence this round. Costs any energy type.',
      iconColor: 'bg-orange-900',
      iconUrl: thickHideImg,
      cost: { random: 1 },
      targetType: 'self',
      mainClass: 'strategic',
      persistence: 'instant',
      effects: [{ type: 'destructible_defense', value: 40, duration: 1, target: 'self' }],
    },
  ],
}
