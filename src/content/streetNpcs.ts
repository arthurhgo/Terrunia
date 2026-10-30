import type { NPCDefinition, QuestDefinition, TerranNpcPresence } from './types'
import type { TerranLocationId } from './terran'
import { collectionQuestIdsForNpc } from './collectionContracts'

/**
 * CONTENT_DRAFT — new sidequest-only street characters.
 * They are not institutional residents and do not grant clans/classes.
 * Locations anchor conversations in existing Terran areas, not extra institutions.
 */
const streetNpcBaseDefinitions: NPCDefinition[] = [
  {
    id: 'npc_street_arlen', name: 'Arlen', title: 'Mensageiro de Terran', settlementId: 'terran',
    roles: ['questGiver'], questIds: ['side_street_arlen'], portraitAssetId: 'npc.street.arlen',
    dialogue: ['As rotas continuam abertas, mas os Rastejantes se aproximaram dos caminhos de entrega.',
      'Preciso que alguém patrulhe a trilha e me conte se podemos atravessá-la novamente.'],
    status: 'CONTENT_DRAFT',
  },
  {
    id: 'npc_street_liora', name: 'Liora', title: 'Coletora Itinerante', settlementId: 'terran',
    roles: ['questGiver'], questIds: ['side_street_liora'], portraitAssetId: 'npc.street.liora',
    dialogue: ['Os esporos estão mudando o ar nos lugares em que colho minhas ervas.',
      'Quero ter certeza de que a rota é segura antes de voltar à floresta.'],
    status: 'CONTENT_DRAFT',
  },
  {
    id: 'npc_street_garrik', name: 'Garrik', title: 'Vigilante da Rua', settlementId: 'terran',
    roles: ['questGiver'], questIds: ['side_street_garrik'], portraitAssetId: 'npc.street.garrik',
    dialogue: ['Terran não termina em seus portões. Os primeiros passos de Astravél também precisam de vigilância.',
      'Se afastarmos os Rastejantes, os viajantes poderão respirar melhor.'],
    status: 'CONTENT_DRAFT',
  },
  {
    id: 'npc_street_siven', name: 'Siven', title: 'Cartógrafo Aprendiz', settlementId: 'terran',
    roles: ['questGiver'], questIds: ['side_street_siven'], portraitAssetId: 'npc.street.siven',
    dialogue: ['Meu mapa ficou inútil quando as criaturas começaram a surgir onde não havia nada.',
      'Não posso desenhar uma trilha segura sem descobrir o que vive nela.'],
    status: 'CONTENT_DRAFT',
  },
  {
    id: 'npc_street_nara', name: 'Nara', title: 'Observadora dos Ecos', settlementId: 'terran',
    roles: ['questGiver'], questIds: ['side_street_nara'], portraitAssetId: 'npc.street.nara',
    dialogue: ['A bruma de Astravél traz sinais que ainda não consigo separar.',
      'Os Semeadores deixam um rastro visível. Ajude-me a reconhecê-lo à distância.'],
    status: 'CONTENT_DRAFT',
  },
  {
    id: 'npc_street_ruven', name: 'Ruven', title: 'Explorador Desgastado', settlementId: 'terran',
    roles: ['questGiver'], questIds: ['side_street_ruven'], portraitAssetId: 'npc.street.ruven',
    dialogue: ['Vi uma sombra entre os esporos e recuei antes de conseguir descrevê-la.',
      'Se voltar a encontrar aquela aberração, não subestime sua resistência.'],
    status: 'CONTENT_DRAFT',
  },
]

export const streetNpcDefinitions: NPCDefinition[] = streetNpcBaseDefinitions.map((npc) => ({
  ...npc, questIds: [...npc.questIds, ...collectionQuestIdsForNpc(npc.id)],
}))

export type StreetNpcPlacement = {
  id: string
  npcId: string
  locationId: TerranLocationId
  point: { x: number; y: number }
  palette: string
  variant: number
}

export const streetNpcPlacements: readonly StreetNpcPlacement[] = [
  { id: 'presence_street_arlen', npcId: 'npc_street_arlen', locationId: 'location_terran_eldamar_house', point: { x: 146, y: 91 }, palette: 'exploration', variant: 0 },
  { id: 'presence_street_liora', npcId: 'npc_street_liora', locationId: 'location_terran_daeryn_house', point: { x: 141, y: 156 }, palette: 'healing', variant: 1 },
  { id: 'presence_street_garrik', npcId: 'npc_street_garrik', locationId: 'location_terran_zareth_barracks', point: { x: 242, y: 185 }, palette: 'defense', variant: 2 },
  { id: 'presence_street_siven', npcId: 'npc_street_siven', locationId: 'location_terran_vorren_post', point: { x: 244, y: 93 }, palette: 'knowledge', variant: 3 },
  { id: 'presence_street_nara', npcId: 'npc_street_nara', locationId: 'location_terran_clan_hall', point: { x: 145, y: 195 }, palette: 'clan', variant: 4 },
  { id: 'presence_street_ruven', npcId: 'npc_street_ruven', locationId: 'location_terran_bond_workshop', point: { x: 248, y: 155 }, palette: 'bond', variant: 5 },
]

export const streetNpcPresences: readonly TerranNpcPresence[] = streetNpcPlacements.map((entry) => {
  const npc = streetNpcDefinitions.find((value) => value.id === entry.npcId)!
  return { id: entry.id, npcId: npc.id, label: npc.name, presence: 'resident', roleLabel: npc.title }
})

type StreetContract = {
  npcId: string
  title: string
  story: string
  enemyId: string
  amount: number
  prerequisiteId: string
  xp: number
  gold: number
  rawEssence: number
}

const contracts: readonly StreetContract[] = [
  { npcId: 'npc_street_arlen', title: 'Caminhos de Entrega', story: 'Arlen precisa de uma ronda segura antes de retomar as entregas. Afaste os Fungorros Rastejantes e retorne para informar o trajeto.', enemyId: 'enemy_fungorro_crawler', amount: 2, prerequisiteId: 'vs_astravel_first_contact', xp: 35, gold: 18, rawEssence: 0 },
  { npcId: 'npc_street_liora', title: 'O Ar que Floresce', story: 'Liora quer verificar as rotas de colheita. Derrote os Semeadores de Esporos e volte para entregar suas observações.', enemyId: 'enemy_spore_sower', amount: 2, prerequisiteId: 'vs_astravel_first_contact', xp: 45, gold: 22, rawEssence: 15 },
  { npcId: 'npc_street_garrik', title: 'Vigília além dos Muros', story: 'Garrik precisa de apoio contra os Rastejantes que cercam as rotas de Astravél. Relate a ronda após combater.', enemyId: 'enemy_fungorro_crawler', amount: 3, prerequisiteId: 'main_vorren_bestiary', xp: 55, gold: 28, rawEssence: 0 },
  { npcId: 'npc_street_siven', title: 'O Mapa da Gosma', story: 'Siven identificou rastros de uma nova criatura. Enfrente Bolas de Gosma Fúngica no Modo Ondas e conte ao cartógrafo o que descobriu.', enemyId: 'enemy_fungal_slime', amount: 2, prerequisiteId: 'main_vorren_bestiary', xp: 75, gold: 35, rawEssence: 20 },
  { npcId: 'npc_street_nara', title: 'Padrões na Bruma', story: 'Nara procura compreender a movimentação dos Semeadores de Esporos. Observe-os em combate e retorne à cidade.', enemyId: 'enemy_spore_sower', amount: 3, prerequisiteId: 'main_lithwynn_signs', xp: 75, gold: 35, rawEssence: 20 },
  { npcId: 'npc_street_ruven', title: 'A Sombra Esporulante', story: 'Ruven sobreviveu a um Horror Esporulante. Derrote essa criatura nas ondas avançadas do Portal e compartilhe seu relato.', enemyId: 'enemy_fungal_horror', amount: 1, prerequisiteId: 'main_lithwynn_signs', xp: 95, gold: 50, rawEssence: 30 },
]

export const streetQuestDefinitions: QuestDefinition[] = contracts.map((entry) => ({
  id: 'side_' + entry.npcId.replace('npc_', ''),
  title: entry.title,
  summary: entry.story,
  giverNpcId: entry.npcId,
  turnInNpcId: entry.npcId,
  category: 'secondary',
  objectives: [{
    id: 'side_' + entry.npcId.replace('npc_', '') + '_combat',
    type: 'kill',
    targetId: entry.enemyId,
    required: entry.amount,
    label: 'Derrote ' + entry.amount + ' ' +
      ({ enemy_fungorro_crawler: 'Fungorros Rastejantes', enemy_spore_sower: 'Semeadores de Esporos',
        enemy_fungal_slime: 'Bolas de Gosma Fúngica', enemy_fungal_horror: 'Horrores Esporulantes' }[entry.enemyId] ?? 'criaturas') +
      ' e retorne ao NPC nas ruas de Terran',
  }],
  rewards: [
    { type: 'characterXp', value: entry.xp },
    { type: 'gold', value: entry.gold },
    ...(entry.rawEssence > 0 ? [{ type: 'rawEssence' as const, value: entry.rawEssence }] : []),
  ],
  prerequisites: [{ type: 'questCompleted', questId: entry.prerequisiteId }],
  initialStatus: 'locked',
  status: 'CONTENT_DRAFT',
}))
