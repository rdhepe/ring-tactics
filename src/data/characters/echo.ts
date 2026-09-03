import type { Character } from '../../types'
import echoStrikeImg from '../../assets/wrestlers/The Echo/Echo Strike.jpg'
import mirrorMoveImg from '../../assets/wrestlers/The Echo/Mirror Move.jpg'
import perfectCopyImg from '../../assets/wrestlers/The Echo/Perfect Copy.jpg'
import portraitImg from '../../assets/wrestlers/The Echo/portrait.jpg'
import readTheRoomImg from '../../assets/wrestlers/The Echo/Read the Room.jpg'

export const echo: Character = {
  id: 'echo',
  name: 'The Echo',
  title: 'The Mimic',
  description: 'A freakishly observant technician who studies every move in the ring. The more you show him, the more dangerous he becomes.',
  avatarUrl: portraitImg,
  avatarColor: 'bg-emerald-700',
  rarity: 'rare',
  classes: ['technician', 'high-flyer'],
  maxHp: 100,
  skills: [
    {
      id: 'echo_s1', name: 'Mirror Move',
      description: 'Copies the last offensive attack used and stores it for 2 rounds.',
      iconColor: 'bg-emerald-600', iconUrl: mirrorMoveImg, cost: { magic: 1 }, cooldown: 2,
      targetType: 'self', mainClass: 'strategic', persistence: 'instant', effects: [],
    },
    {
      id: 'echo_s2', name: 'Echo Strike',
      description: 'Deals 20 physical damage. When an attack is copied, repeats it at 80% damage.',
      iconColor: 'bg-teal-600', iconUrl: echoStrikeImg, cost: { agility: 1 }, cooldown: 0,
      targetType: 'enemy', mainClass: 'physical', persistence: 'instant',
      effects: [{ type: 'damage', value: 20, duration: 1 }],
    },
    {
      id: 'echo_s3', name: 'Read the Room',
      description: 'For 1 round, reduces the first incoming attack by 20 and counters its attacker for 25 damage.',
      iconColor: 'bg-cyan-700', iconUrl: readTheRoomImg, cost: { agility: 1 }, cooldown: 3,
      targetType: 'self', mainClass: 'strategic', persistence: 'action',
      effects: [{ type: 'counter_guard', value: 20, duration: 1, target: 'self', counterDamage: 25 }],
    },
    {
      id: 'echo_s4', name: 'Perfect Copy',
      description: 'Becomes invulnerable for 1 round. The first offensive attack attempted against The Echo is copied and stored.',
      iconColor: 'bg-sky-700', iconUrl: perfectCopyImg, cost: { random: 1 }, cooldown: 4,
      targetType: 'self', mainClass: 'strategic', persistence: 'instant',
      effects: [{ type: 'invulnerable', value: 1, duration: 1, target: 'self' }],
    },
  ],
}
