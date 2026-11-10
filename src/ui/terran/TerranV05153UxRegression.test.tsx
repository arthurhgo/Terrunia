import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { content } from '../../content/catalog'
import { equipmentOffersV0515 } from '../../content/equipmentV0515'
import { deriveCharacterStats } from '../../domain/character/derivedStats'
import { createNewSave } from '../../domain/game/createSave'
import { useGameStore } from '../../state/gameStore'
import { BattleEquipmentHud } from '../battle/BattleEquipmentHud'
import { InventoryPanel } from '../dashboard/InventoryPanel'
import { TerranSpecialistShopV05153 } from './TerranSpecialistShopV05153'

afterEach(() => { cleanup(); useGameStore.getState().resetSession() })

function makeSave() {
  const save = createNewSave('user', 'Visual Tester', 'character.terririan.default',
    content, '2026-11-10T20:00:00.000Z')
  save.world.currentLocationId = 'location_terran_bond_workshop'
  save.wallet.gold = 500
  return save
}

describe('v0.5.15.3 · Seven improvements - UI regressions', () => {
  it('switches market into a sprite grid and pins a read-only comparison with actual balance', () => {
    const save = makeSave()
    const armor = equipmentOffersV0515.find(offer =>
      offer.channel === 'PUBLIC_TERRAN' && offer.tier === 1 && offer.slot === 'armor')!
    const snapshot = structuredClone(save)
    render(<TerranSpecialistShopV05153 save={save} merchantId="presence_terran_armorer" />)
    const grid = screen.getByRole('button', { name: 'Grade de sprites' })
    expect(grid).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(grid)
    expect(grid).toHaveAttribute('aria-pressed', 'true')
    expect(document.querySelector('.terran-specialist__offers--grid')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Inspecionar ' + armor.name }))
    const comparison = screen.getByRole('region', { name: 'Atributos: ' + armor.name })
    expect(comparison).toHaveTextContent('Saldo após compra: ' + (500 - armor.price) + ' Ouro')
    expect(comparison).toHaveTextContent('Comparar')
    expect(save).toEqual(snapshot)
    fireEvent.click(screen.getByRole('button', { name: 'Inspecionar ' + armor.name }))
    expect(screen.queryByRole('region', { name: 'Atributos: ' + armor.name })).not.toBeInTheDocument()
  })

  it('labels material and consumable inventory categories without removing items', () => {
    const save = makeSave()
    save.inventory = [
      { instanceId: 'tonic', definitionId: 'consumable_minor_tonic', quantity: 2,
        rarity: 'common', locked: false, favorite: false, acquiredAt: save.updatedAt },
      { instanceId: 'fragment', definitionId: 'fragment_mycelial_essence', quantity: 1,
        rarity: 'rare', locked: false, favorite: false, acquiredAt: save.updatedAt },
    ]
    render(<InventoryPanel save={save} compact />)
    const selector = screen.getByRole('combobox', { name: 'Filtrar itens da mochila' })
    fireEvent.change(selector, { target: { value: 'consumables' } })
    expect(screen.getByText(content.items.consumable_minor_tonic.name)).toBeInTheDocument()
    expect(screen.queryByText(content.items.fragment_mycelial_essence.name)).not.toBeInTheDocument()
    fireEvent.change(selector, { target: { value: 'materials' } })
    expect(screen.getByText(content.items.fragment_mycelial_essence.name)).toBeInTheDocument()
    expect(screen.queryByText(content.items.consumable_minor_tonic.name)).not.toBeInTheDocument()
    expect(save.inventory).toHaveLength(2)
  })

  it('shows the authoritative derived combat entry totals separately from item-only bonuses', () => {
    const save = makeSave()
    const effective = deriveCharacterStats(save, content)
    render(<BattleEquipmentHud save={save} />)
    const totals = screen.getByLabelText('Valores calculados pelo mesmo motor de atributos usado pelo combate')
    expect(totals).toHaveTextContent('Defesa ' + effective.defense.value)
    expect(totals).toHaveTextContent('Iniciativa ' + effective.initiative.value)
    expect(totals).toHaveTextContent('Vida máx. ' + effective.life.value)
    expect(screen.getByLabelText('Bônus diretos dos equipamentos')).toHaveTextContent('ATRIBUTOS EFETIVOS')
  })
})
