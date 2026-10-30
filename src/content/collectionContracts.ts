import { itemDefinitions } from './items'
import type { QuestDefinition } from './types'

/** CONTENT_DRAFT / BALANCE_DRAFT: real materials, explicit acceptance, one paid delivery. */
const contracts = [
  { id: 'arlen_nuclei', npc: 'npc_street_arlen', title: 'Matéria para as Entregas', location: 'location_terran_eldamar_house', gate: 'vs_astravel_first_contact', items: [['drop_fungal_nucleus', 2]], reason: 'Arlen precisa de núcleos para vedar suas caixas de transporte.', source: 'Fungorros Rastejantes em Astravél e nas Ondas do Portal.' },
  { id: 'liora_spores', npc: 'npc_street_liora', title: 'Esporos para o Herbário', location: 'location_terran_daeryn_house', gate: 'vs_astravel_first_contact', items: [['drop_spore_cluster', 3]], reason: 'Liora estuda a contaminação das ervas nas rotas de colheita.', source: 'Semeadores de Esporos em Astravél e nas Ondas.' },
  { id: 'garrik_chitin', npc: 'npc_street_garrik', title: 'Placas para a Vigília', location: 'location_terran_zareth_barracks', gate: 'main_vorren_bestiary', items: [['drop_spore_chitin', 3]], reason: 'Garrik encomenda placas resistentes para reparar os escudos de treinamento.', source: 'Louva-Esporos na Caçada de Esporos ou nas Ondas avançadas.' },
  { id: 'siven_shards', npc: 'npc_street_siven', title: 'Marcas no Mapa', location: 'location_terran_vorren_post', gate: 'main_vorren_bestiary', items: [['drop_ruin_shard', 3]], reason: 'Siven compara inscrições de pedra para localizar ruínas no mapa.', source: 'Sentinelas na Vigília da Ruína ou nas Ondas do Portal.' },
  { id: 'nara_echoes', npc: 'npc_street_nara', title: 'Fragmentos que Respondem', location: 'location_terran_clan_hall', gate: 'main_lithwynn_signs', items: [['fragment_echo_crystal', 3]], reason: 'Nara procura fragmentos comerciais que respondam à bruma do Portal.', source: 'Sentinelas da Ruína em Astravél, na Vigília da Ruína e nas Ondas.' },
  { id: 'ruven_fibers', npc: 'npc_street_ruven', title: 'Fibras para a Travessia', location: 'location_terran_bond_workshop', gate: 'main_lithwynn_signs', items: [['drop_mycelial_fiber', 2]], reason: 'Ruven precisa de fibras resistentes para reparar seu equipamento de viagem.', source: 'Horrores Esporulantes em Astravél e nas Ondas avançadas.' },
  { id: 'eldamar_echoes', npc: 'npc_eldamar', title: 'Amostras do Eco', location: 'location_terran_eldamar_house', gate: 'vs_astravel_first_contact', items: [['fragment_echo_crystal', 2], ['drop_void_dust', 1]], reason: 'Eldamar quer comparar cristais inertes com a poeira das Mariposas do Vazio.', source: 'Sentinelas e Mariposas em Astravél ou na Vigília da Ruína.' },
  { id: 'daeryn_gels', npc: 'npc_daeryn', title: 'Reserva do Alambique', location: 'location_terran_daeryn_house', gate: 'main_terran_first_home', items: [['drop_luminous_gel', 3], ['drop_fungal_gel', 2]], reason: 'Daeryn encomenda géis para recompor os reagentes do alambique.', source: 'Limuscos no Ninho Luminescente e Gosmas nas Ondas.' },
  { id: 'vorren_samples', npc: 'npc_vorren', title: 'O Peso da Carapaça', location: 'location_terran_vorren_post', gate: 'main_vorren_bestiary', items: [['drop_spore_chitin', 3], ['drop_void_dust', 2]], reason: 'Vorren paga por amostras intactas para completar o bestiário.', source: 'Louva-Esporos e Mariposas na Caçada de Esporos.' },
  { id: 'lithwynn_shards', npc: 'npc_lithwynn', title: 'Pedras para as Inscrições', location: 'location_terran_bond_workshop', gate: 'main_lithwynn_signs', items: [['drop_ruin_shard', 4]], reason: 'Lithwynn precisa de pedra marcada para estudar novas inscrições.', source: 'Sentinelas na Vigília da Ruína, em Astravél e nas Ondas.' },
  { id: 'neris_stock', npc: 'npc_neris', title: 'Reposição Luminescente', location: 'location_terran_bond_workshop', gate: 'vs_astravel_first_contact', items: [['drop_luminous_gel', 4]], reason: 'Neris procura um fornecedor de gel para recompor o estoque do Mercado.', source: 'Limuscos no Ninho Luminescente ou nas Ondas.' },
  { id: 'durnan_batch', npc: 'npc_durnan', title: 'Lote para a Fornalha', location: 'location_terran_forge', gate: 'vs_astravel_first_contact', items: [['drop_ruin_shard', 2], ['drop_mycelial_fiber', 2]], reason: 'Durnan compra matéria-prima para os trabalhos da fornalha.', source: 'Sentinelas na Vigília da Ruína e Horrores nas Ondas avançadas.' },
] as const

export const collectionContractDefinitions: QuestDefinition[] = contracts.map((entry) => {
  const turnInItems = entry.items.map(([itemId, quantity]) => ({ itemId, quantity }))
  const value = turnInItems.reduce((sum, input) => sum + itemDefinitions.find((item) => item.id === input.itemId)!.sellValue * input.quantity, 0)
  return {
    id: `delivery_${entry.id}`, title: entry.title, giverNpcId: entry.npc, turnInNpcId: entry.npc,
    category: 'secondary', summary: `${entry.reason} Recolha os materiais e entregue-os pessoalmente. Origem: ${entry.source}`,
    objectives: turnInItems.map((input) => ({ id: `${entry.id}_${input.itemId}`, type: 'collect', targetId: input.itemId,
      required: input.quantity, label: `Entregue ${input.quantity} × ${itemDefinitions.find((item) => item.id === input.itemId)!.name}` })),
    turnInItems, rewards: [{ type: 'gold', value: Math.ceil(value * 1.5) }],
    prerequisites: [{ type: 'questCompleted', questId: entry.gate }], initialStatus: 'locked',
    terranFlow: { active: 'location_terran_portal_plaza', ready_to_turn_in: entry.location }, status: 'CONTENT_DRAFT',
  }
})

export const collectionQuestIdsForNpc = (npcId: string) => collectionContractDefinitions
  .filter((quest) => quest.giverNpcId === npcId).map((quest) => quest.id)
