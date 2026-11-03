import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { getNpcSubtitle } from './NpcNameplate'

describe('Identidade dos NPCs no cenário', () => {
  it('usa títulos canônicos e a função contextual sem inventar cargos', () => {
    const eldamar = content.terranLocations.location_terran_eldamar_house.npcPresences.find((p) => p.npcId === 'npc_eldamar')!
    expect(getNpcSubtitle(eldamar)).toBe('Mestre dos Registros')
    const durnan = content.terranLocations.location_terran_forge.npcPresences.find((p) => p.npcId === 'npc_durnan')!
    expect(getNpcSubtitle(durnan)).toContain('Ferreiro dos Vínculos')
    expect(getNpcSubtitle(durnan)).toContain('produção e têmpera')
    const lorian = content.terranLocations.location_terran_bond_workshop.npcPresences.find((p) => p.label === 'Lorian')!
    expect(getNpcSubtitle(lorian)).toBe('Conversão de drops em Essência')
  })
})
