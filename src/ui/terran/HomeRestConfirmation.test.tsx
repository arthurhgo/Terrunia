import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { HomeRestConfirmation } from './HomeRestConfirmation'

afterEach(cleanup)

describe('v0.5.12 — descanso explícito na Base', () => {
  it('abrir a janela e Fechar nunca recuperam recursos', () => {
    const rest = vi.fn()
    const close = vi.fn()
    const { rerender } = render(<HomeRestConfirmation open={false} onRest={rest} onClose={close} />)
    expect(screen.queryByRole('button', { name: 'Descansar' })).not.toBeInTheDocument()
    rerender(<HomeRestConfirmation open onRest={rest} onClose={close} />)
    expect(rest).not.toHaveBeenCalled()
    fireEvent.click(screen.getAllByRole('button', { name: 'Fechar' }).at(-1)!)
    expect(close).toHaveBeenCalledTimes(1)
    expect(rest).not.toHaveBeenCalled()
  })

  it('somente o clique de Descansar dispara a recuperação uma vez', () => {
    const rest = vi.fn()
    render(<HomeRestConfirmation open onRest={rest} onClose={vi.fn()} />)
    expect(rest).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Descansar' }))
    expect(rest).toHaveBeenCalledTimes(1)
  })
})
