import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { createNewSave } from '../game/createSave'
import type { GameSave } from '../game/types'
import { gameSaveSchema } from '../../persistence/saveSchema'
import { equipComplementaryItem } from './complementaryEquipment'

const now = '2026-11-08T01:00:00Z'
const helmet = { instanceId: 'test-helmet', definitionId: 'equipment_simple_helmet', quantity: 1,
  rarity: 'common' as const, locked: false, favorite: false, acquiredAt: now }
const fresh = () => createNewSave('owner','Aron','character.terririan.default',content,now)

describe('equipamentos complementares comuns', () => {
  it('transfere peça da mochila e devolve sem alterar os cinco Vínculos', () => {
    const save = fresh(); save.inventory.push(helmet)
    const bound = structuredClone(save.character.bondedEquipment)
    const worn = equipComplementaryItem(save, 'helmet', helmet.instanceId, content, now)
    expect(worn.ok).toBe(true)
    if (!worn.ok) return
    expect(worn.value.inventory).toHaveLength(0)
    expect(worn.value.equippedComplementary?.helmet).toEqual(helmet)
    expect(worn.value.character.bondedEquipment).toEqual(bound)
    expect(gameSaveSchema.safeParse(worn.value).success).toBe(true)
    const removed = equipComplementaryItem(worn.value, 'helmet', null, content, now)
    expect(removed.ok).toBe(true)
    if (removed.ok) {
      expect(removed.value.inventory).toContainEqual(helmet)
      expect(removed.value.equippedComplementary?.helmet).toBeUndefined()
    }
  })
  it('recusa item incompatível, bloqueado e troca em combate', () => {
    const save = fresh(); save.inventory.push(helmet)
    expect(equipComplementaryItem(save,'boots',helmet.instanceId,content,now).ok).toBe(false)
    save.inventory[0].locked = true
    expect(equipComplementaryItem(save,'helmet',helmet.instanceId,content,now).ok).toBe(false)
    save.inventory[0].locked = false
    save.battle = {} as GameSave['battle']
    expect(equipComplementaryItem(save,'helmet',helmet.instanceId,content,now).ok).toBe(false)
  })
  it('aceita save legado sem campo complementar', () => {
    const save = fresh(); delete save.equippedComplementary
    expect(gameSaveSchema.safeParse(save).success).toBe(true)
  })
})
