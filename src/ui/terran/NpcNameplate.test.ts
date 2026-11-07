import { describe, expect, it } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { createElement } from 'react'
import { afterEach } from 'vitest'
import { content } from '../../content/catalog'
import { streetNpcPresences } from '../../content/streetNpcs'
import { getNpcSubtitle, NpcNameplate } from './NpcNameplate'

afterEach(cleanup)

describe('Identidade dos NPCs no cenário', () => {
  it('usa títulos canônicos e a função contextual sem inventar cargos', () => {
    const eldamar = content.terranLocations.location_terran_eldamar_house.npcPresences.find((p) => p.npcId === 'npc_eldamar')!
    expect(getNpcSubtitle(eldamar)).toBe('Mestre dos Registros')
    const durnan = content.terranLocations.location_terran_forge.npcPresences.find((p) => p.npcId === 'npc_durnan')!
    expect(getNpcSubtitle(durnan)).toContain('Ferreiro dos Vínculos')
    expect(getNpcSubtitle(durnan)).toBe('Ferreiro dos Vínculos')
    const lorian = content.terranLocations.location_terran_bond_workshop.npcPresences.find((p) => p.label === 'Lorian')!
    expect(getNpcSubtitle(lorian)).toBe('Conversão de drops em Essência')
  })
  it('renderiza nome e título cadastrado dos NPCs de rua, sem inventar lore', () => {
    const presence = streetNpcPresences.find((entry) => entry.npcId === 'npc_street_arlen')!
    expect(getNpcSubtitle(presence)).toBe('Mensageiro de Terran')
    const { container } = render(createElement(NpcNameplate, { presence }))
    const label = container.querySelector('.npc-nameplate')!
    expect(label.querySelector('.npc-nameplate__name')).toHaveTextContent('Arlen')
    expect(label.querySelector('.npc-nameplate__subtitle')).toHaveTextContent('Mensageiro de Terran')
    expect(label).toHaveAttribute('title', 'Arlen · Mensageiro de Terran')
    expect(label.children).toHaveLength(2)
  })

  it('posiciona marcador de missão antes do nome, na mesma linha', () => {
    const presence = streetNpcPresences.find((entry) => entry.npcId === 'npc_street_arlen')!
    const { container } = render(createElement(NpcNameplate, { presence, marker: '◇' }))
    const heading = container.querySelector('.npc-nameplate__heading')!
    expect(heading.firstElementChild).toHaveClass('npc-quest-marker')
    expect(heading.lastElementChild).toHaveClass('npc-nameplate__name')
  })

  it('exibe Rosetta / Guardiã do Portal em duas linhas, sem concatenar a função do NPC', () => {
    const presence = content.terranLocations.location_terran_portal_plaza.npcPresences
      .find((entry) => entry.id === 'presence_rosetta')!
    expect(getNpcSubtitle(presence)).toBe('Guardiã do Portal')
    const { container } = render(createElement(NpcNameplate, { presence }))
    const label = container.querySelector('.npc-nameplate')!
    expect(label.querySelector('.npc-nameplate__name')).toHaveTextContent('Rosetta')
    expect(label.querySelector('.npc-nameplate__subtitle')).toHaveTextContent('Guardiã do Portal')
    expect(label.children).toHaveLength(2)
    expect(label.textContent).not.toContain('Orientação do aventureiro')
    expect(screen.getByText('Guardiã do Portal')).toBeInTheDocument()
  })

})
