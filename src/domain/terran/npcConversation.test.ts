import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { npcConversationVoices, npcQuestBriefs } from '../../content/npcConversations'
import { npcVisualDefinitions } from '../../content/npcVisuals'
import { createNewSave } from '../game/createSave'
import { buildNpcConversation } from './npcConversation'
import { getNpcQuestNotice } from '../quests/questSelectors'

describe('conversas e sinalização dos NPCs', () => {
  it('cobre os 51 personagens com falas próprias e respostas que levam a nós existentes', () => {
    const save = createNewSave('speaker', 'Aron', 'character.terririan.default', content)
    const before = structuredClone(save)
    const answers = new Set<string>()
    expect(Object.keys(npcConversationVoices)).toHaveLength(npcVisualDefinitions.length)
    for (const profile of npcVisualDefinitions) {
      const conversation = buildNpcConversation(save, profile.assetId, ['Estou ouvindo.', 'Pode perguntar.'])
      expect(conversation.nodes[conversation.startId].choices.length).toBeGreaterThan(2)
      for (const id of ['work', 'place', 'advice']) answers.add(conversation.nodes[id].text)
      for (const node of Object.values(conversation.nodes)) for (const choice of node.choices) {
        expect(conversation.nodes[choice.nextId], profile.name + ': ' + choice.label).toBeDefined()
      }
    }
    expect(answers.size).toBe(153)
    expect(save).toEqual(before)
  })

  it('responde sobre a missão e a origem real dos materiais sem aceitar, consumir ou pagar', () => {
    const save = createNewSave('speaker', 'Aron', 'character.terririan.default', content)
    const quest = content.quests.delivery_arlen_nuclei
    save.quests[quest.id].status = 'offered'
    const before = structuredClone(save)
    const dialogue = buildNpcConversation(save, 'npc.street.arlen', content.npcs.npc_street_arlen.dialogue, quest)
    expect(dialogue.startId).toBe('mission')
    expect(dialogue.nodes.mission.text).toContain(npcQuestBriefs[quest.id])
    expect(dialogue.nodes.guidance.text).toContain('Fungorro Rastejante')
    expect(dialogue.nodes.payment.text).toContain('96 Ouro')
    expect(save).toEqual(before)
    save.quests[quest.id].status = 'active'
    expect(buildNpcConversation(save, 'npc.street.arlen', [], quest).nodes.mission.text).toContain('Conto com você para o trabalho que combinamos.')
  })

  it('prioriza o marcador de missão aceita mesmo com outra oferta e volta a destacar a entrega pronta', () => {
    const save = createNewSave('speaker', 'Aron', 'character.terririan.default', content)
    save.quests.side_street_arlen.status = 'active'
    save.quests.delivery_arlen_nuclei.status = 'available'
    expect(getNpcQuestNotice(save, 'npc_street_arlen', content)).toEqual({ marker: '◇', phase: 'active' })
    save.quests.delivery_arlen_nuclei.status = 'ready_to_turn_in'
    expect(getNpcQuestNotice(save, 'npc_street_arlen', content)).toEqual({ marker: '◆', phase: 'turn-in' })
    expect(getNpcQuestNotice(save, 'npc_rosetta', content)).toEqual({ marker: '?', phase: 'guide' })
    save.quests.vs_astravel_first_contact.status = 'active'
    expect(getNpcQuestNotice(save, 'npc_eldamar', content)).toEqual({ marker: '!', phase: 'active' })
  })
})
