import type { Character } from '../../types'
import { beast }   from './beast'
import { crusher } from './crusher'
import { doc }     from './doc'
import { ironmaiden } from './ironmaiden'
import { phantom } from './phantom'
import { snake }   from './snake'
import { switchblade } from './switchblade'
import { themind } from './themind'
import { echo } from './echo'
import { breakpoint } from './breakpoint'
import { velvetvow } from './velvetvow'
import { blackout } from './blackout'

/** Add a new wrestler here — nothing else needs to change. */
export const ALL_CHARACTERS: Character[] = [
  crusher,
  blackout,
  breakpoint,
  doc,
  ironmaiden,
  phantom,
  snake,
  switchblade,
  beast,
  echo,
  themind,
  velvetvow,
]

export const CHARACTER_MAP: Record<string, Character> = Object.fromEntries(
  ALL_CHARACTERS.map(c => [c.id, c])
)
