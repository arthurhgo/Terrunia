import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
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
    expect(screen.getByText(/Face registrada pelo motor de combate/)).toBeInTheDocument()
  })

  it('aguarda arrastar para cima e soltar sem revelar o valor antes do lançamento', () => {
    vi.useFakeTimers()
    const onRoll = vi.fn()
    const { rerender } = render(<BattleDicePlatform roll={roll} reducedMotion={false} awaitingClick onRoll={onRoll} />)
    expect(screen.getByRole('button', { name: /Arrastar dado d8 para cima/ })).toBeInTheDocument()
    expect(screen.getByText('Arraste para cima e solte')).toBeInTheDocument()
    act(() => { vi.advanceTimersByTime(2000) })
    expect(screen.queryByText('9 de dano')).not.toBeInTheDocument()
    const trigger = screen.getByRole('button', { name: /Arrastar dado d8 para cima/ })
    fireEvent.click(trigger)
    expect(onRoll).not.toHaveBeenCalled()
    fireEvent.pointerDown(trigger, { pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0, clientY: 150 })
    fireEvent.pointerMove(trigger, { pointerId: 1, pointerType: 'mouse', isPrimary: true, clientY: 70 })
    fireEvent.pointerUp(trigger, { pointerId: 1, pointerType: 'mouse', isPrimary: true, clientY: 70 })
    expect(onRoll).toHaveBeenCalledOnce()
    rerender(<BattleDicePlatform roll={roll} reducedMotion={false} awaitingClick={false} onRoll={onRoll} />)
    act(() => { vi.advanceTimersByTime(800) })
    expect(screen.getByText('9 de dano')).toBeInTheDocument()
  })

  it('respeita redução de movimento e mostra o resultado sem animação', () => {
    render(<BattleDicePlatform roll={roll} reducedMotion />)
    expect(screen.getByText('9 de dano')).toBeInTheDocument()
    expect(screen.getByRole('status', { name: /Lançamento visual de d8/ })).toHaveClass('is-settled')
  })
})
