import type { TerranLocationId } from '../../content/terran'
import type { WorldPoint } from './pixelCityArt'

export const PLAYER_HOME_INTERIOR_ID = 'interior_terririan_home' as const
export type TerranInteriorId = TerranLocationId | typeof PLAYER_HOME_INTERIOR_ID

export const PLAYER_HOME_CENTER: WorldPoint = { x: 192, y: 53 }
export const PLAYER_HOME_DOOR: WorldPoint = { x: 192, y: 80 }

export type RoomFurniture = {
  id: string
  name: string
  point: WorldPoint
  behavior: 'inspect' | 'services' | 'rest' | 'storage' | 'archive'
  description: string
}

/** VISUAL_DRAFT — objects are identified independently from canvas art or sprite paths. */
export const roomFurniture: Record<TerranInteriorId, readonly RoomFurniture[]> = {
  location_terran_eldamar_house: [
    { id: 'eldamar_archive', name: 'Estante dos Registros', point: { x: 111, y: 181 }, behavior: 'archive', description: 'Manuais do viajante, Arsenal Visual e registros de sistemas do mundo. Consulte os documentos nesta estante.' },
    { id: 'eldamar_desk', name: 'Mesa de Pesquisa', point: { x: 274, y: 181 }, behavior: 'services', description: 'Consulta aos serviços e registros desta instituição.' },
  ],
  location_terran_vorren_post: [
    { id: 'vorren_map', name: 'Mapa de Trilhas', point: { x: 88, y: 194 }, behavior: 'inspect', description: 'Rotas de Astravél estão marcadas junto a anotações de campo e avistamentos.' },
    { id: 'vorren_bestiary', name: 'Bestiário', point: { x: 301, y: 197 }, behavior: 'services', description: 'Consulta ao Bestiário e aos serviços de Vorren.' },
  ],
  location_terran_bond_workshop: [
    { id: 'bond_anvil', name: 'Bigorna Rúnica', point: { x: 82, y: 195 }, behavior: 'inspect', description: 'Uma bigorna marcada por padrões arcanos. Os Vínculos evoluem, não são substituídos.' },
    { id: 'bond_station', name: 'Balcão Central do Mercado', point: { x: 310, y: 198 }, behavior: 'services', description: 'Consulte os serviços disponíveis. Para negociar, vender, converter ou evoluir itens, fale diretamente com os NPCs.' },
  ],
  location_terran_zareth_barracks: [
    { id: 'zareth_weapons', name: 'Arsenal do Quartel', point: { x: 92, y: 163 }, behavior: 'inspect', description: 'Equipamentos de treinamento e escudos de patrulha permanecem organizados.' },
    { id: 'zareth_reports', name: 'Relatórios da Guarda', point: { x: 291, y: 169 }, behavior: 'services', description: 'Ordens de patrulha e serviços do Quartel.' },
  ],
  location_terran_clan_hall: [
    { id: 'clan_banners', name: 'Estandartes dos Clãs', point: { x: 108, y: 125 }, behavior: 'inspect', description: 'Os estandartes representam caminhos que devem ser conquistados em jogo.' },
    { id: 'clan_council', name: 'Mesa dos Representantes', point: { x: 250, y: 193 }, behavior: 'services', description: 'Representantes e mestres apresentam os requisitos de Clã e Classe.' },
  ],
  location_terran_daeryn_house: [
    { id: 'daeryn_herbs', name: 'Jardim de Ervas', point: { x: 96, y: 184 }, behavior: 'inspect', description: 'Ervas e frascos preparados para a recuperação de viajantes.' },
    { id: 'daeryn_shop', name: 'Balcão de Sylwen', point: { x: 297, y: 194 }, behavior: 'services', description: 'Poções e suprimentos de campo da loja de Sylwen.' },
  ],
  location_terran_portal_plaza: [],
  interior_terririan_home: [
    { id: 'home_memories', name: 'Mesa das Memórias', point: { x: 141, y: 191 }, behavior: 'inspect', description: 'Um lugar reservado a lembranças de suas viagens. O arquivo de memórias será ampliado futuramente.' },
    { id: 'home_bed', name: 'Cama da Base', point: { x: 249, y: 189 }, behavior: 'rest', description: 'Descanso para recuperar Vida e Mana fora de combate.' },
    { id: 'home_chest', name: 'Baú da Base', point: { x: 190, y: 184 }, behavior: 'storage', description: 'Armazene itens temporários e materiais. Os cinco Vínculos permanecem com o Terrírian.' },
  ],
}

export const getRoomName = (id: TerranInteriorId) =>
  id === PLAYER_HOME_INTERIOR_ID ? 'Base do Terrírian' :
  ({
    location_terran_eldamar_house: 'Casa de Eldamar',
    location_terran_vorren_post: 'Posto de Vorren',
    location_terran_bond_workshop: 'Mercado',
    location_terran_zareth_barracks: 'Quartel de Zareth',
    location_terran_clan_hall: 'Salão dos Clãs',
    location_terran_daeryn_house: 'Casa de Daeryn',
    location_terran_portal_plaza: 'Praça do Portal',
  } satisfies Record<TerranLocationId, string>)[id]
