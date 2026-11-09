import type { TerranLocationId } from '../../content/terran'
import type { WorldPoint } from './pixelCityArt'
import { CLAN_HALL_MINI_PORTAL_ID, CLAN_CASTLE_DEFINITIONS, isClanCastleInteriorId, getClanCastleByInteriorId, type ClanCastleInteriorId } from '../../content/clanCastlesV05142'

export const PLAYER_HOME_INTERIOR_ID = 'interior_terririan_home' as const
export type TerranInteriorId = TerranLocationId | typeof PLAYER_HOME_INTERIOR_ID | ClanCastleInteriorId

export { PLAYER_HOME_CENTER, PLAYER_HOME_DOOR } from './cityWorld'

export type RoomFurniture = {
  id: string
  name: string
  point: WorldPoint
  behavior: 'inspect' | 'services' | 'rest' | 'storage' | 'archive' | 'quest' | 'portal'
  questId?: string
  description: string
}

/** VISUAL_DRAFT — objects are identified independently from canvas art or sprite paths. */
export const roomFurniture: Record<TerranInteriorId, readonly RoomFurniture[]> = {
  location_terran_forge: [
    { id: 'forge_furnace', name: 'Fornalha de Durnan', point: { x: 112, y: 91 }, behavior: 'inspect', description: 'Brasas arcanas alimentam a produção das ligas.' },
    { id: 'forge_anvil', name: 'Bigorna dos Vínculos', point: { x: 284, y: 191 }, behavior: 'services', description: 'Produza materiais ou aplique têmpera à sua arma.' },
  ],
  location_terran_eldamar_house: [
    { id: 'eldamar_archive', name: 'Estante dos Registros', point: { x: 111, y: 181 }, behavior: 'archive', description: 'Manuais do viajante, Arsenal Visual e registros de sistemas do mundo. Consulte os documentos nesta estante.' },
    { id: 'eldamar_desk', name: 'Mesa de Pesquisa', point: { x: 274, y: 181 }, behavior: 'services', description: 'Consulta aos serviços e registros desta instituição.' },
  ],
  location_terran_vorren_post: [
    { id: 'vorren_map', name: 'Mapa de Trilhas', point: { x: 88, y: 194 }, behavior: 'inspect', description: 'Rotas de Astravél estão marcadas junto a anotações de campo e avistamentos.' },
    { id: 'vorren_bestiary', name: 'Estante do Bestiário', point: { x: 255, y: 197 }, behavior: 'quest', questId: 'main_vorren_bestiary', description: 'Livros de campo interativos sobre criaturas e vestígios.' },
    { id: 'vorren_service_desk', name: 'Mesa de Vorren', point: { x: 310, y: 197 }, behavior: 'services', description: 'Consultar os serviços de Vorren.' },
  ],
  location_terran_bond_workshop: [
    { id: 'bond_anvil', name: 'Bigorna Rúnica', point: { x: 82, y: 195 }, behavior: 'inspect', description: 'Uma bigorna marcada por padrões arcanos. Os Vínculos evoluem, não são substituídos.' },
    { id: 'bond_inscription_table', name: 'Mesa da Marca de Astravél', point: { x: 238, y: 197 }, behavior: 'quest', questId: 'main_lithwynn_signs', description: 'Comparar vestígios e registrar uma hipótese para Lithwynn.' },
    { id: 'bond_station', name: 'Balcão Central do Mercado', point: { x: 310, y: 198 }, behavior: 'services', description: 'Consulte os serviços disponíveis. Para negociar, vender, converter ou evoluir itens, fale diretamente com os NPCs.' },
  ],
  location_terran_zareth_barracks: [
    { id: 'zareth_weapons', name: 'Arsenal do Quartel', point: { x: 92, y: 163 }, behavior: 'inspect', description: 'Equipamentos de treinamento e escudos de patrulha permanecem organizados.' },
    { id: 'zareth_reports', name: 'Relatórios da Guarda', point: { x: 291, y: 169 }, behavior: 'services', description: 'Ordens de patrulha e serviços do Quartel.' },
  ],
  location_terran_clan_hall: [
    { id: CLAN_HALL_MINI_PORTAL_ID, name:'Miniportal para a Base do Clã', point:{x:143,y:212},
      behavior:'portal',description:'O arco aparece depois de entregar o Emblema de Clã ao líder.' },
    { id: 'clan_banners', name: 'Estandartes dos Clãs', point: { x: 108, y: 125 }, behavior: 'inspect', description: 'Os estandartes representam caminhos que devem ser conquistados em jogo.' },
    { id: 'clan_echo_table', name: 'Mesa dos Ecos', point: { x: 192, y: 198 }, behavior: 'quest', questId: 'main_lore_identity_01', description: 'Anotações sobre Personagem, Clã e Classe; interpretar não concede filiação ou disciplina.' },
    { id: 'clan_initiation_table', name: 'Mesa de Iniciação', point: { x: 222, y: 194 }, behavior: 'quest', description: 'Aceite o convite de um líder e interaja com esta mesa. Depois entregue o relatório ao NPC do Clã.' },
    { id: 'clan_council', name: 'Mesa dos Representantes', point: { x: 250, y: 193 }, behavior: 'services', description: 'Representantes e mestres apresentam os requisitos de Clã e Classe.' },
  ],
  location_terran_daeryn_house: [
    { id: 'daeryn_herbs', name: 'Jardim de Ervas', point: { x: 96, y: 184 }, behavior: 'inspect', description: 'Ervas e frascos preparados para a recuperação de viajantes.' },
    { id: 'daeryn_healing_shelf', name: 'Estante de Cura', point: { x: 195, y: 201 }, behavior: 'quest', questId: 'main_terran_first_home', description: 'Organize os frascos de Vida, Mana e Antídoto antes de receber a chave.' },
    { id: 'daeryn_shop', name: 'Balcão de Sylwen', point: { x: 297, y: 194 }, behavior: 'services', description: 'Poções e suprimentos de campo da loja de Sylwen.' },
  ],
  location_terran_portal_plaza: [],
  ...Object.fromEntries(Object.values(CLAN_CASTLE_DEFINITIONS).map(castle=>[castle.interiorId,[
    {id:castle.interiorId+'_banner',name:'Estandarte de '+castle.name,point:{x:114,y:140},
      behavior:'inspect' as const,description:'Identidade visual provisória do Clã.'},
    {id:castle.interiorId+'_council',name:'Salão do Conselho — futuro',point:{x:253,y:139},
      behavior:'inspect' as const,description:'NPCs, missões e serviços de Clã serão adicionados em versões futuras.'},
    {id:castle.interiorId+'_return',name:'Portal de Retorno ao Salão',point:{x:192,y:213},
      behavior:'portal' as const,description:'Retornar ao Salão dos Clãs em Terran.'},
  ]])),
  interior_terririan_home: [
    { id: 'home_memories', name: 'Mesa das Memórias', point: { x: 141, y: 191 }, behavior: 'inspect', description: 'Um lugar reservado a lembranças de suas viagens. O arquivo de memórias será ampliado futuramente.' },
    { id: 'home_bed', name: 'Cama da Base', point: { x: 249, y: 189 }, behavior: 'rest', description: 'Descanso para recuperar Vida e Mana fora de combate.' },
    { id: 'home_chest', name: 'Baú da Base', point: { x: 190, y: 184 }, behavior: 'storage', description: 'Armazene itens temporários e materiais. Os cinco Vínculos permanecem com o Terrírian.' },
  ],
}

export const getRoomName = (id: TerranInteriorId) =>
  id === PLAYER_HOME_INTERIOR_ID ? 'Base do Terrírian' :
  isClanCastleInteriorId(id) ? getClanCastleByInteriorId(id)!.name :
  ({
    location_terran_forge: 'Casa do Ferreiro',
    location_terran_eldamar_house: 'Casa de Eldamar',
    location_terran_vorren_post: 'Posto de Vorren',
    location_terran_bond_workshop: 'Mercado',
    location_terran_zareth_barracks: 'Quartel de Zareth',
    location_terran_clan_hall: 'Salão dos Clãs',
    location_terran_daeryn_house: 'Casa de Daeryn',
    location_terran_portal_plaza: 'Praça do Portal',
  } satisfies Record<TerranLocationId, string>)[id]
