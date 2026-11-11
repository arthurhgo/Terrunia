import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { equipmentOffersV0515 } from '../../content/equipmentV0515'
import { createNewSave } from '../../domain/game/createSave'
import { GearForgeV0515 } from './GearForgeV0515'

afterEach(cleanup)

const make = () => {
  const save = createNewSave('forge-preview', 'Ferreiro QA', 'character.terririan.default', content)
  const offer = equipmentOffersV0515.find(o => o.channel === 'PUBLIC_TERRAN' && o.tier === 1 && o.slot === 'helmet')!
  save.inventory.push({ instanceId: 'forge-helmet-1', definitionId: offer.id, quantity: 1,
    rarity: 'common', favorite: false, locked: false, acquiredAt: save.updatedAt, refinementLevel: 0 })
  save.world.currentLocationId = 'location_terran_forge'
  return { save, offer }
}

describe('v0.5.15.3 — preview read-only da forja comercial', () => {
  it('mostra G1 para G2, valores reais, preço e saldo sem alterar o save', () => {
    const { save, offer } = make()
    save.wallet.gold = 200
    const snapshot = structuredClone(save)
    render(<GearForgeV0515 save={save} />)
    const projection = screen.getByLabelText('Prévia de forja G1 para G2')
    expect(projection).toHaveTextContent('G1 → G2 · ' + offer.forgeG2 + ' Ouro')
    expect(projection).toHaveTextContent('Saldo após forja: ' + (200 - offer.forgeG2) + ' Ouro')
    expect(screen.getByRole('button', { name: 'Forjar ' + offer.name + ' até Grau 2' })).toBeEnabled()
    expect(save).toEqual(snapshot)
  })
  it('explica Ouro insuficiente e proteção sem habilitar o botão', () => {
    const { save, offer } = make()
    save.wallet.gold = 0
    save.inventory[0].favorite = true
    render(<GearForgeV0515 save={save} />)
    expect(screen.getByText(/Faltam /)).toBeInTheDocument()
    expect(screen.getByText(/Peça protegida ou favorita/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Forjar ' + offer.name + ' até Grau 2' })).toBeDisabled()
  })
})
