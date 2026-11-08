import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { createNewSave } from '../game/createSave'
import { getNpcQuestBadgeCounts } from './questSelectors'

describe('v0.5.12 — categorias visuais das missões dos NPCs', () => {
  const fresh = () => {
    const save = createNewSave('npc-badge-test', 'Terrírian', 'character.terririan.default', content)
    for (const quest of Object.values(save.quests)) quest.status = 'locked'
    return save
  }

  it('distingue principal dourada e secundária azul sem contar missões bloqueadas', () => {
    const save = fresh()
    save.quests.main_terran_first_home.status = 'available'
    save.quests.side_npc_daeryn.status = 'offered'
    expect(getNpcQuestBadgeCounts(save, 'npc_daeryn', content)).toEqual({
      main: 1, secondary: 1, active: 0, ready: 0,
    })
    expect(getNpcQuestBadgeCounts(save, 'npc_rosetta', content)).toEqual({
      main: 0, secondary: 0, active: 0, ready: 0,
    })
  })

  it('aceitar uma missão retira a oferta e adiciona a faixa cinza; entrega tem faixa verde', () => {
    const save = fresh()
    save.quests.main_terran_first_home.status = 'active'
    save.quests.side_npc_daeryn.status = 'ready_to_turn_in'
    expect(getNpcQuestBadgeCounts(save, 'npc_daeryn', content)).toEqual({
      main: 0, secondary: 0, active: 1, ready: 1,
    })
    save.quests.side_npc_daeryn.status = 'completed'
    expect(getNpcQuestBadgeCounts(save, 'npc_daeryn', content).ready).toBe(0)
  })
})
