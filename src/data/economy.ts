import type { CharacterRarity } from '../types'

/** Cost to unlock a wrestler, keyed by rarity. Paid with EITHER coins OR diamonds (whichever the player picks). */
export const UNLOCK_COST: Record<CharacterRarity, { coins: number | null; diamonds: number }> = {
  common:    { coins: 300,  diamonds: 60  },
  uncommon:  { coins: 800,  diamonds: 140 },
  rare:      { coins: 1800, diamonds: 280 },
  // Legendary wrestlers can't be ground out with coins — diamonds (real money) only.
  legendary: { coins: null, diamonds: 500 },
}

/** Rarities unlocked for free from the start of the game. */
export const FREE_RARITIES: CharacterRarity[] = ['common']

/** Coins awarded for winning a ladder match (credited server-side only). */
export const COINS_PER_LADDER_WIN = 50

/** Real-money diamond packages. Larger packs give a better diamonds-per-rupee rate. */
export interface DiamondPackage {
  id: string
  name: string
  diamonds: number
  bonus: number
  priceInr: number
}

// Reference USD list price -> INR conversion used to derive priceInr (~current USD/INR rate, rounded).
const USD_TO_INR_RATE = 87

export const DIAMOND_PACKAGES: DiamondPackage[] = [
  { id: 'pack_100',   name: 'Starter', diamonds: 100,   bonus: 0,    priceInr: Math.round(0.99  * USD_TO_INR_RATE) },
  { id: 'pack_550',   name: 'Small',   diamonds: 500,   bonus: 50,   priceInr: Math.round(4.99  * USD_TO_INR_RATE) },
  { id: 'pack_1200',  name: 'Medium',  diamonds: 1000,  bonus: 200,  priceInr: Math.round(9.99  * USD_TO_INR_RATE) },
  { id: 'pack_2500',  name: 'Large',   diamonds: 2000,  bonus: 500,  priceInr: Math.round(19.99 * USD_TO_INR_RATE) },
  { id: 'pack_6500',  name: 'Mega',    diamonds: 5000,  bonus: 1500, priceInr: Math.round(49.99 * USD_TO_INR_RATE) },
  { id: 'pack_14000', name: 'Whale',   diamonds: 10000, bonus: 4000, priceInr: Math.round(99.99 * USD_TO_INR_RATE) },
]
