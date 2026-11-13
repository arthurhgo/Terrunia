import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { equipmentOffersV0515, formatGearStats } from '../../content/equipmentV0515'
import { TerranSpecialistShopV05153 } from './TerranSpecialistShopV05153'
import { createNewSave } from '../../domain/game/createSave'
import { GearShopV0515 } from './GearShopV0515'

afterEach(() => cleanup())

function base() {
  const save=createNewSave('owner','Mercador Tester','character.terririan.default',content)
  save.wallet.gold=200000
  return save
}

describe('Mercado e Intendente dos castelos v0.5.15.1',()=>{
  it('Neris has no old equipment-set grid anymore',()=>{
    const save=base()
    save.world.currentLocationId='location_terran_bond_workshop'
    render(<GearShopV0515 save={save} merchantId="presence_neris"/>)
    expect(screen.getByText(/Neris vende apenas consumíveis/)).toBeInTheDocument()
    expect(screen.queryByRole('group',{name:'Conjuntos disponíveis'})).not.toBeInTheDocument()
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
  it('Torvan shows separate modular parts instead of full weapon storefront',()=>{
    const save=base()
    save.world.currentLocationId='location_terran_bond_workshop'
    render(<TerranSpecialistShopV05153 save={save} merchantId="presence_terran_weaponsmith"/>)
    const shop=screen.getByLabelText('Peças estruturais de arma · Torvan')
    expect(shop).toHaveTextContent('Torvan · Componentes de Vínculo')
    expect(shop).toHaveTextContent('Não vendemos armas completas')
    expect(shop.querySelectorAll('article')).toHaveLength(32)
    fireEvent.change(screen.getByRole('combobox',{name:'Família'}),{target:{value:'blade'}})
    expect(shop.querySelectorAll('article')).toHaveLength(4)
    expect(screen.queryByLabelText('Equipamentos individuais à venda')).not.toBeInTheDocument()
  })

})
