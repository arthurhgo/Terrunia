import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { createNewSave } from '../../domain/game/createSave'
import { InventoryPanel } from './InventoryPanel'

const makeSave = () => {
  const save = createNewSave('one-item-owner', 'Lysa', 'character.terririan.default', content, '2026-11-03T15:00:00Z')
  save.inventory.push(
    { instanceId: 'first', definitionId: 'equipment_worn_linen_tunic', quantity: 1,
      rarity: 'common', locked: false, favorite: false, acquiredAt: save.createdAt },
    { instanceId: 'second', definitionId: 'equipment_apprentice_tunic', quantity: 1,
      rarity: 'common', locked: false, favorite: false, acquiredAt: save.createdAt },
  )
  return save
}

afterEach(cleanup)

describe('Inventário v0.15', () => {
  it('seleciona apenas um item por vez e expõe ação de equipar', () => {
    const save = makeSave()
    render(<InventoryPanel save={save} />)
    const first = screen.getByRole('button', { name: /Túnica de Linho Gasta/ })
    const second = screen.getByRole('button', { name: /Túnica de Aprendiz/ })
    fireEvent.click(first)
    expect(first).toHaveAttribute('aria-pressed', 'true')
    expect(second).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'Equipar Túnica de Linho Gasta' })).toBeEnabled()
    fireEvent.click(second)
    expect(first).toHaveAttribute('aria-pressed', 'false')
    expect(second).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByRole('button', { name: 'Equipar Túnica de Linho Gasta' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Equipar Túnica de Aprendiz' })).toBeEnabled()
    fireEvent.click(second)
    expect(second).toHaveAttribute('aria-pressed', 'false')
  })

  it('mostra tooltip de atributos, tier e refino em mouse e foco', () => {
    const save = makeSave()
    render(<InventoryPanel save={save} />)
    const first = screen.getByRole('button', { name: /Túnica de Linho Gasta/ })
    fireEvent.mouseEnter(first)
    const tooltip = screen.getByRole('tooltip', { name: 'Status de Túnica de Linho Gasta' })
    expect(tooltip).toHaveTextContent('Tier 1')
    expect(tooltip).toHaveTextContent('Defesa')
    expect(tooltip).toHaveTextContent('Refinamento')
    fireEvent.mouseLeave(first)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    fireEvent.focus(first)
    expect(screen.getByRole('tooltip')).toHaveTextContent('Iniciativa')
    fireEvent.blur(first)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('não mostra dicas de Lorian/Feril dentro dos detalhes do equipamento', () => {
    const save = makeSave()
    const { container } = render(<InventoryPanel save={save} />)
    fireEvent.click(screen.getByRole('button', { name: 'Túnica de Linho Gasta' }))
    const details = screen.getByRole('region', { name: 'Equipamento: Túnica de Linho Gasta' })
    expect(details).toHaveTextContent('Defesa')
    expect(screen.getByRole('button', { name: 'Equipar Túnica de Linho Gasta' })).toBeInTheDocument()
    expect(details).not.toHaveTextContent(/Peça reserva|Lorian|Feril|Mercado/)
    expect(container.querySelector('.inventory-item-purpose')).toBeNull()
  })

  it('mantém seleção única também no modo de venda', () => {
    const save = makeSave()
    render(<InventoryPanel save={save} tradeMode="sell" />)
    const first = screen.getByRole('button', { name: /Túnica de Linho Gasta/ })
    const second = screen.getByRole('button', { name: /Túnica de Aprendiz/ })
    fireEvent.click(first)
    fireEvent.click(second)
    expect(first).toHaveAttribute('aria-pressed', 'false')
    expect(second).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('1 item selecionado')).toBeInTheDocument()
  })
})
