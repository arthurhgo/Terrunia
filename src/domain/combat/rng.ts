import type { CombatDie } from './types'

/** Park–Miller 31-bit generator. The battle UUID is created by Web Crypto and
 * hashed into a nonzero seed; the current seed is persisted with every battle.
 * Replaying an identical saved battle produces the same rolls.
 *
 * Rejection sampling avoids modulo bias when mapping a generator state to die
 * faces. This is reproducible gameplay RNG, NOT a cryptographic game of chance.
 */
const MODULUS = 2147483647
const STATES = MODULUS - 1
const MULTIPLIER = 48271

export const nextCombatRandomSeed = (seed: number) => {
  if (!Number.isSafeInteger(seed) || seed <= 0 || seed >= MODULUS)
    throw new Error('Invalid persisted combat RNG seed')
  return (seed * MULTIPLIER) % MODULUS
}

export const rollSeededCombatDie = (seed: number, sides: CombatDie): { face: number; nextSeed: number } => {
  const accepted = Math.floor(STATES / sides) * sides
  let nextSeed = seed
  // At most 10 states out of 2.1 billion are rejected for supported dice.
  do {
    nextSeed = nextCombatRandomSeed(nextSeed)
  } while (nextSeed - 1 >= accepted)
  return { face: (nextSeed - 1) % sides + 1, nextSeed }
}
