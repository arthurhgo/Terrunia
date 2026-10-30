import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BattleDicePlatform } from './BattleDicePlatform'

afterEach(() => { cleanup(); vi.useRealTimers() })

describe('Plataforma de dados em combate', () => {
  const roll = { id: 'battle_log_1', sides: 8 as const, face: 5, damage: 9, action: 'Ataque da arma' }

  it('anima o lançamento e revela o dano real do log após o dado assentar', () => {
    vi.useFakeTimers()
    render(<BattleDicePlatform roll={roll} reducedMotion={false} />)
    expect(screen.getByRole('img', { name: 'Dado d8' })).toBeInTheDocument()
    expect(screen.getByText('Rolando…')).toBeInTheDocument()
    act(() => { vi.advanceTimersByTime(800) })
    expect(screen.getByText('9 de dano')).toBeInTheDocument()
    expect(screen.getByText(/dano mostrado é o resultado real/)).toBeInTheDocument()
  })

  it('respeita redução de movimento e mostra o resultado sem animação', () => {
    render(<BattleDicePlatform roll={roll} reducedMotion />)
    expect(screen.getByText('9 de dano')).toBeInTheDocument()
    expect(screen.getByRole('status', { name: /Lançamento visual de d8/ })).toHaveClass('is-settled')
  })
})
