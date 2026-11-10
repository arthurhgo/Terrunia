import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { equipmentOffersV0515, formatGearStats } from '../../content/equipmentV0515'
import { createNewSave } from '../../domain/game/createSave'
import { GearShopV0515 } from './GearShopV0515'

afterEach(() => cleanup())

function base() {
  const save=createNewSave('owner','Mercador Tester','character.terririan.default',content)
  save.wallet.gold=200000
  return save
}

describe('Mercado e Intendente dos castelos v0.5.15.1',()=>{
  it('shows Neris only the twelve Tier I basic styles, without Clan or Class selections',()=>{
    const save=base()
    save.world.currentLocationId='location_terran_bond_workshop'
    render(<GearShopV0515 save={save} merchantId="presence_neris"/>)
    const sets=within(screen.getByRole('group',{name:'Conjuntos disponíveis'}))
    expect(sets.getAllByRole('button')).toHaveLength(12)
    expect(screen.queryByRole('combobox',{name:'Filtrar tier de equipamento'})).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox',{name:'Filtrar itens exclusivos do castelo'})).not.toBeInTheDocument()
    expect(screen.getByText(/Somente equipamentos comuns Tier I, Grau 1/)).toBeInTheDocument()
  })

  it('one Dûn\'Avar Intendant lists 1 Clan + 3 Class lines, and locks Classes until gained',()=>{
    const save=base()
    save.world.currentLocationId='interior_clan_dunavar_castle'
    save.character.clan.clanId='dunavar'
    const view=render(<GearShopV0515 save={save} merchantId="presence_castle_merchant_clan_dunavar"/>)
    const sets=within(screen.getByRole('group',{name:'Conjuntos disponíveis'}))
    expect(sets.getAllByRole('button')).toHaveLength(4)
    fireEvent.change(screen.getByRole('combobox',{name:'Filtrar itens exclusivos do castelo'}),{target:{value:'class'}})
    expect(sets.getAllByRole('button')).toHaveLength(3)
    expect(screen.getByRole('status')).toHaveTextContent(/Classe/)
    expect(screen.getByRole('button',{name:/Comprar conjunto/})).toBeDisabled()
    const next=structuredClone(save)
    next.character.classProgression.classId='sentinela_da_luz'
    view.rerender(<GearShopV0515 save={next} merchantId="presence_castle_merchant_clan_dunavar"/>)
    expect(screen.getByRole('button',{name:/Comprar conjunto/})).toBeEnabled()
    fireEvent.change(screen.getByRole('combobox',{name:'Filtrar itens exclusivos do castelo'}),{target:{value:'clan'}})
    expect(sets.getAllByRole('button')).toHaveLength(1)
  })

  it('a different Clan merchant cannot see the Dûn\'Avar stock',()=>{
    const save=base()
    save.world.currentLocationId='interior_clan_rustal_castle'
    save.character.clan.clanId='rustal'
    render(<GearShopV0515 save={save} merchantId="presence_castle_merchant_clan_rustal"/>)
    const sets=within(screen.getByRole('group',{name:'Conjuntos disponíveis'}))
    expect(sets.getAllByRole('button')).toHaveLength(4)
    expect(sets.queryByText(/Juramento da Barreira/)).not.toBeInTheDocument()
  })
  it('offers genuinely different equipment bonuses and clarifies neutral combat roles',()=>{
    const save=base()
    save.world.currentLocationId='location_terran_bond_workshop'
    render(<GearShopV0515 save={save} merchantId="presence_neris"/>)
    const guard=equipmentOffersV0515.find(o=>o.channel==='PUBLIC_TERRAN'&&o.tier===1 &&
      o.slot==='weapon'&&o.recommendedClassId==='sentinela_da_luz')!
    const scout=equipmentOffersV0515.find(o=>o.channel==='PUBLIC_TERRAN'&&o.tier===1 &&
      o.slot==='weapon'&&o.recommendedClassId==='batedor_da_vigilia')!
    const guardCard=screen.getByText(guard.name).closest('article')!
    expect(guardCard).toHaveTextContent(formatGearStats(guard,1))
    expect(guardCard).toHaveTextContent('Forja G2: '+formatGearStats(guard,2))
    expect(guardCard).toHaveTextContent('Forja G3: '+formatGearStats(guard,3))
    expect(screen.getByRole('combobox',{name:'Filtrar perfil de combate'})).toBeInTheDocument()
    expect(screen.getByText(/Defesa e segurança com ataque físico controlado/)).toBeInTheDocument()
    fireEvent.change(screen.getByRole('combobox',{name:'Filtrar perfil de combate'}),
      {target:{value:'batedor_da_vigilia'}})
    const scoutCard=screen.getByText(scout.name).closest('article')!
    expect(scoutCard).toHaveTextContent(formatGearStats(scout,1))
    expect(formatGearStats(scout,1)).not.toBe(formatGearStats(guard,1))
    expect(screen.getByText(/Prioridade de turno e agressão física móvel/)).toBeInTheDocument()
    expect(scoutCard.querySelector('button')).not.toBeDisabled()
  })

})
