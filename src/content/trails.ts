import type { TrailDefinition } from './types'
import { astravelCombatNodes } from './astravel'

export const trailDefinitions = [{
  id: 'trail_astravel_entry', name: 'Floresta de Astravél', regionId: 'astravel',
  actLabel: 'O Despertar das Sombras · 15 encontros',
  nodes: [{ id: 'astravel_entry', index: 0, type: 'entry', label: 'Entrada',
    description: 'O Portal conecta Terran à Borda Luminescente de Astravél.', position: { x: 12, y: 13 } },
    ...astravelCombatNodes],
  status: 'CONTENT_DRAFT',
}] satisfies TrailDefinition[]
