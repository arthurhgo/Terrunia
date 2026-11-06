import type { ContentCatalog } from '../../content/catalog'
import type { QuestDefinition } from '../../content/types'

export type QuestRewardPreview = { id: string; kind: 'resource' | 'item' | 'choice' | 'milestone'; label: string }

/** Only describes rewards actually granted at turn-in. No currency or item is created here. */
export function getQuestRewardPreview(quest: QuestDefinition, catalog: ContentCatalog): QuestRewardPreview[] {
  const rows: QuestRewardPreview[] = quest.rewards.map((reward, index) => ({
    id: `resource-${index}`,
    kind: 'resource',
    label: `+${reward.value} ${reward.type === 'gold' ? 'Ouro' : reward.type === 'characterXp' ? 'XP' : 'Essência Bruta'}`,
  }))
  for (const { itemId, quantity } of quest.itemRewards ?? []) {
    rows.push({ id: `item-${itemId}`, kind: 'item',
      label: `${catalog.items[itemId]?.name ?? itemId} ×${quantity}` })
  }
  if (quest.choiceRewardItemIds?.length) {
    rows.push({
      id: 'chosen-item', kind: 'choice',
      label: 'Escolha 1: ' + quest.choiceRewardItemIds.map((id) => catalog.items[id]?.name ?? id).join(' / '),
    })
  }
  for (const [index, outcome] of (quest.outcomes ?? []).entries()) {
    let label = ''
    if (outcome.type === 'clanReputation') label = `+${outcome.value} Reputação · ${catalog.clans[outcome.clanId]?.name ?? outcome.clanId}`
    if (outcome.type === 'clanEligibility') label = `Elegibilidade ao Clã ${catalog.clans[outcome.clanId]?.name ?? outcome.clanId} (convite e rito ainda necessários)`
    if (outcome.type === 'classEligibility') label = `Elegibilidade à Classe ${catalog.classes[outcome.classId]?.name ?? outcome.classId} (não é filiação automática)`
    if (outcome.type === 'worldFlag') label = 'Marco de história registrado'
    rows.push({ id: `milestone-${index}`, kind: 'milestone', label })
  }
  if (quest.rewardNote) rows.push({ id: 'narrative', kind: 'milestone', label: quest.rewardNote })
  return rows
}
