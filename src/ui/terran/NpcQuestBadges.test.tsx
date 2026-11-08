import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { NpcQuestBadges, type NpcQuestBadgeCounts } from './NpcQuestBadges'

afterEach(cleanup)

const counts = (overrides: Partial<NpcQuestBadgeCounts> = {}): NpcQuestBadgeCounts =>
  ({ main: 0, secondary: 0, active: 0, ready: 0, ...overrides })

describe('Terrúnia v0.5.12.1 — etiquetas inferiores de missão', () => {
  it('não mostra etiquetas para NPC sem missões em andamento, entregas ou ofertas', () => {
    const { container, rerender } = render(<NpcQuestBadges counts={null} />)
    expect(container.querySelector('.npc-nameplate__quest-counts')).toBeNull()
    rerender(<NpcQuestBadges counts={counts()} />)
    expect(container.querySelector('.npc-nameplate__quest-counts')).toBeNull()
  })

  it.each([
    [1, counts({ main: 2 })],
    [2, counts({ main: 2, ready: 1 })],
    [3, counts({ main: 2, secondary: 1, active: 3 })],
    [4, counts({ main: 2, secondary: 1, active: 3, ready: 1 })],
  ])('renderiza %i etiqueta(s) sem deixar espaços vazios', (quantity, value) => {
    const { container } = render(<NpcQuestBadges counts={value} />)
    expect(container.querySelectorAll('.npc-nameplate__quest-count')).toHaveLength(quantity)
    expect(container.querySelector('.npc-nameplate__quest-counts')).toBeInTheDocument()
  })

  it('usa apenas símbolo + quantidade, com classes e descrição das quatro cores', () => {
    const { container } = render(<NpcQuestBadges counts={counts({
      main: 2, secondary: 1, active: 3, ready: 1,
    })} />)
    const badges = Array.from(container.querySelectorAll<HTMLElement>('.npc-nameplate__quest-count'))
    expect(badges.map((badge) => badge.dataset.questState)).toEqual(['main', 'secondary', 'active', 'ready'])
    expect(badges.map((badge) => badge.textContent?.trim())).toEqual(['! 2', '! 1', '··· 3', '✓ 1'])
    expect(container.textContent).not.toMatch(/Principal|Secundária|Aceita|Entrega|Disponível/i)
    expect(badges[2]).toHaveAttribute('title', '3 missões aceitas')
    expect(badges[3]).toHaveAttribute('title', '1 missões prontas para entregar')
  })
})
