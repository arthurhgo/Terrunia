import { gearOfferById } from '../../content/equipmentV0515'
import { checkGearWear } from './equipmentV0515'
import type { ContentCatalog } from '../../content/catalog'
import type { GameSave } from '../game/types'
import type { ComplementarySlot } from '../shared/types'
import { fail, ok, type Result } from '../shared/types'

/** Atomic movement only: complementary wearables do not change character power,
 * the five permanent Bonds, currencies, resonance, skills, or rewards.
 */
export function equipComplementaryItem(save: GameSave, slot: ComplementarySlot,
  instanceId: string | null, catalog: ContentCatalog, now: string): Result<GameSave> {
  if (save.battle) return fail('WEAR_IN_BATTLE', 'Troque equipamentos fora do combate.')
  const existing = save.equippedComplementary?.[slot]
  if ((!existing && instanceId === null) || (existing && existing.instanceId === instanceId)) return ok(save)
  const incoming = instanceId ? save.inventory.find((entry) => entry.instanceId === instanceId) : undefined
  if (instanceId && (!incoming || incoming.quantity !== 1 || incoming.locked ||
    catalog.items[incoming.definitionId]?.complementarySlot !== slot)) {
    return fail('WEAR_INVALID', 'Escolha uma peça compatível e desbloqueada da mochila.')
  }
  const gear = incoming ? gearOfferById[incoming.definitionId] : undefined
  if (gear) { const eligible = checkGearWear(save,gear); if (!eligible.ok) return eligible }
  const next = structuredClone(save)
  const equipped = next.equippedComplementary ?? {}
  if (instanceId) {
    const index = next.inventory.findIndex((entry) => entry.instanceId === instanceId)
    const piece = next.inventory.splice(index, 1)[0]
    if (equipped[slot]) next.inventory.push(equipped[slot]!)
    equipped[slot] = piece
  } else {
    if (equipped[slot]) next.inventory.push(equipped[slot]!)
    delete equipped[slot]
  }
  next.equippedComplementary = equipped
  next.updatedAt = now
  next.revision += 1
  next.eventLog.push(`ComplementaryEquipment:${slot}:${instanceId ?? 'none'}`)
  return ok(next)
}
