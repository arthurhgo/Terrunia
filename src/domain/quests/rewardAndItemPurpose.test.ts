import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import type { GameSave } from '../game/types'
import { getItemDestinations, getPendingItemDeliveries } from '../inventory/itemPurpose'
import { getQuestRewardPreview } from './questRewardPreview'

describe('recompensas explícitas e utilidade dos materiais v0.5.9', () => {
  it('mostra a escolha da proteção de Rosetta sem entregar três peças', () => {
    const preview = getQuestRewardPreview(content.quests.rosetta_tutorial_equip, content)
    const choices = preview.filter((row) => row.kind === 'choice')
    expect(choices).toHaveLength(1)
    expect(choices[0].label).toContain('Escolha 1')
    expect(choices[0].label).toContain('Túnica de Linho Gasta')
  })

  it('exibe benefícios narrativos e itens realmente concedidos nas entregas', () => {
    expect(getQuestRewardPreview(content.quests.main_terran_first_home, content)
      .some((reward) => reward.label.includes('Chave de Daeryn'))).toBe(true)
    expect(getQuestRewardPreview(content.quests.main_terran_open_base_door, content)
      .some((reward) => reward.label.includes('Acesso à Base'))).toBe(true)
  })

  it('não descreve a elegibilidade de Clã como filiação automática', () => {
    const preview = getQuestRewardPreview(content.quests.clan_dunavar_03, content)
    expect(preview.some((reward) => reward.label.includes('rito ainda necessários'))).toBe(true)
    expect(preview.some((reward) => reward.label.includes('Clã'))).toBe(true)
  })

  it('mostra destinos reais e preserva a descrição de proteção dos itens de missão', () => {
    const uses = getItemDestinations('drop_fungal_nucleus', content)
    expect(uses.some((use) => use.includes('Essência Bruta'))).toBe(true)
    expect(uses.some((use) => use.includes('Ouro'))).toBe(true)
    const protectedUses = getItemDestinations('quest_daeryn_home_key', content)
    expect(protectedUses).toContain('Item protegido: não vender nem converter')
    expect(protectedUses.some((use) => use.includes('Vender'))).toBe(false)
  })

  it('não revela contratos bloqueados e avisa quando uma entrega está ativa', () => {
    const save = {
      quests: {
        delivery_arlen_nuclei: { questId: 'delivery_arlen_nuclei', status: 'active', objectives: {}, tracked: false },
        delivery_liora_spores: { questId: 'delivery_liora_spores', status: 'locked', objectives: {}, tracked: false },
      },
    } as unknown as Pick<GameSave, 'quests'>
    const needed = getPendingItemDeliveries('drop_fungal_nucleus', save, content)
    expect(needed).toMatchObject([{ questId: 'delivery_arlen_nuclei', quantity: 2 }])
    expect(getPendingItemDeliveries('drop_spore_cluster', save, content)).toEqual([])
  })
})
