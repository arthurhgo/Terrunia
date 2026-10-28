import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { EquipmentCatalog } from './EquipmentCatalog'

afterEach(cleanup)

describe('catálogo de equipamento visual', () => {
  it('mostra sete armas, e troca entre famílias de vínculo sem equipar', () => {
    render(<EquipmentCatalog />)
    const catalog = screen.getByRole('group', { name: 'Tipos de equipamento' })
    expect(within(catalog).getByRole('button', { name: /Armas/ })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /Machado de Guerra/ })).toBeInTheDocument()
    fireEvent.click(within(catalog).getByRole('button', { name: /Armaduras/ }))
    expect(screen.getByRole('button', { name: /Armadura de Couro/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Machado de Guerra/ })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Armadura de Placas/ }))
    expect(screen.getByText('Estudo visual de peitoral pesado.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /equipar/i })).not.toBeInTheDocument()
  })
})
