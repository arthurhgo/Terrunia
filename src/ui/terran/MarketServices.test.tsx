import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { content } from '../../content/catalog'
import { bindPrologueWeapon, createNewSave } from '../../domain/game/createSave'
import { useGameStore } from '../../state/gameStore'
import { MarketNpcPanel } from './MarketServices'

const makeSave = () => {
  const initial = createNewSave('owner', 'Lysa', 'character.terririan.default', content)
  const bound = bindPrologueWeapon(initial, content)
  if (!bound.ok) throw Error(bound.message)
  bound.value.eventLog.push('CutsceneViewed:terran_arrival')
  bound.value.world.currentLocationId = 'location_terran_bond_workshop'
  bound.value.wallet.gold = 500
  return bound.value
}
const presence = (id: string) => content.terranLocations.location_terran_bond_workshop.npcPresences.find((entry) => entry.id === id)!

function setup(id: string, save = makeSave()) {
  useGameStore.setState({ status: 'ready', ownerId: save.ownerId, syncStatus: 'saved', syncMode: 'local', save })
  render(<MemoryRouter><MarketNpcPanel save={save} presence={presence(id)} onClose={() => {}} /></MemoryRouter>)
}
afterEach(() => { cleanup(); useGameStore.getState().resetSession() })

describe('NPCs do Mercado', () => {
  it('Valmira vende componentes ao personagem e desconta Ouro', () => {
    setup('presence_valmira')
    fireEvent.click(screen.getByRole('button', { name: 'Comprar Fragmento de Essência Micelial por 180 ouro' }))
    expect(useGameStore.getState().save?.wallet.gold).toBe(320)
    expect(useGameStore.getState().save?.inventory.some((item) => item.definitionId === 'fragment_mycelial_essence')).toBe(true)
  })

  it('Feril troca drops por Ouro e Lorian por Essência com regras existentes', () => {
    const save = makeSave()
    save.inventory.push({
      instanceId: 'market-test-drop', definitionId: 'drop_fungal_nucleus', quantity: 1,
      rarity: 'common', favorite: false, locked: false, acquiredAt: '2026-10-30T00:00:00Z',
    })
    setup('presence_feril', save)
    fireEvent.click(screen.getByRole('button', { name: /Núcleo Fúngico/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Trocar por Ouro' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar +32' }))
    expect(useGameStore.getState().save?.wallet.gold).toBe(532)
    expect(useGameStore.getState().save?.inventory.some((item) => item.instanceId === 'market-test-drop')).toBe(false)

    cleanup()
    const second = makeSave()
    second.inventory.push({
      instanceId: 'market-test-essence', definitionId: 'drop_fungal_nucleus', quantity: 1,
      rarity: 'common', favorite: false, locked: false, acquiredAt: '2026-10-30T00:00:00Z',
    })
    setup('presence_lorian', second)
    fireEvent.click(screen.getByRole('button', { name: /Núcleo Fúngico/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Trocar por Essência' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar +100' }))
    expect(useGameStore.getState().save?.inventory.some((item) => item.instanceId === 'market-test-essence')).toBe(false)
    expect(useGameStore.getState().save?.essence.lifetimeEssence).toBeGreaterThan(second.essence.lifetimeEssence)
  })

  it('Lithwynn habilita o rito de melhoria somente com Ressonância e fragmento', () => {
    const save = makeSave()
    const id = save.character.bondedEquipment.weapon!
    const item = save.boundItems[id]
    item.resonance = item.resonanceThreshold
    save.inventory.push({ instanceId: 'fragment-market-test', definitionId: 'fragment_mycelial_essence',
      quantity: 1, rarity: 'rare', favorite: false, locked: false, acquiredAt: '2026-10-30T00:00:00Z' })
    setup('presence_lithwynn', save)
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar melhoria G2' }))
    expect(useGameStore.getState().save?.boundItems[id].grade).toBe(2)
    expect(useGameStore.getState().save?.inventory.some((entry) => entry.instanceId === 'fragment-market-test')).toBe(false)
  })
  it('Talia lapida o Vínculo GII usando uma Joia compatível', () => {
    const save = makeSave()
    const id = save.character.bondedEquipment.weapon!
    const item = save.boundItems[id]
    item.grade = 2
    item.components.essences.push('essence_mycelial')
    item.resonance = item.resonanceThreshold
    save.inventory.push({
      instanceId: 'gem-market-test', definitionId: 'item_gem_esmeralda_crescimento',
      quantity: 1, rarity: 'rare', favorite: false, locked: false, acquiredAt: '2026-10-30T00:00:00Z',
    })
    setup('presence_talia', save)
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar melhoria G3' }))
    expect(useGameStore.getState().save?.boundItems[id].grade).toBe(3)
    expect(useGameStore.getState().save?.boundItems[id].components.gems).toContain('esmeralda_crescimento')
    expect(useGameStore.getState().save?.inventory.some((entry) => entry.instanceId === 'gem-market-test')).toBe(false)
  })

})
