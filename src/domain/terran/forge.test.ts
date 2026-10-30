import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { bindPrologueWeapon, createNewSave } from '../game/createSave'
import { deriveCharacterStats } from '../character/derivedStats'
import { getSkillNodeState, unlockSkillNode } from '../skillTree/skillTree'
import { migrateAndValidateSave } from '../../persistence/saveSchema'
import { executeForgeRecipe, FORGE_LOCATION_ID } from './forge'
import { buyMarketItem, MARKET_LOCATION_ID } from './market'

const ready = () => {
  const bound = bindPrologueWeapon(createNewSave('forge-owner', 'Aron', 'character.terririan.default', content), content, undefined, 'permanent-weapon')
  if (!bound.ok) throw new Error(bound.message)
  const save = bound.value
  save.world.currentLocationId = FORGE_LOCATION_ID
  save.wallet.gold = 1000
  for (const [index, [id, quantity]] of ([['drop_ruin_shard', 4], ['drop_blackroot_core', 2], ['drop_mycelial_fiber', 4], ['drop_fungal_gel', 2]] as const).entries()) {
    save.inventory.push({ instanceId: `raw-${index}`, definitionId: id, quantity, rarity: content.items[id].rarity, locked: false, favorite: false, acquiredAt: save.updatedAt })
  }
  return save
}

describe('Casa do Ferreiro e materiais vinculados', () => {
  it('produz componentes, aprimora a mesma arma e revela caminhos sem gerar Pontos de Essência', () => {
    let save = ready()
    const initialStats = deriveCharacterStats(save, content)
    const node = content.skillTreeNodes.weapon_forged_edge
    expect(getSkillNodeState(save, node, content)).toBe('hidden')
    for (const id of ['forge_alloy', 'forge_weapon_core', 'forge_temper', 'forge_resin', 'forge_finish']) {
      const result = executeForgeRecipe(save, id, content, save.updatedAt)
      if (!result.ok) throw new Error(result.message)
      save = result.value
    }
    const weapon = save.boundItems['permanent-weapon']
    expect(save.character.bondedEquipment.weapon).toBe('permanent-weapon')
    expect(weapon.grade).toBe(1)
    expect(weapon.forging?.upgradeIds).toEqual(['forge_tempered_weapon', 'forge_mycelial_finish'])
    expect(weapon.memories).toHaveLength(3)
    expect(save.essence.essencePoints).toBe(0)
    expect(deriveCharacterStats(save, content).primaryAttack.value).toBe(initialStats.primaryAttack.value + 2)
    expect(deriveCharacterStats(save, content).life.value).toBe(initialStats.life.value + 4)
    expect(save.vitals.hp).toBe(initialStats.life.value)
    expect(getSkillNodeState(save, node, content)).toBe('discovered')
    save.essence.essencePoints = 2
    const core = unlockSkillNode(save, content.skillTreeNodes.weapon_bond_core, content, save.updatedAt)
    if (!core.ok) throw new Error(core.message)
    const edge = unlockSkillNode(core.value, node, content, save.updatedAt)
    expect(edge.ok).toBe(true)
    if (!edge.ok) return
    expect(edge.value.essence.essencePoints).toBe(0)
    expect(deriveCharacterStats(edge.value, content).primaryAttack.value).toBe(initialStats.primaryAttack.value + 4)
    const reloaded = migrateAndValidateSave(edge.value)
    expect(reloaded.boundItems['permanent-weapon'].forging).toEqual(weapon.forging)
  })

  it('recusa nova aplicação, materiais insuficientes e forja fora do local sem gastar nada', () => {
    let save = ready()
    save.world.currentLocationId = 'terran'
    const before = structuredClone(save)
    expect(executeForgeRecipe(save, 'forge_alloy', content, save.updatedAt).ok).toBe(false)
    expect(save).toEqual(before)
    save.world.currentLocationId = FORGE_LOCATION_ID
    for (const id of ['forge_alloy', 'forge_weapon_core', 'forge_temper']) {
      const result = executeForgeRecipe(save, id, content, save.updatedAt)
      if (!result.ok) throw new Error(result.message)
      save = result.value
    }
    const crafted = structuredClone(save)
    expect(executeForgeRecipe(save, 'forge_temper', content, save.updatedAt)).toMatchObject({ ok: false, code: 'FORGE_ALREADY_APPLIED' })
    expect(save).toEqual(crafted)
    save.inventory = []
    expect(executeForgeRecipe(save, 'forge_resin', content, save.updatedAt)).toMatchObject({ ok: false, code: 'FORGE_MATERIALS' })
  })

  it('aplica a têmpera ao ataque mágico de uma arma mágica, sem reforçar o ataque desarmado', () => {
    let save = ready()
    const magical = Object.values(content.boundItemBases).find((item) => item.slot === 'weapon' && item.powerType === 'magical')!
    save.boundItems['permanent-weapon'].baseItemId = magical.id
    const before = deriveCharacterStats(save, content)
    for (const id of ['forge_alloy', 'forge_weapon_core', 'forge_temper']) {
      const result = executeForgeRecipe(save, id, content, save.updatedAt)
      if (!result.ok) throw new Error(result.message)
      save = result.value
    }
    const after = deriveCharacterStats(save, content)
    expect(after.primaryAttack.value).toBe(before.primaryAttack.value + 1)
    expect(after.magicalAttack.value).toBe(before.magicalAttack.value + 1)
    expect(after.physicalAttack.value).toBe(before.physicalAttack.value)
  })

  it('preserva materiais favoritos e protege o inventário em falhas', () => {
    const save = ready()
    save.inventory.find((item) => item.definitionId === 'drop_blackroot_core')!.favorite = true
    const before = structuredClone(save)
    expect(executeForgeRecipe(save, 'forge_alloy', content, save.updatedAt)).toMatchObject({ ok: false, code: 'FORGE_MATERIALS' })
    expect(save).toEqual(before)
  })

  it('Neris vende materiais no Mercado, com custo real e sem permitir compras fora dele', () => {
    const save = ready()
    save.world.currentLocationId = MARKET_LOCATION_ID
    const purchase = buyMarketItem(save, 'presence_neris', 'drop_ruin_shard', 2, content, save.updatedAt)
    expect(purchase.ok).toBe(true)
    if (!purchase.ok) return
    expect(purchase.value.wallet.gold).toBe(944)
    expect(purchase.value.inventory.at(-1)?.quantity).toBe(2)
    expect(buyMarketItem({ ...save, world: { ...save.world, currentLocationId: FORGE_LOCATION_ID } }, 'presence_neris', 'drop_ruin_shard', 1, content, save.updatedAt).ok).toBe(false)
  })
})
