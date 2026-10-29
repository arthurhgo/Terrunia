import type { DungeonDefinition } from './types'

/** CONTENT_DRAFT: rooms, geometry and narrative are an explorable first pass. */
export const dungeonDefinitions = [
  {
    id: 'dungeon_fungal_chambers',
    name: 'Câmaras Fúngicas de Astravél',
    entryTrailNodeId: 'astravel_ruin_threshold_05',
    bossTrailNodeId: 'astravel_boss_preview',
    rooms: [
      {
        id: 'fungal_vestibule', name: 'Vestíbulo Micelial', kind: 'entry',
        description: 'Pedras úmidas descem até um piso de raízes antigas. O Portal ficou para trás; as paredes respiram esporos.',
        rect: { x: 16, y: 160, width: 104, height: 80 }, landmark: { x: 62, y: 202 },
      },
      {
        id: 'fungal_spore_gallery', name: 'Galeria dos Esporos', kind: 'spores',
        description: 'Fungos translúcidos iluminam os túneis. O ar oscila com partículas que não pertencem à floresta.',
        rect: { x: 104, y: 112, width: 120, height: 128 }, landmark: { x: 162, y: 178 },
      },
      {
        id: 'fungal_root_sanctum', name: 'Santuário das Raízes', kind: 'roots',
        description: 'Raízes negras envolvem runas partidas. A Entropia converge para a câmara mais profunda.',
        rect: { x: 208, y: 72, width: 120, height: 112 }, landmark: { x: 274, y: 132 },
      },
      {
        id: 'fungal_core', name: 'Núcleo da Ruína', kind: 'boss',
        description: 'No coração micelial, a massa ancestral do Colosso bloqueia a anomalia fúngica.',
        rect: { x: 256, y: 16, width: 112, height: 88 }, landmark: { x: 322, y: 54 },
      },
    ],
    status: 'CONTENT_DRAFT',
  },
] satisfies DungeonDefinition[]
