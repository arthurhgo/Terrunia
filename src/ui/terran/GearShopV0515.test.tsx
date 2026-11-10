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
  it('displays individual sprite cards and meaningful stat filters for the Terran weaponsmith',()=>{
    const save=base()
    save.world.currentLocationId='location_terran_bond_workshop'
    render(<TerranSpecialistShopV05153 save={save} merchantId="presence_terran_weaponsmith"/>)
    expect(screen.getByText(/12 itens · 12 disponíveis no catálogo/)).toBeInTheDocument()
    expect(screen.queryByRole('group',{name:'Conjuntos disponíveis'})).not.toBeInTheDocument()
    expect(screen.getByLabelText('Equipamentos individuais à venda').querySelectorAll('article')).toHaveLength(12)
    const guard=equipmentOffersV0515.find(o=>o.channel==='PUBLIC_TERRAN'&&o.tier===1&&
      o.slot==='weapon'&&o.recommendedClassId==='sentinela_da_luz')!
    expect(screen.getByText(guard.name).closest('article')).toHaveTextContent(formatGearStats(guard,1))
    fireEvent.change(screen.getByRole('combobox',{name:'Filtrar bônus de equipamento'}),{target:{value:'physicalAttack'}})
    expect(screen.getByLabelText('Equipamentos individuais à venda').querySelectorAll('article').length).toBeGreaterThan(0)
    fireEvent.change(screen.getByRole('searchbox',{name:'Buscar equipamentos pelo nome ou atributos'}),
      {target:{value:'termo impossível'}})
    expect(screen.getByText(/Nenhuma peça encontrada/)).toBeInTheDocument()
  })

})
