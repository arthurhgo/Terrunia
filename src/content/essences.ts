import type { EssenceComponentDefinition } from './types'

export const essenceComponentDefinitions = [
  {
    id: 'essence_fungal_weak',
    name: 'Essência Fúngica Fraca',
    description: 'Afinidade biológica inicial derivada de matéria Fungorra comum.',
    affinityTags: ['fungal', 'biological'],
    skillTreeHooks: ['weapon_fungal_memory'],
    visualTags: ['fungal', 'spore'],
    status: 'CONTENT_DRAFT',
  },
  {
    id: 'essence_mycelial',
    name: 'Essência Micelial',
    description: 'Componente de desenvolvimento obtido do Colosso Micélio para validar a primeira Infusão.',
    affinityTags: ['fungal', 'biological', 'mycelial'],
    skillTreeHooks: ['weapon_essence_channel', 'weapon_fungal_memory'],
    visualTags: ['mycelium', 'spore-glow'],
    status: 'CONTENT_DRAFT',
  },
] satisfies EssenceComponentDefinition[]
