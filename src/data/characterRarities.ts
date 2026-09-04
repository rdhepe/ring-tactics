import type { CharacterRarity } from '../types'

/**
 * Character id -> rarity, kept separate from the character definitions so the
 * server can validate unlock costs without importing character art assets
 * (which Node/tsx can't load directly). Must stay in sync with src/data/characters/*.ts.
 */
export const CHARACTER_RARITY: Record<string, CharacterRarity> = {
  crusher:     'common',
  blackout:    'common',
  breakpoint:  'uncommon',
  doc:         'uncommon',
  ironmaiden:  'common',
  phantom:     'uncommon',
  snake:       'common',
  switchblade: 'common',
  beast:       'rare',
  echo:        'rare',
  themind:     'rare',
  velvetvow:   'uncommon',
  aria:        'uncommon',
  drake:       'rare',
  kael:        'common',
  lyra:        'uncommon',
  vex:         'common',
  zara:        'rare',
}
