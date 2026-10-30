import type { GameSave } from '../game/types'
import type { QuestDefinition } from '../../content/types'
import { content } from '../../content/catalog'
import { npcConversationVoices, npcQuestActiveBriefs, npcQuestBriefs } from '../../content/npcConversations'

export type ConversationChoice = { id: string; label: string; nextId: string }
export type ConversationNode = { id: string; text: string; choices: ConversationChoice[] }
export type NpcConversation = { startId: string; nodes: Record<string, ConversationNode> }

/** Read-only branching dialogue: no offer, acceptance, reward or relationship mutation. */
export function buildNpcConversation(save: GameSave, portraitAssetId: string, lines: readonly string[], quest?: QuestDefinition): NpcConversation {
  const voice = npcConversationVoices[portraitAssetId]
  const topics: ConversationChoice[] = voice ? [
    { id: 'work', label: voice.question, nextId: 'work' },
    { id: 'place', label: 'O que tem acontecido por aqui?', nextId: 'place' },
    { id: 'advice', label: 'Tem algum conselho para mim?', nextId: 'advice' },
  ] : []
  if (quest) topics.unshift({ id: 'mission', label: `Sobre a missão: ${quest.title}`, nextId: 'mission' })
  const back: ConversationChoice = { id: 'greeting', label: 'Vamos falar de outra coisa.', nextId: 'greeting' }
  const nodes: Record<string, ConversationNode> = {}
  const greetings = lines.length ? lines : ['Pode falar. Estou ouvindo.']
  greetings.forEach((text, index) => {
    const id = index === 0 ? 'greeting' : `greeting_${index}`
    nodes[id] = { id, text, choices: [...(index + 1 < greetings.length ? [{ id: 'continue', label: 'Pode continuar.', nextId: `greeting_${index + 1}` }] : []), ...topics] }
  })
  if (voice) for (const id of ['work', 'place', 'advice'] as const) {
    nodes[id] = { id, text: voice[id], choices: [...topics.filter((choice) => choice.id !== id), back] }
  }
  if (quest) {
    const status = save.quests[quest.id]?.status
    const brief = npcQuestBriefs[quest.id] ?? (quest.id.startsWith('side_npc_')
      ? 'Preciso da sua ajuda para conter as manifestações Fungorras de Astravél. Observe as criaturas em combate e volte para me contar o que encontrou.' : quest.summary)
    const text = status === 'completed' ? 'Obrigado por cumprir o combinado. Sua contribuição já foi registrada.'
      : status === 'ready_to_turn_in' ? 'Você já cumpriu o combinado. Confirme a entrega quando quiser concluir.'
      : status === 'active' ? npcQuestActiveBriefs[quest.id] ?? 'Conto com você para o trabalho que combinamos. ' + brief : brief
    nodes.mission = { id: 'mission', text,
      choices: [{ id: 'guidance', label: quest.turnInItems ? 'Onde encontro os materiais?' : 'Como posso avançar?', nextId: 'guidance' },
        { id: 'payment', label: 'O que recebo ao concluir?', nextId: 'payment' }, back] }
    const materials = quest.turnInItems?.map((input) => {
      const sources = Object.values(content.enemies).filter((enemy) => enemy.lootDefinitionIds.includes(input.itemId)).map((enemy) => enemy.name)
      return sources.length ? `Para obter ${content.items[input.itemId]?.name ?? input.itemId}, enfrente ${sources.join(' e ')}.` : 'Consulte os serviços da cidade para localizar este material.'
    })
    const enemyNames = quest.objectives.filter((objective) => objective.type === 'kill')
      .map((objective) => content.enemies[objective.targetId]?.name).filter(Boolean)
    nodes.guidance = { id: 'guidance', text: materials?.length
      ? `${materials.join(' ')} As caçadas e as Ondas do Portal permitem buscar novos materiais. Traga-os na mochila; favoritos e componentes protegidos ficam com você.`
      : enemyNames.length ? `Procure ${enemyNames.join(' e ')} em Astravél ou nos encontros do Portal. Depois de cumprir o objetivo, volte para conversar comigo.`
      : 'Acompanhe o objetivo e o destino no diário. A missão avança pelas ações indicadas; quando estiver pronta, retorne ao responsável para concluir.',
      choices: [{ id: 'mission', label: 'Entendi. Vamos retomar o trabalho.', nextId: 'mission' }, ...topics.filter((choice) => choice.id !== 'mission')] }
    if (quest.id.startsWith('rosetta_tutorial_')) nodes.guidance.text = npcQuestBriefs[quest.id]
    nodes.payment = { id: 'payment', text: status === 'completed' ? 'Essa entrega já foi concluída e a recompensa foi registrada. Não há um novo pagamento por este mesmo trabalho.' : quest.rewards.length
      ? `Ao concluir, você recebe ${quest.rewards.map((reward) => `${reward.value} ${reward.type === 'gold' ? 'Ouro' : reward.type === 'characterXp' ? 'XP' : 'Essência'}`).join(', ')}. A recompensa só é aplicada na entrega.${quest.turnInItems ? ' Os materiais combinados são consumidos uma única vez.' : ''}`
      : 'Este trabalho faz parte do seu progresso. A conclusão exige sua confirmação; conversar não aplica recompensas.',
      choices: [{ id: 'mission', label: 'Certo. Sobre o objetivo…', nextId: 'mission' }, back] }
  }
  return { startId: quest ? 'mission' : 'greeting', nodes }
}
