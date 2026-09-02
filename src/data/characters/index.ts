import type { Character } from '../../types'
import { beast }   from './beast'
import { crusher } from './crusher'
import { doc }     from './doc'
import { phantom } from './phantom'
import { snake }   from './snake'
import { themind } from './themind'

/** Add a new wrestler here — nothing else needs to change. */
export const ALL_CHARACTERS: Character[] = [crusher, phantom, doc, snake, beast, themind]

export const CHARACTER_MAP: Record<string, Character> = Object.fromEntries(
  ALL_CHARACTERS.map(c => [c.id, c])
)
