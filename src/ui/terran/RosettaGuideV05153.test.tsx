import { cleanup,fireEvent,render,screen } from '@testing-library/react'
import { afterEach,describe,expect,it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { content } from '../../content/catalog'
import { createNewSave } from '../../domain/game/createSave'
import { applyQuestEvent } from '../../domain/quests/questEngine'
import { useGameStore } from '../../state/gameStore'
import { RosettaGuide } from './RosettaGuide'

const NOW='2026-11-10T19:00:00.000Z'
const create=()=>{
 const save=createNewSave('owner','Guia de Mercado','character.terririan.default',content,NOW)
 save.world.currentLocationId='location_terran_portal_plaza'
 save.quests.rosetta_tutorial_supply.status='completed'
 save.quests.rosetta_tutorial_market_specialists.status='available'
 return save
}
afterEach(()=>{cleanup();useGameStore.getState().resetSession()})

describe('v0.5.15.3 Rosetta optional merchant introduction',()=>{
 it('allows accepting and finishing an optional no-purchase tour without affecting permanent Bonds',()=>{
  const save=create()
  const before=structuredClone(save.character.bondedEquipment)
  useGameStore.setState({status:'ready',ownerId:save.ownerId,syncMode:'local',syncStatus:'saved',save})
  const view=render(<MemoryRouter>
   <RosettaGuide save={save} onClose={()=>{}} onOpenQuests={()=>{}}/>
  </MemoryRouter>)
  expect(screen.getByRole('heading',{name:/Os Ofícios do Mercado/})).toBeInTheDocument()
  const accept=screen.getByRole('button',{name:'Aceitar visita aos especialistas'})
  fireEvent.click(accept)
  let active=useGameStore.getState().save!
  expect(active.quests.rosetta_tutorial_market_specialists.status).toBe('active')
  for(const id of ['npc_terran_weaponsmith','npc_terran_armorer','npc_terran_accessory_artisan']){
   active=applyQuestEvent(active,{type:'talk',targetId:id},content,NOW)
  }
  expect(active.quests.rosetta_tutorial_market_specialists.status).toBe('ready_to_turn_in')
  useGameStore.setState({save:active})
  view.rerender(<MemoryRouter>
   <RosettaGuide save={active} onClose={()=>{}} onOpenQuests={()=>{}}/>
  </MemoryRouter>)
  fireEvent.click(screen.getByRole('button',{name:'Concluir visita aos especialistas'}))
  const done=useGameStore.getState().save!
  expect(done.quests.rosetta_tutorial_market_specialists.status).toBe('completed')
  expect(done.character.bondedEquipment).toEqual(before)
  expect(done.inventory).toEqual(save.inventory)
  expect(done.wallet.gold).toBe(save.wallet.gold)
 })
})
