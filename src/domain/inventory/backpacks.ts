import type { GameSave } from '../game/types'

/** BALANCE_DRAFT: slot limits and Gold costs are configurable; never alter bound equipment. */
export const BACKPACK_UPGRADES = [
  { id: 'backpack_sturdy', npcId: 'presence_edran', name: 'Mochila Reforçada', capacity: 18, price: 95, previousId: null },
  { id: 'backpack_traveler', npcId: 'presence_edran', name: 'Mochila do Viajante', capacity: 24, price: 210, previousId: 'backpack_sturdy' },
  { id: 'backpack_arcane', npcId: 'presence_edran', name: 'Mochila Arcana', capacity: 36, price: 420, previousId: 'backpack_traveler' },
] as const

export const BASE_BACKPACK_CAPACITY = 12
export const backpackFlag = (upgradeId: string) => `backpack_unlocked:${upgradeId}`

/** Capacity is measured in occupied inventory stacks, not total item quantity. */
export function getBackpackCapacity(save: Pick<GameSave, 'world'>): number {
  return BACKPACK_UPGRADES.reduce((capacity, offer) =>
    save.world.worldFlags.includes(backpackFlag(offer.id)) ? Math.max(capacity, offer.capacity) : capacity,
  BASE_BACKPACK_CAPACITY)
}

/** Existing saves retain all legacy items. Only newly acquired stacks overflow
 * to the Base chest, never disappear or get turned into equipment.
 */
export function routeNewItemOverflow(previous: GameSave | null, next: GameSave): GameSave {
  const capacity = getBackpackCapacity(next)
  if (next.inventory.length <= capacity) return next
  const existing = new Set(previous?.inventory.map((item) => item.instanceId) ?? [])
  const kept = [...next.inventory.filter((item) => existing.has(item.instanceId))]
  const additions = next.inventory.filter((item) => !existing.has(item.instanceId))
  const free = Math.max(0, capacity - kept.length)
  const overflow = additions.slice(free)
  if (!overflow.length) return next
  const copy = structuredClone(next)
  copy.inventory = [...kept, ...additions.slice(0, free)]
  copy.baseStorage.push(...overflow)
  copy.eventLog.push(`BackpackOverflowToBase:${overflow.length}`)
  return copy
}
